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

        // POST /api/Plan/CreatePlan   (MinePlanner, ShiftSupervisor, Admin)
        // A supervisor creating a plan in a running shift gets it auto-accepted.
        [HttpPost]
        [Authorize(Policy = Policies.PlanCreate)]
        public async Task<IActionResult> CreatePlanAsync([FromBody]PlanDto plan)
        {
            var (response, error) = await _planService.CreatePlanAsync(plan);

            if (response == null)
                return BadRequest(new { message = error ?? "Something Went Wrong while creating new plan" });

            return Ok(response);
        }

        // GET /api/Plan/GetMyPlans  -> plans the signed-in user created, with Status (Pending / Accepted / Updated)
        [HttpGet]
        [Authorize(Policy = Policies.PlanCreate)]
        public async Task<IActionResult> GetMyPlansAsync()
        {
            return Ok(await _planService.GetMyCreatedPlansAsync());
        }

        // POST /api/Plan/AcceptPlan   body: PlanDto (only Id is used)   (ShiftSupervisor, Admin; shift must be running)
        [HttpPost]
        [Authorize(Policy = Policies.ShiftManage)]
        public async Task<IActionResult> AcceptPlanAsync([FromBody] PlanDto plan)
        {
            var error = await _planService.AcceptPlanAsync(plan);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { message = "Plan accepted" });
        }

        // POST /api/Plan/UpdateAndAccept   body: PlanDto (Id, Area, PlanType, Target, StartTime, EndTime, Comment)
        [HttpPost]
        [Authorize(Policy = Policies.ShiftManage)]
        public async Task<IActionResult> UpdateAndAcceptAsync([FromBody] PlanDto planDto)
        {
            var error = await _planService.UpdateAndAcceptPlanAsync(planDto);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { message = "Plan updated and accepted" });
        }

    }
}
