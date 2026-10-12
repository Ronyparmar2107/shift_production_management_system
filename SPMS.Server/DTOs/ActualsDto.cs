namespace SPMS.Server.DTOs
{
    // One plan row on the crew lead's actuals screen (straight from v_plan_variance)
    public class ActualsDto
    {
        public long PlanId { get; set; }
        public string PlanType { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;
        public DateTime? ShiftDate { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public DateTime? PlannedStart { get; set; }
        public DateTime? PlannedEnd { get; set; }
        public long? Target { get; set; }

        public decimal? Expected { get; set; }
        public decimal Actual { get; set; }
        public decimal? VarianceUnits { get; set; }
        public decimal? VariancePct { get; set; }       // null while expected = 0 or in the first minutes
        public string Status { get; set; } = string.Empty;   // Green | Yellow | Red | Stale | Not started | Awaiting acceptance
        public decimal? ProjectedEnd { get; set; }
        public decimal? ProjectedShortfall { get; set; }
        public DateTime? LastLoggedAt { get; set; }
        public int? MinutesSinceUpdate { get; set; }
    }

    public class LogActualDto
    {
        public long PlanId { get; set; }
        public decimal? Value { get; set; }              // cumulative total so far
        public DateTime? ReadingTime { get; set; }       // when the reading was taken
        public string? Comment { get; set; }
    }

    public class LogActualResultDto
    {
        public bool Saved { get; set; }
        public bool ReasonRequired { get; set; }         // true = nothing saved, ask for a comment and resend
        public string? Message { get; set; }
        public string? Status { get; set; }              // plan status after the entry
    }
}
