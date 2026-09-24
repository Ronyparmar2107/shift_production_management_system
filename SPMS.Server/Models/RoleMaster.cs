using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class RoleMaster : BaseEntity
{ 
    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
