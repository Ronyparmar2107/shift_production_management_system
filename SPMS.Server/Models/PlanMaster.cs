using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class PlanMaster : BaseEntity
{
   
    public long? ShiftId { get; set; }

    public long? CrewId { get; set; }

    public long? TypeId { get; set; }

    public long? AreaId { get; set; }

    public long? Target { get; set; }

    public DateTime? PlannedStart { get; set; }

    public DateTime? PlannedEnd { get; set; }

    public string? Comment { get; set; }
    public bool IsActive { get; set; } = true;

    public bool IsAccepted { get; set; } = false;

    public long? AcceptedBy {  get; set; }

    public DateTime? AcceptedAt { get; set; }
}
