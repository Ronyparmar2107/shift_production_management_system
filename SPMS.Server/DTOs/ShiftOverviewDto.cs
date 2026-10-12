namespace SPMS.Server.DTOs
{
    // A shift's state plus its plans, for the supervisor's shift screen
    public class ShiftOverviewDto
    {
        public long ShiftId { get; set; }              // 0 when the shift row doesn't exist yet
        public DateOnly? Date { get; set; }
        public string ShiftType { get; set; } = string.Empty;

        // "NotStarted" | "Running" | "Ended"
        public string Status { get; set; } = "NotStarted";
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public string? StartedByName { get; set; }

        public List<PlanStatusDto> Plans { get; set; } = new();
    }
}
