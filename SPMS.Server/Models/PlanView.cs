using Microsoft.EntityFrameworkCore;

namespace SPMS.Server.Models
{
    // Read-only row from v_plan_variance. All variance maths is done in the view.
    [Keyless]
    public class PlanView
    {
        public long? PlanId { get; set; }
        public long? Target {  get; set; }
        public DateTime? PlannedStart { get; set; }
        public DateTime? PlannedEnd { get; set; }
        public DateTime? ShiftDate { get; set; }
        public string? ShiftType { get; set; }
        public bool? IsAccepted { get; set; }
        public string? PlanType { get; set; }
        public string? Unit { get; set; }
        public string? AreaName { get; set; }
        public long? LeadEmpId { get; set; }
        public long? CrewId {  get; set; }
        public string? EmpName { get; set; }
        public DateTime? ActualLoggedAt { get; set; }

        // status + who did what
        public string? Status { get; set; }
        public long? ShiftId { get; set; }
        public string? CreatedByName { get; set; }
        public string? AcceptedByName { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public string? UpdatedByName { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // shift state: NotStarted | Running | Ended
        public string? ShiftStatus { get; set; }

        // variance tracking
        public decimal? Actual { get; set; }
        public decimal? Expected { get; set; }
        public decimal? VarianceUnits { get; set; }
        public decimal? VariancePct { get; set; }
        public string? VarianceStatus { get; set; }
        public int? MinutesSinceUpdate { get; set; }
        public decimal? ProjectedEnd { get; set; }
        public decimal? ProjectedShortfall { get; set; }
    }
}
