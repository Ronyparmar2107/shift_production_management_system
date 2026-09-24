using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{
    public interface IEmployeeService
    {
        Task<EmployeeDto> CreateEmployee(CreateEmployeeDto employee);
    }
    public class EmployeeService : IEmployeeService
    {
        private readonly AppDbContext _dbcontext;
        private readonly CurrentUserService _currentUserService;

        public EmployeeService (AppDbContext dbcontext, CurrentUserService currentUserService )
        {
            _dbcontext = dbcontext;
            _currentUserService = currentUserService;
        }

       

        public async Task<EmployeeDto> CreateEmployee(CreateEmployeeDto employee)
        {
            EmpMaster empMaster = new EmpMaster 
            { 
                Name = employee.Name,
                RoleId = employee.RoleId,
                CreatedBy = _currentUserService.EmployeeId
            };

            _dbcontext.EmpMasters.Add(empMaster);
            await _dbcontext.SaveChangesAsync();

            empMaster.EmployeeNumber = empMaster.Id.ToString("D3");
            await _dbcontext.SaveChangesAsync();


            var firstName = empMaster.Name.Split(' ')[0];
            var password = BCrypt.Net.BCrypt.HashPassword(firstName + empMaster.EmployeeNumber);


            LoginCred login = new LoginCred
            {
                EmpId = empMaster.Id,
                Password = password,
                CreatedBy = _currentUserService.EmployeeId
            };

            _dbcontext.LoginCreds.Add(login);
            await _dbcontext.SaveChangesAsync();
            

            EmployeeDto employeeDto = new EmployeeDto
            {
                Name = empMaster.Name,
                EmployeeNumber = empMaster.EmployeeNumber,
                Id = empMaster.Id
            };

            var Role = await _dbcontext.RoleMasters.FirstOrDefaultAsync(p=> p.Id==empMaster.RoleId && p.IsActive && !p.IsDeleted);

            employeeDto.Role = Role?.Role ?? "";

            return employeeDto;
        }

    }
}
