using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SPMS.Server.Data;
using SPMS.Server.DTOs;
using SPMS.Server.Models;
using System.Numerics;

namespace SPMS.Server.Services
{
    public interface IShiftService
    {
        Task<ShiftDto> GetorCreateShiftAsync(ShiftDto shiftDto);
        Task<ShiftLogDto> logShift(ShiftLogDto shift);
    }
    public class ShiftService : IShiftService
    {
        private readonly AppDbContext _dbcontext;
        private readonly CurrentUserService _currentUserService;
        
        public ShiftService( AppDbContext appDbContext, CurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
            _dbcontext = appDbContext;
        }

        public async Task<ShiftDto> GetorCreateShiftAsync(ShiftDto shiftDto)
        {
            var shift = await _dbcontext.ShiftMasters.FirstOrDefaultAsync(p => p.Date == shiftDto.Date && p.Type == shiftDto.ShiftType);

            //If Shift does not exit we will create it.
            if (shift == null)
            {
                ShiftMaster newShift = new ShiftMaster
                {
                    Date = shiftDto.Date,
                    Type = shiftDto.ShiftType,
                    CreatedBy = _currentUserService.EmployeeId
                };

                await _dbcontext.AddAsync(newShift);
                await _dbcontext.SaveChangesAsync();

                shift = newShift;
            }


            return new ShiftDto { Id = shift.Id, Date = shift.Date, ShiftType = shift.Type}; 
        }


        public async Task<ShiftLogDto> logShift(ShiftLogDto shiftLogDto) 
        {
          

            ShiftLog shiftLog = new ShiftLog
            {
                EmpId = _currentUserService.EmployeeId,
                ShiftId = shiftLogDto.ShiftId,
                LogType = shiftLogDto.LogType,
            };

            await _dbcontext.AddAsync(shiftLog);
            await _dbcontext.SaveChangesAsync();

            shiftLogDto.Id = shiftLog.Id;

            return shiftLogDto;
        }
    }
}
