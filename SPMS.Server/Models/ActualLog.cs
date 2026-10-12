using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class ActualLog: BaseEntity
{
   
    public long? PlanId { get; set; }

    public string? Value { get; set; }

    public string? Comment { get; set; }

    // The time the reading was taken (picked by the crew lead).
    // CreatedAt stays the server's own timestamp of when the row was saved.
    public DateTime? ReadingTime { get; set; }

}
