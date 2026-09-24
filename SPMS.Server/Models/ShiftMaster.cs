using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class ShiftMaster : BaseEntity
{
    public DateOnly? Date { get; set; }

    public string? Type { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }
}
