using System.Diagnostics.Contracts;

namespace SPMS.Server.DTOs
{
    public class LoginResponseDto
    {
        public long EmployeeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }
}
