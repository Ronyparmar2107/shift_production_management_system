using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    [Authorize]
    public class EmployeeController : Controller
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController (IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }
        [HttpGet]
        public async Task<IActionResult> GetAllEmployeesAsync()
        {
            var response = await _employeeService.GetAllEmployeesAsync();

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployeeAsync([FromBody]CreateEmployeeDto employee)
        {
            var response = await _employeeService.CreateEmployee(employee);

            if (response == null)
                return BadRequest(new { message = "Something Went Wrong while creating new employee" });

            return Ok(response);
        }

        // POST /api/Employee/UpdateEmployee  (also used for soft delete via IsDeleted = true)
        [HttpPost]
        public async Task<IActionResult> UpdateEmployeeAsync([FromBody] UpdateEmployeeDto employee)
        {
            var (result, error) = await _employeeService.UpdateEmployeeAsync(employee);

            if (result == null)
                return BadRequest(new { message = error ?? "Something went wrong while updating employee" });

            return Ok(result);
        }
    }
}
