using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class PlanTypeMaster : BaseEntity
{
   public string? Type { get; set; }

    public string? Unit { get; set; }

}
