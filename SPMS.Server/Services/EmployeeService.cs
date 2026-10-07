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
        Task<List<EmployeeDto>> GetAllEmployeesAsync();
        Task<(EmployeeDto? Result, string? Error)> UpdateEmployeeAsync(UpdateEmployeeDto employee);
    }
    public class EmployeeService : IEmployeeService
    {
        // Employee number of the built-in admin account — its details are locked.
        private const string ProtectedEmployeeNumber = "000";

        private readonly AppDbContext _dbcontext;
        private readonly CurrentUserService _currentUserService;

        public EmployeeService (AppDbContext dbcontext, CurrentUserService currentUserService )
        {
            _dbcontext = dbcontext;
            _currentUserService = currentUserService;
        }

       public async Task<List<EmployeeDto>> GetAllEmployeesAsync()
        {
            var employees = await (
                    from e in _dbcontext.EmpMasters
                    where !e.IsDeleted
                    join r in _dbcontext.RoleMasters on e.RoleId equals r.Id into roles
                    from r in roles.DefaultIfEmpty()
                    select new EmployeeDto
                    {
                        Id = e.Id,
                        EmployeeNumber = e.EmployeeNumber,
                        Name = e.Name,
                        Role = r != null ? r.Role : "",
                        IsActive = e.IsActive,
                        ResignationDate = e.ResignationAt
                    }).ToListAsync();
            return employees;
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

        public async Task<(EmployeeDto? Result, string? Error)> UpdateEmployeeAsync(UpdateEmployeeDto dto)
        {
            var emp = await _dbcontext.EmpMasters.FirstOrDefaultAsync(e => e.Id == dto.Id && !e.IsDeleted);

            if (emp == null)
                return (null, "Employee not found");

            if (emp.EmployeeNumber == ProtectedEmployeeNumber)
                return (null, "This account is protected and cannot be changed");

            if (!dto.IsDeleted)
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                    return (null, "Name is required");

                if (!dto.IsActive && dto.ResignationDate == null)
                    return (null, "Resignation date is required when an employee is inactive");
            }

            var role = await _dbcontext.RoleMasters
                .FirstOrDefaultAsync(r => r.Id == dto.RoleId && r.IsActive && !r.IsDeleted);

            if (role == null)
                return (null, "Selected role does not exist");

            emp.Name = dto.Name.Trim();
            emp.RoleId = dto.RoleId;
            emp.IsActive = dto.IsActive;
            emp.ResignationAt = dto.IsActive ? null : dto.ResignationDate;

            emp.IsUpdated = true;
            emp.UpdatedAt = DateTime.UtcNow;
            emp.UpdatedBy = _currentUserService.EmployeeId;

            if (dto.IsDeleted)
            {
                emp.IsDeleted = true;
                emp.DeletedAt = DateTime.UtcNow;
                emp.DeletedBy = _currentUserService.EmployeeId;
            }

            await _dbcontext.SaveChangesAsync();

            return (new EmployeeDto
            {
                Id = emp.Id,
                Name = emp.Name ?? string.Empty,
                EmployeeNumber = emp.EmployeeNumber,
                Role = role.Role,
                IsActive = emp.IsActive,
                ResignationDate = emp.ResignationAt
            }, null);
        }

    }
}
