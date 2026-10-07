using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]/[action]")]
    public class CrewController : Controller
    {
        private readonly ICrewService _crewService;

        public CrewController(ICrewService crewService)
        {
            _crewService = crewService;
        }

        // GET /api/Crew/GetAllCrews
        [HttpGet]
        public async Task<IActionResult> GetAllCrewsAsync()
        {
            return Ok(await _crewService.GetAllCrewsAsync());
        }

        // GET /api/Crew/GetCrewLeads  — employees with the CrewLead role, and the crew each one leads (if any)
        [HttpGet]
        public async Task<IActionResult> GetCrewLeadsAsync()
        {
            return Ok(await _crewService.GetCrewLeadsAsync());
        }

        // POST /api/Crew/CreateCrew   body: { leadEmpId }
        [HttpPost]
        public async Task<IActionResult> CreateCrewAsync([FromBody] SaveCrewDto dto)
        {
            var (result, error) = await _crewService.CreateCrewAsync(dto);

            if (result == null)
                return BadRequest(new { message = error ?? "Something went wrong while creating crew" });

            return Ok(result);
        }

        // POST /api/Crew/UpdateCrew   body: { crewId, leadEmpId }
        [HttpPost]
        public async Task<IActionResult> UpdateCrewAsync([FromBody] SaveCrewDto dto)
        {
            var (result, error) = await _crewService.UpdateCrewAsync(dto);

            if (result == null)
                return BadRequest(new { message = error ?? "Something went wrong while updating crew" });

            return Ok(result);
        }

        // POST /api/Crew/DeleteCrew   body: { crewId }
        [HttpPost]
        public async Task<IActionResult> DeleteCrewAsync([FromBody] SaveCrewDto dto)
        {
            var error = await _crewService.DeleteCrewAsync(dto.CrewId);

            if (error != null)
                return BadRequest(new { message = error });

            return Ok(new { message = "Crew deleted" });
        }
    }
}
