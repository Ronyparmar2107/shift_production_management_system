using System.Security.Claims;

namespace SPMS.Server.Services
{
    public class CurrentUserService
    {
        private readonly IHttpContextAccessor _contextAccessor;

        public CurrentUserService (IHttpContextAccessor contextAccessor)
        {
            _contextAccessor = contextAccessor;
        }

        public long? EmployeeId
        {
            get
            {
                var claimId = _contextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                return int.TryParse(claimId, out var id) ? id : null;
            }
        }
    }
}
