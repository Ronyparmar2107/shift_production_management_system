using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
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
            var response = await _planService.CreatePlanAsync(plan);
             
            if (response == null)
                return Unauthorized(new { message = "Something Went Wrong while creating new employee" });

            return Ok(response);
        }

        [HttpGet]
        public async Task<IActionResult> GetPlanByEmployeeIdAsync()
        {
            var response = await _planService.GetPlanByEmployeeAsync();

            if (response.Id == 0)
            {
                Unauthorized(new { message = "Seems like no Plans made for you" });
            }
            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> AcceptPlanAsync([FromBody] PlanDto plan)
        {
            var response = await _planService.AcceptPlanAsync(plan);
            
            if(!response)
            {
                Unauthorized(new { message = "Something went wrong while approval, contact IT Team" });
            }
            return Ok(response);

        }

        [HttpPost]
        public async Task<IActionResult> UpdateAndAcceptAsync([FromBody] PlanDto planDto)
        {
            var response = await _planService.UpdateAndAcceptPlanAsync(planDto);

            if (!response)
            {
                Unauthorized(new { message = "Something went wrong while updating, contact IT Tema" });
            }
            return Ok(response);

        }

    }
}
