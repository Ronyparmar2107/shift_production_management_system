using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class LoginCred : BaseEntity
{
    public long? EmpId { get; set; }

    public string? Password { get; set; }

    public bool IsActive { get; set; } = true;
}
