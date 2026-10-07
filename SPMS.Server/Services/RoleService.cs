using Microsoft.EntityFrameworkCore;
using SPMS.Server.Data;
using SPMS.Server.DTOs;

namespace SPMS.Server.Services
{
    public interface IRoleService
    {
        Task<List<RoleDto>> GetAllRolesAsync();
    }

    public class RoleService : IRoleService
    {
        private readonly AppDbContext _dbcontext;

        public RoleService(AppDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task<List<RoleDto>> GetAllRolesAsync()
        {
            return await _dbcontext.RoleMasters
                .Where(r => r.IsActive && !r.IsDeleted)
                .OrderBy(r => r.Id)
                .Select(r => new RoleDto
                {
                    RoleId = r.Id,
                    Role = r.Role
                })
                .ToListAsync();
        }
    }
}
