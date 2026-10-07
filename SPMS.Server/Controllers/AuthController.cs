using Microsoft.AspNetCore.Mvc;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]/[action]")]
    public class AuthController : Controller
    {
        public readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
             _authService = authService;
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var response = await _authService.LoginAsync(request);
                
            if(response == null)
                return Unauthorized(new { message = "Access Denied for this Employee" });

            return Ok(response);
        }
    }
}
