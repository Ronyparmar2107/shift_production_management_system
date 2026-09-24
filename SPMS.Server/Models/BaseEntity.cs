namespace SPMS.Server.Models
{
    public abstract class BaseEntity
    {
        public long Id { get; set; }

        public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }
        public bool IsUpdated { get; set; } = false;

        public bool IsDeleted { get; set; } = false;
        public long? DeletedBy { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
