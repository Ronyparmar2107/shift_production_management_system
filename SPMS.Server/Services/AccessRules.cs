using System.Security.Claims;

namespace SPMS.Server.Services
{
    // Role names as stored in role_master. Matching ignores case, spaces and punctuation,
    // so "ShiftSupervisor", "Shift Supervisor" and "shift_supervisor" are all the same role.
    public static class RoleNames
    {
        public const string Admin = "Admin";
        public const string MinePlanner = "MinePlanner";
        public const string ShiftSupervisor = "ShiftSupervisor";
        public const string CrewLead = "CrewLead";

        private static string Normalize(string? value) =>
            new string((value ?? "").Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();

        public static bool Has(ClaimsPrincipal user, params string[] roles)
        {
            var wanted = roles.Select(Normalize).ToHashSet();
            return user.FindAll(ClaimTypes.Role).Any(c => wanted.Contains(Normalize(c.Value)));
        }
    }

    public static class Policies
    {
        public const string PlanCreate = "PlanCreate";     // MinePlanner, ShiftSupervisor, Admin
        public const string ShiftManage = "ShiftManage";   // ShiftSupervisor, Admin
        public const string ActualsLog = "ActualsLog";     // CrewLead
    }

    public static class ShiftRules
    {
        public static readonly string[] Types = { "Morning", "Afternoon", "Night" };

        // Derived shift state
        public const string NotStarted = "NotStarted";
        public const string Running = "Running";
        public const string Ended = "Ended";

        // shift_logs.log_type values that drive the state (OnShift / OffShift clock events are not used)
        public const string LogStart = "ShiftStart";
        public const string LogEnd = "ShiftEnd";

        // Returns the canonical shift name, or null if it is not one of the three shifts
        public static string? NormalizeType(string? value) =>
            Types.FirstOrDefault(t => string.Equals(t, value?.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}
