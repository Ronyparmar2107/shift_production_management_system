using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;
using System.Runtime.CompilerServices;
namespace SPMS.Server.Services
{

    public interface IPlanService
    {
        Task<(PlanDto? Result, string? Error)> CreatePlanAsync(PlanDto plan);
        Task<List<PlanTypeDto>> GetPlanTypesAsync();
        Task<List<PlanStatusDto>> GetMyCreatedPlansAsync();
        Task<List<PlanStatusDto>> GetCrewPlansAsync();
        Task<PlanDto> GetPlanByEmployeeAsync();
        // Return null on success, otherwise the error message
        Task<string?> AcceptPlanAsync(PlanDto planDto);
        Task<string?> UpdateAndAcceptPlanAsync(PlanDto planDto);
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
        public async Task<List<PlanTypeDto>> GetPlanTypesAsync()
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

        public async Task<(PlanDto? Result, string? Error)> CreatePlanAsync(PlanDto plan)
        {
            // Validate everything first so a bad request never leaves an orphan shift behind
            if (plan.Date == null)
                return (null, "Date is required");

            if (string.IsNullOrWhiteSpace(plan.ShiftType))
                return (null, "Shift is required");

            if (plan.Target == null || plan.Target <= 0)
                return (null, "Target must be greater than zero");

            if (plan.StartTime == null || plan.EndTime == null)
                return (null, "Planned start and end time are required");

            if (plan.EndTime <= plan.StartTime)
                return (null, "End time must be after start time");

            var area = await _dbcontext.AreaMasters.FirstOrDefaultAsync(p => p.AreaName == plan.Area && !p.IsDeleted);
            if (area == null)
                return (null, "Selected area does not exist");

            var planType = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Type == plan.PlanType && !p.IsDeleted);
            if (planType == null)
                return (null, "Selected plan type does not exist");

            var crew = await _dbcontext.CrewMasters.FirstOrDefaultAsync(p => p.LeadEmpId == plan.CrewLeadId && !p.IsDeleted);
            if (crew == null)
                return (null, "Selected crew does not exist");

            var shift = await _shiftService.GetorCreateShiftAsync(new ShiftDto { Date = plan.Date, ShiftType = plan.ShiftType });

            // Guard against double submits: same crew, area and activity in the same shift
            var duplicate = await _dbcontext.PlanMasters.AnyAsync(p =>
                !p.IsDeleted && p.ShiftId == shift.Id && p.CrewId == crew.Id &&
                p.AreaId == area.Id && p.TypeId == planType.Id);

            if (duplicate)
                return (null, "A plan for this crew, area and activity already exists in this shift");

            PlanMaster newPlan = new PlanMaster
            {
                ShiftId = shift.Id,
                PlannedStart = plan.StartTime,
                PlannedEnd = plan.EndTime,
                AreaId = area.Id,
                TypeId = planType.Id,
                CrewId = crew.Id,
                Target = plan.Target,
                Comment = plan.Comment,
                CreatedBy = _currentUserService.EmployeeId
            };

            await _dbcontext.AddAsync(newPlan);
            await _dbcontext.SaveChangesAsync();

            plan.Id = newPlan.Id;

            return (plan, null);
        }

        // Plans created by the signed-in user, newest first, with acceptance status
        public async Task<List<PlanStatusDto>> GetMyCreatedPlansAsync()
        {
            var me = _currentUserService.EmployeeId;

            var plans = await _dbcontext.PlanMasters
                .Where(p => !p.IsDeleted && p.CreatedBy == me)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .ToListAsync();

            return await BuildPlanStatusesAsync(plans);
        }

        // Plans assigned to the crew(s) the signed-in crew lead leads — unaccepted first, then newest
        public async Task<List<PlanStatusDto>> GetCrewPlansAsync()
        {
            var me = _currentUserService.EmployeeId;
            if (me == null)
                return new List<PlanStatusDto>();

            var myCrewIds = await _dbcontext.CrewMasters
                .Where(c => !c.IsDeleted && c.LeadEmpId == me)
                .Select(c => (long?)c.Id)
                .ToListAsync();

            if (myCrewIds.Count == 0)
                return new List<PlanStatusDto>();

            var plans = await _dbcontext.PlanMasters
                .Where(p => !p.IsDeleted && myCrewIds.Contains(p.CrewId))
                .OrderBy(p => p.IsAccepted)
                .ThenByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .ToListAsync();

            return await BuildPlanStatusesAsync(plans);
        }

        private async Task<List<PlanStatusDto>> BuildPlanStatusesAsync(List<PlanMaster> plans)
        {
            if (plans.Count == 0)
                return new List<PlanStatusDto>();

            var shiftIds = plans.Select(p => p.ShiftId).Distinct().ToList();
            var areaIds = plans.Select(p => p.AreaId).Distinct().ToList();
            var typeIds = plans.Select(p => p.TypeId).Distinct().ToList();
            var crewIds = plans.Select(p => p.CrewId).Distinct().ToList();

            var shifts = await _dbcontext.ShiftMasters.Where(s => shiftIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id);
            var areas = await _dbcontext.AreaMasters.Where(a => areaIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id);
            var types = await _dbcontext.PlanTypeMasters.Where(t => typeIds.Contains(t.Id)).ToDictionaryAsync(t => t.Id);
            var crews = await _dbcontext.CrewMasters.Where(c => crewIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id);

            var empIds = crews.Values.Select(c => c.LeadEmpId)
                .Concat(plans.Select(p => p.AcceptedBy))
                .Where(id => id != null)
                .Distinct()
                .ToList();
            var emps = await _dbcontext.EmpMasters.Where(e => empIds.Contains(e.Id)).ToDictionaryAsync(e => e.Id, e => e.Name ?? "");

            string EmpName(long? id) => id != null && emps.TryGetValue(id.Value, out var n) ? n : "";

            return plans.Select(p =>
            {
                shifts.TryGetValue(p.ShiftId ?? 0, out var shift);
                areas.TryGetValue(p.AreaId ?? 0, out var area);
                types.TryGetValue(p.TypeId ?? 0, out var type);
                crews.TryGetValue(p.CrewId ?? 0, out var crew);

                return new PlanStatusDto
                {
                    PlanId = p.Id,
                    Date = shift?.Date,
                    ShiftType = shift?.Type ?? "",
                    CrewName = crew != null ? $"Crew {crew.Id}" : "",
                    LeadName = EmpName(crew?.LeadEmpId),
                    Area = area?.AreaName ?? "",
                    PlanType = type?.Type ?? "",
                    Unit = type?.Unit ?? "",
                    Target = p.Target,
                    StartTime = p.PlannedStart,
                    EndTime = p.PlannedEnd,
                    Comment = p.Comment,
                    Status = !p.IsAccepted ? "Pending" : (p.IsUpdated ? "Accepted with changes" : "Accepted"),
                    AcceptedByName = p.IsAccepted ? EmpName(p.AcceptedBy) : null,
                    AcceptedAt = p.AcceptedAt,
                    CreatedAt = p.CreatedAt
                };
            }).ToList();
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

        // The plan must exist, belong to a crew led by the signed-in user, and not be accepted yet
        private async Task<(PlanMaster? Plan, string? Error)> GetPlanForLeadAsync(long planId)
        {
            var me = _currentUserService.EmployeeId;

            var plan = await _dbcontext.PlanMasters.FirstOrDefaultAsync(p => p.Id == planId && !p.IsDeleted);
            if (plan == null)
                return (null, "Plan not found");

            var crew = await _dbcontext.CrewMasters.FirstOrDefaultAsync(c => c.Id == plan.CrewId && !c.IsDeleted);
            if (me == null || crew == null || crew.LeadEmpId != me)
                return (null, "This plan is not assigned to your crew");

            if (plan.IsAccepted)
                return (null, "This plan has already been accepted");

            return (plan, null);
        }

        public async Task<string?> AcceptPlanAsync(PlanDto planDto)
        {
            var (plan, error) = await GetPlanForLeadAsync(planDto.Id);
            if (plan == null)
                return error;

            plan.AcceptedAt = DateTime.Now;
            plan.IsAccepted = true;
            plan.AcceptedBy = _currentUserService.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return null;
        }

        public async Task<string?> UpdateAndAcceptPlanAsync(PlanDto planDto)
        {
            var (plan, error) = await GetPlanForLeadAsync(planDto.Id);
            if (plan == null)
                return error;

            if (planDto.Target == null || planDto.Target <= 0)
                return "Target must be greater than zero";

            if (planDto.StartTime == null || planDto.EndTime == null)
                return "Planned start and end time are required";

            if (planDto.EndTime <= planDto.StartTime)
                return "End time must be after start time";

            var area = await _dbcontext.AreaMasters.FirstOrDefaultAsync(p => p.AreaName == planDto.Area && !p.IsDeleted);
            if (area == null)
                return "Selected area does not exist";

            var type = await _dbcontext.PlanTypeMasters.FirstOrDefaultAsync(p => p.Type == planDto.PlanType && !p.IsDeleted);
            if (type == null)
                return "Selected plan type does not exist";

            var comment = string.IsNullOrWhiteSpace(planDto.Comment) ? null : planDto.Comment.Trim();

            // Only flag the plan as changed when something actually changed
            var changed =
                plan.AreaId != area.Id ||
                plan.TypeId != type.Id ||
                plan.Target != planDto.Target ||
                plan.PlannedStart != planDto.StartTime ||
                plan.PlannedEnd != planDto.EndTime ||
                plan.Comment != comment;

            if (changed)
            {
                plan.AreaId = area.Id;
                plan.TypeId = type.Id;
                plan.Target = planDto.Target;
                plan.PlannedStart = planDto.StartTime;
                plan.PlannedEnd = planDto.EndTime;
                plan.Comment = comment;
                plan.IsUpdated = true;
                plan.UpdatedAt = DateTime.Now;
                plan.UpdatedBy = _currentUserService.EmployeeId;
            }

            plan.AcceptedAt = DateTime.Now;
            plan.IsAccepted = true;
            plan.AcceptedBy = _currentUserService.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return null;
        }
    }
}
