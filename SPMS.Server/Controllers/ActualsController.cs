using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]/[action]")]
    [Authorize(Policy = Policies.ActualsLog)]
    public class ActualsController : Controller
    {
        private readonly IActualService _actualService;

        public ActualsController(IActualService actualService)
        {
            _actualService = actualService;
        }

        // GET /api/Actuals/GetMyPlans
        // -> the crew lead's accepted plans in running shifts, with expected / actual / variance / status
        [HttpGet]
        public async Task<IActionResult> GetMyPlansAsync()
        {
            return Ok(await _actualService.GetMyActualsAsync());
        }

        // POST /api/Actuals/Log   body: { planId, value, readingTime, comment }
        // 200 { saved: true }  |  200 { saved: false, reasonRequired: true, message }  |  400 { message }
        [HttpPost]
        public async Task<IActionResult> LogAsync([FromBody] LogActualDto dto)
        {
            var (result, error) = await _actualService.LogActualAsync(dto);

            if (result == null)
                return BadRequest(new { message = error ?? "Something went wrong while logging the actual" });

            return Ok(result);
        }
    }
}
