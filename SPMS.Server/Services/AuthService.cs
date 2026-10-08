using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

using SPMS.Server.Data;
using SPMS.Server.DTOs;

namespace SPMS.Server.Services
{

    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequest);

    }
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _dbcontext;
        private readonly IConfiguration _config;
        private readonly IHostEnvironment _env;

        public AuthService (AppDbContext dbcontext, IConfiguration configuration, IHostEnvironment env)
        {
            _dbcontext = dbcontext;
            _config = configuration;
            _env = env;
        }

        // Built-in admin "000" (no database row) for seeding the first employees.
        //  - Development: allowed without a password unless Auth:BootstrapAdminPassword is set.
        //  - Any other environment: only allowed when Auth:BootstrapAdminPassword is set, and the
        //    password must match. Leave it unset in production once real admins exist.
        private bool IsBootstrapLoginAllowed(string? suppliedPassword)
        {
            var configured = _config["Auth:BootstrapAdminPassword"];

            if (string.IsNullOrEmpty(configured))
                return _env.IsDevelopment();

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(suppliedPassword ?? ""),
                Encoding.UTF8.GetBytes(configured));
        }

        
        public async Task<LoginResponseDto> LoginAsync ( LoginRequestDto loginRequest)
        {
            if(loginRequest.EmployeeNumber == "000")
            {
                if (!IsBootstrapLoginAllowed(loginRequest.Password))
                    return null;

                var token1 = GenerateJwtToken(0, "admin", "admin");

                return new LoginResponseDto
                {
                    EmployeeId = 0,
                    Name = loginRequest.EmployeeNumber,
                    Role = "admin",
                    Token = token1
                };
            }

            // Checking Weather employee exist or not
            var employee = await _dbcontext.EmpMasters.FirstOrDefaultAsync(e => e.EmployeeNumber == loginRequest.EmployeeNumber && !e.IsDeleted && e.IsActive != false);

            if (employee == null) {
                return null;
            }
            //Getting login Creds 
            var loginCreds = await _dbcontext.LoginCreds.FirstOrDefaultAsync(p=> p.EmpId == employee.Id && !p.IsDeleted && p.IsActive);

            if (loginCreds == null) {
                return null;
            }

            bool authorize = BCrypt.Net.BCrypt.Verify(loginRequest.Password, loginCreds.Password);

            if (!authorize)
            {
                return null;
            }

            var role = await _dbcontext.RoleMasters.FirstOrDefaultAsync(p => p.Id == employee.RoleId);

            var token = GenerateJwtToken(employee.Id, role.Role, employee.Name);

            return new LoginResponseDto
            {
                EmployeeId = employee.Id,
                Name = employee.Name,
                Role = role.Role,
                Token = token
            };
        }

        private string GenerateJwtToken(long employeeId, string role, string name) {

            var claims = new List<Claim>
            {
            new Claim(ClaimTypes.NameIdentifier, employeeId.ToString()),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8), // matches a typical shift length
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        } 
    }
}
