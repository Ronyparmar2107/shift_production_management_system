namespace SPMS.Server.DTOs
{
    public class PlanDto
    {
        public long Id { get; set; }
        public DateOnly? Date { get; set; }
        public string ShiftType { get; set; } = string.Empty;

        public long? CrewLeadId {  get; set; }

        public string Area { get; set; }

        public string PlanType { get; set; }

        public long? Target {  get; set; }

        public DateTime? StartTime {  get; set; }
        public DateTime? EndTime { get; set; }

        public string Comment { get; set; }
         
    }
}
