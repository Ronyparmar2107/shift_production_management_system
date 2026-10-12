using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{
    public interface IShiftService
    {
        // Used by plan creation: finds the shift for date + type, creating it if needed
        Task<ShiftDto> GetorCreateShiftAsync(ShiftDto shiftDto);

        // NotStarted | Running | Ended, from the latest ShiftStart / ShiftEnd entry in shift_logs
        Task<string> GetShiftStatusAsync(long shiftId);

        Task<(ShiftOverviewDto? Result, string? Error)> GetShiftAsync(DateOnly? date, string? shiftType);
        Task<(ShiftOverviewDto? Result, string? Error)> StartShiftAsync(ShiftDto shiftDto);
        Task<(ShiftOverviewDto? Result, string? Error)> EndShiftAsync(ShiftDto shiftDto);

        // Current shift's plan-vs-actual rows plus the two shifts before it (handover)
        Task<(DashboardDto? Result, string? Error)> GetDashboardAsync(DateOnly? date, string? shiftType);
    }

    public class ShiftService : IShiftService
    {
        private readonly AppDbContext _dbcontext;
        private readonly CurrentUserService _currentUserService;

        public ShiftService(AppDbContext appDbContext, CurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
            _dbcontext = appDbContext;
        }

        public async Task<ShiftDto> GetorCreateShiftAsync(ShiftDto shiftDto)
        {
            var shift = await _dbcontext.ShiftMasters.FirstOrDefaultAsync(p =>
                !p.IsDeleted && p.Date == shiftDto.Date && p.Type == shiftDto.ShiftType);

            // If the shift does not exist we create it.
            if (shift == null)
            {
                ShiftMaster newShift = new ShiftMaster
                {
                    Date = shiftDto.Date,
                    Type = shiftDto.ShiftType,
                    CreatedBy = _currentUserService.EmployeeId
                };

                await _dbcontext.AddAsync(newShift);
                await _dbcontext.SaveChangesAsync();

                shift = newShift;
            }

            return new ShiftDto { Id = shift.Id, Date = shift.Date, ShiftType = shift.Type ?? "" };
        }

        public async Task<string> GetShiftStatusAsync(long shiftId)
        {
            return StatusOf(await LastControlLogAsync(shiftId));
        }

        public async Task<(ShiftOverviewDto? Result, string? Error)> GetShiftAsync(DateOnly? date, string? shiftType)
        {
            if (date == null)
                return (null, "Date is required");

            var type = ShiftRules.NormalizeType(shiftType);
            if (type == null)
                return (null, "Shift must be Morning, Afternoon or Night");

            var shift = await _dbcontext.ShiftMasters.FirstOrDefaultAsync(s =>
                !s.IsDeleted && s.Date == date && s.Type == type);

            return (await BuildOverviewAsync(date.Value, type, shift), null);
        }

        public async Task<(ShiftOverviewDto? Result, string? Error)> StartShiftAsync(ShiftDto shiftDto)
        {
            if (shiftDto.Date == null)
                return (null, "Date is required");

            var type = ShiftRules.NormalizeType(shiftDto.ShiftType);
            if (type == null)
                return (null, "Shift must be Morning, Afternoon or Night");

            var created = await GetorCreateShiftAsync(new ShiftDto { Date = shiftDto.Date, ShiftType = type });
            var shift = await _dbcontext.ShiftMasters.FirstAsync(s => s.Id == created.Id);

            var status = await GetShiftStatusAsync(shift.Id);
            if (status == ShiftRules.Running)
                return (null, "This shift is already running");
            if (status == ShiftRules.Ended)
                return (null, "This shift has already ended");

            var me = _currentUserService.EmployeeId;

            _dbcontext.ShiftLogs.Add(new ShiftLog
            {
                ShiftId = shift.Id,
                EmpId = me,
                LogType = ShiftRules.LogStart,
                CreatedBy = me
            });
            shift.StartTime = DateTime.UtcNow;

            await _dbcontext.SaveChangesAsync();

            return (await BuildOverviewAsync(shiftDto.Date.Value, type, shift), null);
        }

        public async Task<(ShiftOverviewDto? Result, string? Error)> EndShiftAsync(ShiftDto shiftDto)
        {
            var shift = await _dbcontext.ShiftMasters.FirstOrDefaultAsync(s => s.Id == shiftDto.Id && !s.IsDeleted);
            if (shift == null)
                return (null, "Shift not found");

            if (await GetShiftStatusAsync(shift.Id) != ShiftRules.Running)
                return (null, "Only a running shift can be ended");

            var me = _currentUserService.EmployeeId;

            _dbcontext.ShiftLogs.Add(new ShiftLog
            {
                ShiftId = shift.Id,
                EmpId = me,
                LogType = ShiftRules.LogEnd,
                CreatedBy = me
            });
            shift.EndTime = DateTime.UtcNow;

            await _dbcontext.SaveChangesAsync();

            return (await BuildOverviewAsync(shift.Date ?? DateOnly.FromDateTime(DateTime.Today), shift.Type ?? "", shift), null);
        }

        public async Task<(DashboardDto? Result, string? Error)> GetDashboardAsync(DateOnly? date, string? shiftType)
        {
            if (date == null)
                return (null, "Date is required");

            var type = ShiftRules.NormalizeType(shiftType);
            if (type == null)
                return (null, "Shift must be Morning, Afternoon or Night");

            var shift = await _dbcontext.ShiftMasters.FirstOrDefaultAsync(s =>
                !s.IsDeleted && s.Date == date && s.Type == type);

            var dashboard = new DashboardDto();

            var currentOverview = await BuildOverviewAsync(date.Value, type, shift);
            var currentRows = shift == null
                ? new List<PlanView>()
                : await _dbcontext.PlanViews.AsNoTracking().Where(p => p.ShiftId == shift.Id).ToListAsync();
            dashboard.Current = BuildDashboardShift(currentOverview, currentRows);

            // Handover: the two shifts before this one (by date, then Morning < Afternoon < Night) that had plans
            var currentRank = Array.IndexOf(ShiftRules.Types, type);
            var candidates = (await _dbcontext.ShiftMasters
                    .Where(s => !s.IsDeleted && s.Date <= date)
                    .OrderByDescending(s => s.Date)
                    .Take(15)
                    .ToListAsync())
                .Where(s => Array.IndexOf(ShiftRules.Types, s.Type) >= 0 &&
                            (s.Date < date || Array.IndexOf(ShiftRules.Types, s.Type) < currentRank))
                .OrderByDescending(s => s.Date)
                .ThenByDescending(s => Array.IndexOf(ShiftRules.Types, s.Type))
                .ToList();

            if (candidates.Count > 0)
            {
                var candidateIds = candidates.Select(s => (long?)s.Id).ToList();
                var rowsByShift = (await _dbcontext.PlanViews.AsNoTracking()
                        .Where(p => candidateIds.Contains(p.ShiftId))
                        .ToListAsync())
                    .GroupBy(p => p.ShiftId ?? 0)
                    .ToDictionary(g => g.Key, g => g.ToList());

                foreach (var previous in candidates.Where(s => rowsByShift.ContainsKey(s.Id)).Take(2))
                {
                    var overview = await BuildOverviewAsync(previous.Date ?? date.Value, previous.Type ?? "", previous);
                    dashboard.Previous.Add(BuildDashboardShift(overview, rowsByShift[previous.Id]));
                }
            }

            return (dashboard, null);
        }

        private static int SeverityOf(string? status) => status switch
        {
            "Red" => 0,
            "Yellow" => 1,
            "Stale" => 2,
            "Green" => 3,
            "Not started" => 4,
            _ => 5
        };

        private static DashboardShiftDto BuildDashboardShift(ShiftOverviewDto overview, List<PlanView> views)
        {
            var rows = views
                .OrderBy(v => SeverityOf(v.VarianceStatus))
                .ThenBy(v => v.PlannedStart)
                .ThenBy(v => v.PlanId)
                .Select(v => new DashboardRowDto
                {
                    PlanId = v.PlanId ?? 0,
                    CrewName = v.CrewId != null ? $"Crew {v.CrewId}" : "",
                    LeadName = v.EmpName ?? "",
                    Area = v.AreaName ?? "",
                    PlanType = v.PlanType ?? "",
                    Unit = v.Unit ?? "",
                    Target = v.Target,
                    PlannedStart = v.PlannedStart,
                    PlannedEnd = v.PlannedEnd,
                    PlanStatus = v.Status ?? "",
                    AcceptedByName = v.AcceptedByName,
                    Expected = v.Expected,
                    Actual = v.Actual ?? 0,
                    VarianceUnits = v.VarianceUnits,
                    VariancePct = v.VariancePct,
                    VarianceStatus = v.VarianceStatus ?? "",
                    ProjectedEnd = v.ProjectedEnd,
                    ProjectedShortfall = v.ProjectedShortfall,
                    LastLoggedAt = v.ActualLoggedAt,
                    MinutesSinceUpdate = v.MinutesSinceUpdate
                })
                .ToList();

            return new DashboardShiftDto
            {
                ShiftId = overview.ShiftId,
                Date = overview.Date,
                ShiftType = overview.ShiftType,
                Status = overview.Status,
                StartedAt = overview.StartedAt,
                EndedAt = overview.EndedAt,
                StartedByName = overview.StartedByName,
                Rows = rows,
                Summary = new DashboardSummaryDto
                {
                    Total = rows.Count,
                    Accepted = rows.Count(r => r.PlanStatus != "Pending"),
                    Pending = rows.Count(r => r.PlanStatus == "Pending"),
                    Green = rows.Count(r => r.VarianceStatus == "Green"),
                    Yellow = rows.Count(r => r.VarianceStatus == "Yellow"),
                    Red = rows.Count(r => r.VarianceStatus == "Red"),
                    Stale = rows.Count(r => r.VarianceStatus == "Stale"),
                    NotStarted = rows.Count(r => r.VarianceStatus == "Not started")
                }
            };
        }

        private Task<ShiftLog?> LastControlLogAsync(long shiftId)
        {
            return _dbcontext.ShiftLogs
                .Where(l => l.ShiftId == shiftId && !l.IsDeleted &&
                            (l.LogType == ShiftRules.LogStart || l.LogType == ShiftRules.LogEnd))
                .OrderByDescending(l => l.Id)
                .FirstOrDefaultAsync();
        }

        private static string StatusOf(ShiftLog? lastControlLog)
        {
            if (lastControlLog == null) return ShiftRules.NotStarted;
            return lastControlLog.LogType == ShiftRules.LogStart ? ShiftRules.Running : ShiftRules.Ended;
        }

        private async Task<ShiftOverviewDto> BuildOverviewAsync(DateOnly date, string type, ShiftMaster? shift)
        {
            var overview = new ShiftOverviewDto { Date = date, ShiftType = type, Status = ShiftRules.NotStarted };
            if (shift == null)
                return overview;

            overview.ShiftId = shift.Id;
            overview.Status = await GetShiftStatusAsync(shift.Id);

            if (overview.Status != ShiftRules.NotStarted)
            {
                overview.StartedAt = shift.StartTime;

                var startLog = await _dbcontext.ShiftLogs
                    .Where(l => l.ShiftId == shift.Id && !l.IsDeleted && l.LogType == ShiftRules.LogStart)
                    .OrderByDescending(l => l.Id)
                    .FirstOrDefaultAsync();

                if (startLog?.EmpId != null)
                {
                    overview.StartedByName = await _dbcontext.EmpMasters
                        .Where(e => e.Id == startLog.EmpId)
                        .Select(e => e.Name)
                        .FirstOrDefaultAsync();
                }
            }

            if (overview.Status == ShiftRules.Ended)
                overview.EndedAt = shift.EndTime;

            return overview;
        }
    }
}
