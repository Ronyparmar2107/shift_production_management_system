namespace SPMS.Server.DTOs
{
    // A plan as shown to the person who created it, with its acceptance status
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

        // "Pending" | "Accepted" | "Accepted with changes"
        public string Status { get; set; } = "Pending";
        public string? AcceptedByName { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
