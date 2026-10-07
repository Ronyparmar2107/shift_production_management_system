using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;

namespace SPMS.Server.Services
{
    public interface IActualService
    {
        Task<ActualsDto> GetActualsDtoAsync(ActualsDto actualsDto);
        Task<bool> PostActualsLogAsync(ActualsDto actualsDto);
    }
    public class ActualsService : IActualService
    {
        private readonly CurrentUserService _currentUserService;
        private readonly AppDbContext _dbcontext;

        public ActualsService(CurrentUserService currentUserService, AppDbContext appDbContext)
        {
           _currentUserService = currentUserService;
            _dbcontext = appDbContext;
        }

        public async Task<ActualsDto> GetActualsDtoAsync(ActualsDto actualsDto)
        {
            
            var plan_view = await _dbcontext.PlanViews.FirstOrDefaultAsync(p=> p.PlanId == actualsDto.PlanId);

            if (plan_view == null) { 
                return actualsDto;
            }


            return new ActualsDto{
                PlanId = plan_view.PlanId,
                Actual = plan_view.ActualValue,
                AreaType = plan_view.AreaName,
                CrewId = plan_view.CrewId,
                Target = plan_view.Target,
                PlanType = plan_view.PlanType,
                ShiftDate = plan_view.ShiftDate,
                ShiftType = plan_view.ShiftType,
                
            };
        }

        public async Task<bool> PostActualsLogAsync(ActualsDto actualsDto)
        {

            return true;
        }
    }
}
