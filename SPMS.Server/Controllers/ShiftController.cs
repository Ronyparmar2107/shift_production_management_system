using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ShiftController : Controller
    {
        private readonly IShiftService _shiftService;

        public ShiftController(IShiftService shiftService)
        {
            _shiftService = shiftService;
        }

        [HttpPost]
        public async Task<IActionResult> LogShift([FromBody]ShiftLogDto shiftLogDto)
        {

            var response = await _shiftService.logShift(shiftLogDto);

            if (response.Id == 0) {
                return Unauthorized(new { message="Something went wrong while logging shift" });
            }
            return Ok(response);
        }
    }
}
