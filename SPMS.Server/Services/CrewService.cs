using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{
    public interface ICrewService
    {
        Task<List<CrewDto>> GetAllCrewsAsync();
        Task<List<CrewLeadDto>> GetCrewLeadsAsync();
        Task<(CrewDto? Result, string? Error)> CreateCrewAsync(SaveCrewDto dto);
        Task<(CrewDto? Result, string? Error)> UpdateCrewAsync(SaveCrewDto dto);
        Task<string?> DeleteCrewAsync(long crewId);
    }

    public class CrewService : ICrewService
    {
        // Must match the role name in role_master
        private const string CrewLeadRole = "CrewLead";

        private readonly AppDbContext _dbcontext;
        private readonly CurrentUserService _currentUser;

        public CrewService(AppDbContext dbcontext, CurrentUserService currentUser)
        {
            _dbcontext = dbcontext;
            _currentUser = currentUser;
        }

        private IQueryable<CrewDto> CrewQuery() =>
            from c in _dbcontext.CrewMasters
            where !c.IsDeleted
            join e in _dbcontext.EmpMasters on c.LeadEmpId equals e.Id into emps
            from e in emps.DefaultIfEmpty()
            orderby c.Id
            select new CrewDto
            {
                CrewId = c.Id,
                LeadEmpId = c.LeadEmpId,
                LeadName = e != null ? e.Name ?? "" : "",
                LeadEmployeeNumber = e != null ? e.EmployeeNumber : null
            };

        private static void SetName(CrewDto crew) => crew.CrewName = $"Crew {crew.CrewId}";

        public async Task<List<CrewDto>> GetAllCrewsAsync()
        {
            var crews = await CrewQuery().ToListAsync();
            crews.ForEach(SetName);
            return crews;
        }

        public async Task<List<CrewLeadDto>> GetCrewLeadsAsync()
        {
            return await (
                from e in _dbcontext.EmpMasters
                where !e.IsDeleted && e.IsActive != false
                join r in _dbcontext.RoleMasters on e.RoleId equals r.Id
                where r.Role == CrewLeadRole && r.IsActive && !r.IsDeleted
                orderby e.Name
                select new CrewLeadDto
                {
                    EmpId = e.Id,
                    Name = e.Name ?? "",
                    EmployeeNumber = e.EmployeeNumber,
                    CrewId = _dbcontext.CrewMasters
                        .Where(c => !c.IsDeleted && c.LeadEmpId == e.Id)
                        .Select(c => (long?)c.Id)
                        .FirstOrDefault()
                }).ToListAsync();
        }

        // The lead must be an active CrewLead who doesn't already lead another crew
        private async Task<string?> ValidateLeadAsync(long leadEmpId, long? ignoreCrewId)
        {
            var lead = await _dbcontext.EmpMasters
                .FirstOrDefaultAsync(e => e.Id == leadEmpId && !e.IsDeleted && e.IsActive != false);

            if (lead == null)
                return "Crew lead not found or inactive";

            var role = await _dbcontext.RoleMasters
                .FirstOrDefaultAsync(r => r.Id == lead.RoleId && r.IsActive && !r.IsDeleted);

            if (role?.Role != CrewLeadRole)
                return "Selected employee is not a crew lead";

            var alreadyLeads = await _dbcontext.CrewMasters
                .AnyAsync(c => !c.IsDeleted && c.LeadEmpId == leadEmpId && c.Id != ignoreCrewId);

            if (alreadyLeads)
                return "This crew lead already has a crew";

            return null;
        }

        private async Task<CrewDto> GetCrewDtoAsync(long crewId)
        {
            var dto = await CrewQuery().FirstAsync(c => c.CrewId == crewId);
            SetName(dto);
            return dto;
        }

        public async Task<(CrewDto? Result, string? Error)> CreateCrewAsync(SaveCrewDto dto)
        {
            var error = await ValidateLeadAsync(dto.LeadEmpId, null);
            if (error != null)
                return (null, error);

            var crew = new CrewMaster
            {
                LeadEmpId = dto.LeadEmpId,
                CreatedBy = _currentUser.EmployeeId
            };

            _dbcontext.CrewMasters.Add(crew);
            await _dbcontext.SaveChangesAsync();

            return (await GetCrewDtoAsync(crew.Id), null);
        }

        public async Task<(CrewDto? Result, string? Error)> UpdateCrewAsync(SaveCrewDto dto)
        {
            var crew = await _dbcontext.CrewMasters.FirstOrDefaultAsync(c => c.Id == dto.CrewId && !c.IsDeleted);

            if (crew == null)
                return (null, "Crew not found");

            var error = await ValidateLeadAsync(dto.LeadEmpId, crew.Id);
            if (error != null)
                return (null, error);

            crew.LeadEmpId = dto.LeadEmpId;
            crew.IsUpdated = true;
            crew.UpdatedAt = DateTime.UtcNow;
            crew.UpdatedBy = _currentUser.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return (await GetCrewDtoAsync(crew.Id), null);
        }

        public async Task<string?> DeleteCrewAsync(long crewId)
        {
            var crew = await _dbcontext.CrewMasters.FirstOrDefaultAsync(c => c.Id == crewId && !c.IsDeleted);

            if (crew == null)
                return "Crew not found";

            var hasPlans = await _dbcontext.PlanMasters.AnyAsync(p => p.CrewId == crewId && !p.IsDeleted);
            if (hasPlans)
                return "This crew has plans and cannot be deleted";

            crew.IsDeleted = true;
            crew.DeletedAt = DateTime.UtcNow;
            crew.DeletedBy = _currentUser.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return null;
        }
    }
}
