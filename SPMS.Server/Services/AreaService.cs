
using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;

namespace SPMS.Server.Services
{

    public interface IAreaService
    {
        Task<List<AreaDto>> GetAllAreaAsync();
        Task<AreaDto> CreateAreaAsync(AreaDto areaDto);
        Task<AreaDto> UpdateAreaAsync(AreaDto areaDto);
    }
    public class AreaService : IAreaService
    {
        private readonly CurrentUserService _currentUser;
        private readonly AppDbContext _dbcontext;

        public AreaService (CurrentUserService currentUser, AppDbContext dbcontext)
        {
            _currentUser = currentUser;
            _dbcontext = dbcontext;
        }

        public async Task<List<AreaDto>> GetAllAreaAsync()
        {
            var areas = await _dbcontext.AreaMasters
                .Where(p => !p.IsDeleted)
                .Select(p => new AreaDto
                {
                    AreaId = p.Id,
                    AreaName = p.AreaName
                }
                ).ToListAsync();

            return areas;

        }

        public async Task<AreaDto> CreateAreaAsync(AreaDto areaDto)
        {
            AreaMaster areaMaster = new AreaMaster { 
                AreaName = areaDto.AreaName,
                CreatedBy =_currentUser.EmployeeId 
            };

            await _dbcontext.AreaMasters.AddAsync(areaMaster);
            await _dbcontext.SaveChangesAsync();

            areaDto.AreaId = areaMaster.Id;

            return areaDto;
        }

        public async Task<AreaDto> UpdateAreaAsync(AreaDto areaDto)
        {

            var area = await _dbcontext.AreaMasters.FirstOrDefaultAsync(p => p.Id == areaDto.AreaId);

            if (area == null) {
                areaDto.AreaId = 0;
                return areaDto;
            }

            area.AreaName = areaDto.AreaName;
            await _dbcontext.SaveChangesAsync();

        
            return areaDto;
        }

        
    }
}
