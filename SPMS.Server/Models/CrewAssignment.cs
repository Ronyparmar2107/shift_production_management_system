using System;
using System.Collections.Generic;

namespace SPMS.Server.Models;

public partial class CrewAssignment : BaseEntity
{
   
    public long? CrewId { get; set; }

    public long? EmpId { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public byte[]? IsActive { get; set; }

}
