namespace SPMS.Server.DTOs
{
    public class ShiftLogDto
    {
        public long? Id { get; set; }
        public long ShiftId {  get; set; }

        public DateOnly? Date {  get; set; }

        public string LogType {  get; set; } = string.Empty;


    }
}
