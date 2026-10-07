using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SPMS.Server.DTOs;
using SPMS.Server.Services;

namespace SPMS.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]/[action]")]
    public class AreaController : Controller
    {
        private readonly IAreaService _areaService;

        public AreaController(IAreaService areaService)
        {
            _areaService = areaService;
        }


        [HttpGet]
        public async Task<IActionResult> GetAllAreaAsync()
        {
            var response = await _areaService.GetAllAreaAsync();

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateAreaAsync([FromBody] AreaDto areaDto)
        {
            var response = await _areaService.UpdateAreaAsync(areaDto);

            if (response.AreaId == 0)
            {
                return BadRequest(new { message = "Something went wrong while updating" });
            }

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAreaAsync([FromBody] AreaDto areaDto)
        {
            var response = await _areaService.CreateAreaAsync(areaDto);

            if (response.AreaId == 0) {

                return BadRequest(new { message = "Something went wrong while creating new area" });
            }

            return Ok(areaDto);
        }
    }
}
