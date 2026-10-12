using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{

    public interface IPlanService
    {
        Task<(PlanDto? Result, string? Error)> CreatePlanAsync(PlanDto plan);
        Task<List<PlanStatusDto>> GetMyCreatedPlansAsync();
        Task<List<PlanStatusDto>> GetShiftPlansAsync(long shiftId);
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

        public async Task<(PlanDto? Result, string? Error)> CreatePlanAsync(PlanDto plan)
        {
            // Validate everything first so a bad request never leaves an orphan shift behind
            if (plan.Date == null)
                return (null, "Date is required");

            var shiftType = ShiftRules.NormalizeType(plan.ShiftType);
            if (shiftType == null)
                return (null, "Shift must be Morning, Afternoon or Night");

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

            var shift = await _shiftService.GetorCreateShiftAsync(new ShiftDto { Date = plan.Date, ShiftType = shiftType });

            // Plans can be added before and during a shift, never after it has ended
            var shiftStatus = await _shiftService.GetShiftStatusAsync(shift.Id);
            if (shiftStatus == ShiftRules.Ended)
                return (null, "This shift has ended, no more plans can be added to it");

            // Guard against double submits: same crew, area and activity in the same shift
            var duplicate = await _dbcontext.PlanMasters.AnyAsync(p =>
                !p.IsDeleted && p.ShiftId == shift.Id && p.CrewId == crew.Id &&
                p.AreaId == area.Id && p.TypeId == planType.Id);

            if (duplicate)
                return (null, "A plan for this crew, area and activity already exists in this shift");

            // A supervisor creating a plan in a running shift is also the person who accepts it
            var me = _currentUserService.EmployeeId;
            var autoAccept = shiftStatus == ShiftRules.Running && _currentUserService.IsInRole(RoleNames.ShiftSupervisor);

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
                CreatedBy = me,
                Status = autoAccept ? "Accepted" : "Pending",
                IsAccepted = autoAccept,
                AcceptedBy = autoAccept ? me : null,
                AcceptedAt = autoAccept ? DateTime.UtcNow : null
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

        // All plans of one shift, pending ones first
        public async Task<List<PlanStatusDto>> GetShiftPlansAsync(long shiftId)
        {
            var plans = await _dbcontext.PlanMasters
                .Where(p => !p.IsDeleted && p.ShiftId == shiftId)
                .OrderBy(p => p.IsAccepted)
                .ThenBy(p => p.PlannedStart)
                .ThenBy(p => p.Id)
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
                .Concat(plans.Select(p => p.UpdatedBy))
                .Concat(plans.Select(p => p.CreatedBy))
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
                    Status = p.Status,
                    CreatedByName = EmpName(p.CreatedBy),
                    AcceptedByName = p.IsAccepted ? EmpName(p.AcceptedBy) : null,
                    AcceptedAt = p.AcceptedAt,
                    UpdatedByName = p.IsUpdated ? EmpName(p.UpdatedBy) : null,
                    UpdatedAt = p.UpdatedAt,
                    CreatedAt = p.CreatedAt
                };
            }).ToList();
        }

        // The plan must exist, not be accepted yet, and its shift must be running
        // (the shift starts first, then plans are accepted). Who may accept is enforced by the controller policy.
        private async Task<(PlanMaster? Plan, string? Error)> GetPlanToAcceptAsync(long planId)
        {
            var plan = await _dbcontext.PlanMasters.FirstOrDefaultAsync(p => p.Id == planId && !p.IsDeleted);
            if (plan == null)
                return (null, "Plan not found");

            if (plan.IsAccepted)
                return (null, "This plan has already been accepted");

            var shiftStatus = await _shiftService.GetShiftStatusAsync(plan.ShiftId ?? 0);
            if (shiftStatus == ShiftRules.NotStarted)
                return (null, "Start the shift before accepting plans");
            if (shiftStatus == ShiftRules.Ended)
                return (null, "This shift has ended");

            return (plan, null);
        }

        public async Task<string?> AcceptPlanAsync(PlanDto planDto)
        {
            var (plan, error) = await GetPlanToAcceptAsync(planDto.Id);
            if (plan == null)
                return error;

            plan.Status = "Accepted";
            plan.AcceptedAt = DateTime.UtcNow;
            plan.IsAccepted = true;
            plan.AcceptedBy = _currentUserService.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return null;
        }

        public async Task<string?> UpdateAndAcceptPlanAsync(PlanDto planDto)
        {
            var (plan, error) = await GetPlanToAcceptAsync(planDto.Id);
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
                plan.UpdatedAt = DateTime.UtcNow;
                plan.UpdatedBy = _currentUserService.EmployeeId;
            }

            plan.Status = changed ? "Updated" : "Accepted";
            plan.AcceptedAt = DateTime.UtcNow;
            plan.IsAccepted = true;
            plan.AcceptedBy = _currentUserService.EmployeeId;

            await _dbcontext.SaveChangesAsync();

            return null;
        }
    }
}
