using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeeController : Controller
    {
        private readonly IEmployeeService _employeeService;

        public EmployeeController (IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployeeAsync([FromBody]CreateEmployeeDto employee)
        {
            var response = await _employeeService.CreateEmployee(employee);

            if (response == null)
                return Unauthorized(new { message = "Something Went Wrong while creating new employee" });

            return Ok(response);
        }
    }
}
