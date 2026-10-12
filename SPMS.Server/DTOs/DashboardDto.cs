namespace SPMS.Server.DTOs
{
    // One plan row of the plan-vs-actual dashboard (straight from v_plan_variance)
    public class DashboardRowDto
    {
        public long PlanId { get; set; }
        public string CrewName { get; set; } = string.Empty;       // "Crew {id}"
        public string LeadName { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;
        public string PlanType { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public long? Target { get; set; }
        public DateTime? PlannedStart { get; set; }
        public DateTime? PlannedEnd { get; set; }
        public string PlanStatus { get; set; } = string.Empty;     // Pending | Accepted | Updated
        public string? AcceptedByName { get; set; }

        public decimal? Expected { get; set; }
        public decimal Actual { get; set; }
        public decimal? VarianceUnits { get; set; }
        public decimal? VariancePct { get; set; }
        // Green | Yellow | Red | Stale | Not started | Awaiting acceptance
        public string VarianceStatus { get; set; } = string.Empty;
        public decimal? ProjectedEnd { get; set; }
        public decimal? ProjectedShortfall { get; set; }
        public DateTime? LastLoggedAt { get; set; }
        public int? MinutesSinceUpdate { get; set; }
    }

    public class DashboardSummaryDto
    {
        public int Total { get; set; }
        public int Accepted { get; set; }
        public int Pending { get; set; }
        public int Green { get; set; }
        public int Yellow { get; set; }
        public int Red { get; set; }
        public int Stale { get; set; }
        public int NotStarted { get; set; }
    }

    public class DashboardShiftDto
    {
        public long ShiftId { get; set; }
        public DateOnly? Date { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public string Status { get; set; } = "NotStarted";         // NotStarted | Running | Ended
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public string? StartedByName { get; set; }
        public DashboardSummaryDto Summary { get; set; } = new();
        public List<DashboardRowDto> Rows { get; set; } = new();
    }

    public class DashboardDto
    {
        public DashboardShiftDto Current { get; set; } = new();
        // The two shifts before the current one that had plans, most recent first (handover)
        public List<DashboardShiftDto> Previous { get; set; } = new();
    }
}
