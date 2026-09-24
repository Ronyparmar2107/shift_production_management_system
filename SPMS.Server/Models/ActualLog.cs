using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class ActualLog: BaseEntity
{
   
    public long? PlanId { get; set; }

    public string? Value { get; set; }

    public string? Comment { get; set; }

}
