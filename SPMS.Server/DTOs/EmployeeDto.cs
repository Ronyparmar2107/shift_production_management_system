namespace SPMS.Server.DTOs
{
    public class EmployeeDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string EmployeeNumber { get; set; }

    }
}
