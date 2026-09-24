namespace SPMS.Server.DTOs
{
    public class UpdateEmployeeDto
    {
        public int Id { get; set; } 
        public string Name { get; set; } = string.Empty;

        public int RoleId   { get; set; }
        public bool IsActive { get; set; }
        public bool IsDeleted { get; set; }
    }
}
