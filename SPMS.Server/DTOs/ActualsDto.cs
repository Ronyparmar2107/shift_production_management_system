using SPMS.Server.Models;

namespace SPMS.Server.DTOs
{
    public class ActualsDto
    {
        public long ? PlanId { get; set; }
        public string? PlanType { get; set; }
        public string? ShiftType { get; set; }
        public DateTime? ShiftDate { get; set; }
        public string? AreaType { get; set; }
        public long? Target{ get; set; }
        public long? Expected {  get; set; }
        public long? Actual { get; set; }
        public string? Status { get; set; }
        public string?  comment { get; set; }
        public long? CrewId { get; set; }
    }
}
