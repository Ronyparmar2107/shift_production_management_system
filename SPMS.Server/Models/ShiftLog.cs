using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class ShiftLog : BaseEntity
{
   
    public long? ShiftId { get; set; }

    public long? EmpId { get; set; }

    public string? LogType { get; set; }

    public string? Comment { get; set; }
}
