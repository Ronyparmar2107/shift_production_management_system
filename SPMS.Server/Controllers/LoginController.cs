using Microsoft.AspNetCore.Mvc;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class LoginController : Controller
    {
        public readonly ILoginService _loginService;

        public LoginController(ILoginService loginService)
        {
             _loginService = loginService;
        }

        [HttpPost]
        public async Task<IActionResult> Auth([FromBody] LoginRequestDto request)
        {
            var response = await _loginService.AuthAsync(request);
                
            if(response == null)
                return Unauthorized(new { message = "Access Denied for this Employee" });

            return Ok(response);
        }
    }
}
