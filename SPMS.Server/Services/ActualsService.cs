using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{
    public interface IActualService
    {
        Task<List<ActualsDto>> GetMyActualsAsync();
        Task<(LogActualResultDto? Result, string? Error)> LogActualAsync(LogActualDto dto);
    }

    public class ActualsService : IActualService
    {
        private const int MaxCommentLength = 200;

        private readonly CurrentUserService _currentUserService;
        private readonly AppDbContext _dbcontext;

        public ActualsService(CurrentUserService currentUserService, AppDbContext appDbContext)
        {
            _currentUserService = currentUserService;
            _dbcontext = appDbContext;
        }

        // Accepted plans of the signed-in crew lead whose shift is running, with live variance from the view
        public async Task<List<ActualsDto>> GetMyActualsAsync()
        {
            var me = _currentUserService.EmployeeId;
            if (me == null)
                return new List<ActualsDto>();

            var rows = await _dbcontext.PlanViews
                .AsNoTracking()
                .Where(p => p.LeadEmpId == me && p.IsAccepted == true && p.ShiftStatus == ShiftRules.Running)
                .OrderBy(p => p.PlannedStart)
                .ThenBy(p => p.PlanId)
                .ToListAsync();

            return rows.Select(r => new ActualsDto
            {
                PlanId = r.PlanId ?? 0,
                PlanType = r.PlanType ?? "",
                Unit = r.Unit ?? "",
                Area = r.AreaName ?? "",
                ShiftDate = r.ShiftDate,
                ShiftType = r.ShiftType ?? "",
                PlannedStart = r.PlannedStart,
                PlannedEnd = r.PlannedEnd,
                Target = r.Target,
                Expected = r.Expected,
                Actual = r.Actual ?? 0,
                VarianceUnits = r.VarianceUnits,
                VariancePct = r.VariancePct,
                Status = r.VarianceStatus ?? "",
                ProjectedEnd = r.ProjectedEnd,
                ProjectedShortfall = r.ProjectedShortfall,
                LastLoggedAt = r.ActualLoggedAt,
                MinutesSinceUpdate = r.MinutesSinceUpdate
            }).ToList();
        }

        public async Task<(LogActualResultDto? Result, string? Error)> LogActualAsync(LogActualDto dto)
        {
            var me = _currentUserService.EmployeeId;

            if (dto.Value == null)
                return (null, "Value is required");
            if (dto.Value < 0)
                return (null, "Value can't be negative");
            if (dto.ReadingTime == null)
                return (null, "Reading time is required");

            var comment = string.IsNullOrWhiteSpace(dto.Comment) ? null : dto.Comment.Trim();
            if (comment != null && comment.Length > MaxCommentLength)
                return (null, $"Comment can be at most {MaxCommentLength} characters");

            var plan = await _dbcontext.PlanViews.AsNoTracking().FirstOrDefaultAsync(p => p.PlanId == dto.PlanId);
            if (plan == null)
                return (null, "Plan not found");
            if (me == null || plan.LeadEmpId != me)
                return (null, "This plan is not assigned to your crew");
            if (plan.IsAccepted != true)
                return (null, "This plan has not been accepted yet");
            if (plan.ShiftStatus != ShiftRules.Running)
                return (null, "The shift is not running, actuals can't be logged");
            if (plan.PlannedStart != null && dto.ReadingTime < plan.PlannedStart)
                return (null, "Reading time is before the planned start of this plan");

            // Entries are cumulative: a value below the last one is probably a typo, so ask for a comment
            var previous = plan.ActualLoggedAt != null ? plan.Actual : null;
            if (previous != null && dto.Value < previous && comment == null)
            {
                return (new LogActualResultDto
                {
                    Saved = false,
                    ReasonRequired = true,
                    Message = $"This is lower than the last entry ({Fmt(previous)}). Add a comment to confirm it."
                }, null);
            }

            // Save, then ask the view where this entry leaves the plan. If the crew is behind (Yellow / Red)
            // and no reason was given, roll the entry back and ask for the reason.
            var strategy = _dbcontext.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync<(LogActualResultDto? Result, string? Error)>(async () =>
            {
                await using var tx = await _dbcontext.Database.BeginTransactionAsync();

                var log = new ActualLog
                {
                    PlanId = dto.PlanId,
                    Value = dto.Value.Value.ToString("0.####", CultureInfo.InvariantCulture),
                    Comment = comment,
                    ReadingTime = dto.ReadingTime,
                    CreatedBy = me
                };
                _dbcontext.ActualLogs.Add(log);
                await _dbcontext.SaveChangesAsync();

                var after = await _dbcontext.PlanViews.AsNoTracking().FirstOrDefaultAsync(p => p.PlanId == dto.PlanId);
                var status = after?.VarianceStatus;

                if ((status == "Yellow" || status == "Red") && comment == null)
                {
                    await tx.RollbackAsync();
                    _dbcontext.Entry(log).State = EntityState.Detached;

                    var pct = after?.VariancePct != null ? $" ({after.VariancePct.Value.ToString("0.0", CultureInfo.InvariantCulture)}%)" : "";
                    return (new LogActualResultDto
                    {
                        Saved = false,
                        ReasonRequired = true,
                        Status = status,
                        Message = $"You are behind plan: {status}{pct}. Add the reason, then save again."
                    }, null);
                }

                await tx.CommitAsync();

                return (new LogActualResultDto
                {
                    Saved = true,
                    Status = status,
                    Message = "Actual logged"
                }, null);
            });
        }

        private static string Fmt(decimal? value) =>
            value?.ToString("0.####", CultureInfo.InvariantCulture) ?? "";
    }
}
