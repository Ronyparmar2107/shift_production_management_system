using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{
    public interface IPlanTypeService
    {
        Task<List<PlanTypeDto>> GetAllPlanTypesAsync();
        Task<(PlanTypeDto? Result, string? Error)> CreatePlanTypeAsync(SavePlanTypeDto dto);
        Task<(PlanTypeDto? Result, string? Error)> UpdatePlanTypeAsync(SavePlanTypeDto dto);
        Task<string?> DeletePlanTypeAsync(long planTypeId);
    }

    public class PlanTypeService : IPlanTypeService
    {
        private readonly AppDbContext _dbcontext;
        private readonly CurrentUserService _currentUser;

        public PlanTypeService(AppDbContext dbcontext, CurrentUserService currentUser)
        {
            _dbcontext = dbcontext;
            _currentUser = currentUser;
        }

        private static PlanTypeDto ToDto(PlanTypeMaster p) => new PlanTypeDto
        {
            PlanTypeId = p.Id,
            Type = p.Type ?? "",
            Unit = p.Unit ?? ""
        };

        public async Task<List<PlanTypeDto>> GetAllPlanTypesAsync()
        {
            return await _dbcontext.PlanTypeMasters
                .Where(p => !p.IsDeleted)
                .OrderBy(p => p.Id)
                .Select(p => new PlanTypeDto
                {
                    PlanTypeId = p.Id,
                    Type = p.Type ?? "",
                    Unit = p.Unit ?? ""
                })
                .ToListAsync();
        }

        // Shared checks for create and update; returns the cleaned values or an error
        private async Task<(string? Type, string? Unit, string? Error)> ValidateAsync(SavePlanTypeDto dto, long? ignoreId)
        {
            var type = dto.Type?.Trim();
            var unit = dto.Unit?.Trim();

            if (string.IsNullOrWhiteSpace(type))
                return (null, null, "Plan type name is required");

            if (string.IsNullOrWhiteSpace(unit))
                return (null, null, "Unit is required");

            var duplicate = await _dbcontext.PlanTypeMasters
                .AnyAsync(p => !p.IsDeleted && p.Type == type && p.Id != ignoreId);

            if (duplicate)
                return (null, null, "A plan type with this name already exists");

            return (type, unit, null);
        }

        public async Task<(PlanTypeDto? Result, string? Error)> CreatePlanTypeAsync(SavePlanTypeDto dto)
        {
            var (type, unit, error) = await ValidateAsync(dto, null);
            if (error != null)
                return (null, error);

            var planType = new PlanTypeMaster
            {
                Type = type,
                Unit = unit,
                CreatedBy = _currentUser.EmployeeId
            };

            _dbcontext.PlanTypeMasters.Add(planType);
            await _dbcontext.SaveChangesAsync();

            return (ToDto(planType), null);
        }

        public async Task<(PlanTypeDto? Result, string? Error)> UpdatePlanTypeAsync(SavePlanTypeDto dto)
        {
            var planType = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Id == dto.PlanTypeId && !p.IsDeleted);
            if (planType == null)
                return (null, "Plan type not found");

            var (type, unit, error) = await ValidateAsync(dto, planType.Id);
            if (error != null)
                return (null, error);

            planType.Type = type;
            planType.Unit = unit;
            planType.IsUpdated = true;
            planType.UpdatedAt = DateTime.UtcNow;
            planType.UpdatedBy = _currentUser.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return (ToDto(planType), null);
        }

        public async Task<string?> DeletePlanTypeAsync(long planTypeId)
        {
            var planType = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Id == planTypeId && !p.IsDeleted);
            if (planType == null)
                return "Plan type not found";

            var inUse = await _dbcontext.PlanMasters.AnyAsync(p => p.TypeId == planTypeId && !p.IsDeleted);
            if (inUse)
                return "This plan type is used by existing plans and cannot be deleted";

            planType.IsDeleted = true;
            planType.DeletedAt = DateTime.UtcNow;
            planType.DeletedBy = _currentUser.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return null;
        }
    }
}
