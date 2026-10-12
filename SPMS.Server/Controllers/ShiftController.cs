using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]/[action]")]
    [Authorize(Policy = Policies.ShiftManage)]
    public class ShiftController : Controller
    {
        private readonly IShiftService _shiftService;
        private readonly IPlanService _planService;

        public ShiftController(IShiftService shiftService, IPlanService planService)
        {
            _shiftService = shiftService;
            _planService = planService;
        }

        // GET /api/Shift/Overview?date=2026-10-12&shiftType=Morning
        // -> { shiftId, date, shiftType, status, startedAt, endedAt, startedByName, plans[] }
        [HttpGet]
        public async Task<IActionResult> OverviewAsync([FromQuery] DateOnly? date, [FromQuery] string? shiftType)
        {
            var (overview, error) = await _shiftService.GetShiftAsync(date, shiftType);
            return await ToResponseAsync(overview, error);
        }

        // GET /api/Shift/Dashboard?date=2026-10-12&shiftType=Morning
        // -> { current: { shift fields, summary, rows[] }, previous: [ same shape, last two shifts with plans ] }
        [HttpGet]
        public async Task<IActionResult> DashboardAsync([FromQuery] DateOnly? date, [FromQuery] string? shiftType)
        {
            var (dashboard, error) = await _shiftService.GetDashboardAsync(date, shiftType);

            if (dashboard == null)
                return BadRequest(new { message = error ?? "Something went wrong while loading the dashboard" });

            return Ok(dashboard);
        }

        // POST /api/Shift/Start   body: { date, shiftType }
        [HttpPost]
        public async Task<IActionResult> StartAsync([FromBody] ShiftDto shiftDto)
        {
            var (overview, error) = await _shiftService.StartShiftAsync(shiftDto);
            return await ToResponseAsync(overview, error);
        }

        // POST /api/Shift/End   body: { id }
        [HttpPost]
        public async Task<IActionResult> EndAsync([FromBody] ShiftDto shiftDto)
        {
            var (overview, error) = await _shiftService.EndShiftAsync(shiftDto);
            return await ToResponseAsync(overview, error);
        }

        // Every shift response carries the shift's current plans so the screen needs a single call
        private async Task<IActionResult> ToResponseAsync(ShiftOverviewDto? overview, string? error)
        {
            if (overview == null)
                return BadRequest(new { message = error ?? "Something went wrong with the shift" });

            if (overview.ShiftId != 0)
                overview.Plans = await _planService.GetShiftPlansAsync(overview.ShiftId);

            return Ok(overview);
        }
    }
}
