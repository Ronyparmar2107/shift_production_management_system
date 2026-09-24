using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;
using System.Runtime.CompilerServices;
namespace SPMS.Server.Services
{

    public interface IPlanService
    {
        Task<PlanDto> CreatePlanAsync(PlanDto plan);
        Task<PlanDto> GetPlanByEmployeeAsync();
        Task<bool> AcceptPlanAsync(PlanDto planDto);
        Task<bool> UpdateAndAcceptPlanAsync(PlanDto planDto);
    }
    public class PlanService: IPlanService
    {
        private readonly CurrentUserService _currentUserService;
        private readonly AppDbContext _dbcontext;
        private readonly IShiftService _shiftService;


        public PlanService(CurrentUserService currentUserService, AppDbContext appDbContext, IShiftService shiftService)
        {
            _currentUserService = currentUserService;
            _dbcontext = appDbContext;
            _shiftService = shiftService;
        }
        public async Task<PlanDto> CreatePlanAsync(PlanDto plan)
        {
            var shift = await _shiftService.GetorCreateShiftAsync(new ShiftDto { Date = plan.Date, ShiftType = plan.ShiftType });

            var AreaId = await _dbcontext.AreaMasters.FirstOrDefaultAsync(p => p.AreaName == plan.Area);
            var planType = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Type == plan.PlanType);
            var crewId = await _dbcontext.CrewMasters.FirstOrDefaultAsync(p=>p.LeadEmpId == plan.CrewLeadId);

            PlanMaster newPlan = new PlanMaster
            {
                ShiftId = shift.Id,
                PlannedStart = plan.StartTime,
                PlannedEnd = plan.EndTime,
                AreaId = AreaId.Id,
                TypeId = planType.Id,
                CrewId = crewId.Id,
                CreatedBy = _currentUserService.EmployeeId
            };

            await _dbcontext.AddAsync(newPlan);
            await _dbcontext.SaveChangesAsync();

            plan.Id = newPlan.Id;

        return plan;
        }

        public async Task<PlanDto> GetPlanByEmployeeAsync()
        {
            var crew = await _dbcontext.CrewMasters.FirstOrDefaultAsync(p=> p.LeadEmpId == _currentUserService.EmployeeId);
            if(crew == null)
            {
                return new PlanDto { Id = 0 };
            }

            var plan = await _dbcontext.PlanMasters.FirstOrDefaultAsync(p => p.CrewId == crew.Id);

            if(plan == null)
            {
                return new PlanDto { Id = 0 };
            }

            var area = await _dbcontext.AreaMasters.FirstOrDefaultAsync(p=>p.Id == plan.AreaId);
            var type = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Id == plan.TypeId);

            var shift = await _dbcontext.ShiftMasters.FirstOrDefaultAsync(p=> p.Id == plan.ShiftId);

            PlanDto planDto = new PlanDto
            {
                Id = plan.Id,
                CrewLeadId = crew.LeadEmpId,
                Area = area.AreaName,
                PlanType = type.Type,
                Target = plan.Target,
                Comment = plan.Comment,
                ShiftType = shift.Type,
                Date = shift.Date,
                StartTime = plan.PlannedStart,
                EndTime = plan.PlannedEnd
            };

            return planDto;
        }

        public async Task<bool> AcceptPlanAsync(PlanDto planDto)
        {
            var plan = await _dbcontext.PlanMasters.FirstOrDefaultAsync(p=> p.Id == planDto.Id);
            if (plan == null)
            {
                return false;
            }

            plan.AcceptedAt = DateTime.Now;
            plan.IsAccepted = true;
            plan.AcceptedBy = _currentUserService.EmployeeId;

            await _dbcontext.AddAsync(plan);
            await _dbcontext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateAndAcceptPlanAsync(PlanDto planDto)
        {
            var plan = await _dbcontext.PlanMasters.FirstOrDefaultAsync(p => p.Id == planDto.Id);
            if (plan == null)
            {
                return false;
            }

            plan.PlannedStart = planDto.StartTime;
            plan.PlannedEnd = planDto.EndTime;
            
            var area = await _dbcontext.AreaMasters.FirstOrDefaultAsync(p=> p.AreaName == planDto.Area);
            plan.AreaId = area?.Id;

            var type = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Type == planDto.PlanType);

            plan.TypeId = type?.Id;
            plan.Target = planDto.Target;

            plan.AcceptedAt = DateTime.Now;
            plan.IsAccepted = true;
            plan.AcceptedBy = _currentUserService.EmployeeId;
            plan.UpdatedAt = DateTime.Now;
            plan.UpdatedBy = _currentUserService.EmployeeId;
            plan.IsUpdated = true;

            await _dbcontext.AddAsync(plan);
            await _dbcontext.SaveChangesAsync();

            return true;
        }
    }
}
