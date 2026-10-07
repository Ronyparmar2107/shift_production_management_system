namespace SPMS.Server.DTOs
{
    // A crew as shown in lists
    public class CrewDto
    {
        public long CrewId { get; set; }
        public string CrewName { get; set; } = string.Empty;   // "Crew {id}"
        public long? LeadEmpId { get; set; }
        public string LeadName { get; set; } = string.Empty;
        public string? LeadEmployeeNumber { get; set; }
    }

    // Body for create / update / delete (CrewId is ignored on create, LeadEmpId on delete)
    public class SaveCrewDto
    {
        public long CrewId { get; set; }
        public long LeadEmpId { get; set; }
    }

    // Employees with the CrewLead role; CrewId is the crew they currently lead (null = free)
    public class CrewLeadDto
    {
        public long EmpId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? EmployeeNumber { get; set; }
        public long? CrewId { get; set; }
    }
}
