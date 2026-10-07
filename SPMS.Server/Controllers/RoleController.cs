using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]/[action]")]
    public class RoleController : Controller
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        // GET /api/Role/GetAllRoles
        [HttpGet]
        public async Task<IActionResult> GetAllRolesAsync()
        {
            var response = await _roleService.GetAllRolesAsync();

            return Ok(response);
        }
    }
}
