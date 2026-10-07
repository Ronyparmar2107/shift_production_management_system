using Microsoft.EntityFrameworkCore;

namespace SPMS.Server.Models
{
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
        public long? ActualValue { get; set; }
        public DateTime? ActualLoggedAt { get; set; }
    }
}
