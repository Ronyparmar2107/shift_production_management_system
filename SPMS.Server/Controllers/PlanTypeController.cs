using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]/[action]")]
    public class PlanTypeController : Controller
    {
        private readonly IPlanTypeService _planTypeService;

        public PlanTypeController(IPlanTypeService planTypeService)
        {
            _planTypeService = planTypeService;
        }

        // GET /api/PlanType/GetAllPlanTypes -> [{ planTypeId, type, unit }]
        [HttpGet]
        public async Task<IActionResult> GetAllPlanTypesAsync()
        {
            return Ok(await _planTypeService.GetAllPlanTypesAsync());
        }

        // POST /api/PlanType/CreatePlanType   body: { type, unit }
        [HttpPost]
        public async Task<IActionResult> CreatePlanTypeAsync([FromBody] SavePlanTypeDto dto)
        {
            var (result, error) = await _planTypeService.CreatePlanTypeAsync(dto);

            if (result == null)
                return BadRequest(new { message = error ?? "Something went wrong while creating plan type" });

            return Ok(result);
        }

        // POST /api/PlanType/UpdatePlanType   body: { planTypeId, type, unit }
        [HttpPost]
        public async Task<IActionResult> UpdatePlanTypeAsync([FromBody] SavePlanTypeDto dto)
        {
            var (result, error) = await _planTypeService.UpdatePlanTypeAsync(dto);

            if (result == null)
                return BadRequest(new { message = error ?? "Something went wrong while updating plan type" });

            return Ok(result);
        }

        // POST /api/PlanType/DeletePlanType   body: { planTypeId }
        [HttpPost]
        public async Task<IActionResult> DeletePlanTypeAsync([FromBody] SavePlanTypeDto dto)
        {
            var error = await _planTypeService.DeletePlanTypeAsync(dto.PlanTypeId);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { message = "Plan type deleted" });
        }
    }
}
