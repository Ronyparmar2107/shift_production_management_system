using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]/[action]")]
    [Authorize]
    public class PlanController : Controller
    {
        private readonly IPlanService _planService;

        public PlanController(IPlanService planService)
        {
            _planService = planService;
        }
        
        [HttpPost]
        public async Task<IActionResult> CreatePlanAsync([FromBody]PlanDto plan)
        {
            var (response, error) = await _planService.CreatePlanAsync(plan);

            if (response == null)
                return BadRequest(new { message = error ?? "Something Went Wrong while creating new plan" });

            return Ok(response);
        }

        // GET /api/Plan/GetPlanTypes  -> [{ planTypeId, type, unit }]
        [HttpGet]
        public async Task<IActionResult> GetPlanTypesAsync()
        {
            return Ok(await _planService.GetPlanTypesAsync());
        }

        // GET /api/Plan/GetMyPlans  -> plans the signed-in user created, with Status (Pending / Accepted / Accepted with changes)
        [HttpGet]
        public async Task<IActionResult> GetMyPlansAsync()
        {
            return Ok(await _planService.GetMyCreatedPlansAsync());
        }

        [HttpGet]
        public async Task<IActionResult> GetPlanByEmployeeIdAsync()
        {
            var response = await _planService.GetPlanByEmployeeAsync();

            if (response.Id == 0)
            {
                return BadRequest(new { message = "Seems like no Plans made for you" });
            }
            return Ok(response);
        }

        // GET /api/Plan/GetCrewPlans  -> plans assigned to the signed-in crew lead's crew (same shape as GetMyPlans)
        [HttpGet]
        public async Task<IActionResult> GetCrewPlansAsync()
        {
            return Ok(await _planService.GetCrewPlansAsync());
        }

        // POST /api/Plan/AcceptPlan   body: PlanDto (only Id is used)
        [HttpPost]
        public async Task<IActionResult> AcceptPlanAsync([FromBody] PlanDto plan)
        {
            var error = await _planService.AcceptPlanAsync(plan);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { message = "Plan accepted" });
        }

        // POST /api/Plan/UpdateAndAccept   body: PlanDto (Id, Area, PlanType, Target, StartTime, EndTime, Comment)
        [HttpPost]
        public async Task<IActionResult> UpdateAndAcceptAsync([FromBody] PlanDto planDto)
        {
            var error = await _planService.UpdateAndAcceptPlanAsync(planDto);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { message = "Plan updated and accepted" });
        }

    }
}
