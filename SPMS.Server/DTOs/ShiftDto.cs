namespace SPMS.Server.DTOs
{
    public class ShiftDto
    {
        public long Id {  get; set; }
        public long EmployeeId { get; set; }

        public DateOnly? Date {  get; set; }

        public string ShiftType {  get; set; } = string.Empty;


    }
}
