namespace SPMS.Server.DTOs
{
    public class UpdateEmployeeDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public long RoleId { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }

        // Required when IsActive is false; cleared when the employee is active again.
        public DateOnly? ResignationDate { get; set; }
    }
}
