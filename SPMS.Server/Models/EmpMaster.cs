using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class EmpMaster : BaseEntity
{
  
    public string? Name { get; set; }

    public long RoleId { get; set; }

    public string EmployeeNumber { get; set; } = string.Empty;

    public DateOnly? ResignationAt { get; set; }

    public bool? IsActive { get; set; } = true;

}
