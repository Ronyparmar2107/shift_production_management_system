namespace SPMS.Server.DTOs
{
    // A plan as shown on the planner / supervisor screens, with its acceptance status
    public class PlanStatusDto
    {
        public long PlanId { get; set; }
        public DateOnly? Date { get; set; }
        public string ShiftType { get; set; } = string.Empty;
        public string CrewName { get; set; } = string.Empty;       // "Crew {id}"
        public string LeadName { get; set; } = string.Empty;
        public string Area { get; set; } = string.Empty;
        public string PlanType { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public long? Target { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Comment { get; set; }

        // "Pending" | "Accepted" | "Updated"
        public string Status { get; set; } = "Pending";
        public string? CreatedByName { get; set; }
        public string? AcceptedByName { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public string? UpdatedByName { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
