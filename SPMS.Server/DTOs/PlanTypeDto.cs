namespace SPMS.Server.DTOs
{
    public class PlanTypeDto
    {
        public long PlanTypeId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
    }

    // Body for create / update / delete (PlanTypeId is ignored on create; Type/Unit on delete)
    public class SavePlanTypeDto
    {
        public long PlanTypeId { get; set; }
        public string? Type { get; set; }
        public string? Unit { get; set; }
    }
}
