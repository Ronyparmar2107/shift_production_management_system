using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using SPMS.Server.Models;

namespace SPMS.Server.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ActualLog> ActualLogs { get; set; }

    public virtual DbSet<AreaMaster> AreaMasters { get; set; }

    public virtual DbSet<CrewAssignment> CrewAssignments { get; set; }

    public virtual DbSet<CrewMaster> CrewMasters { get; set; }

    public virtual DbSet<EmpMaster> EmpMasters { get; set; }

    public virtual DbSet<LoginCred> LoginCreds { get; set; }

    public virtual DbSet<PlanMaster> PlanMasters { get; set; }

    public virtual DbSet<PlanTypeMaster> PlanTypeMasters { get; set; }

    public virtual DbSet<RoleMaster> RoleMasters { get; set; }

    public virtual DbSet<ShiftLog> ShiftLogs { get; set; }

    public virtual DbSet<ShiftMaster> ShiftMasters { get; set; }

 

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ActualLog>(entity =>
        {
            entity.ToTable("actual_logs");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Comment)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("comment");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.PlanId).HasColumnName("plan_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.Value)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("value");
        });

        modelBuilder.Entity<AreaMaster>(entity =>
        {
            entity.ToTable("area_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AreaName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("area_name");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<CrewAssignment>(entity =>
        {
            entity.ToTable("crew_assignment");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CrewId).HasColumnName("crew_id");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.EmpId).HasColumnName("emp_id");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsActive)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_active");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<CrewMaster>(entity =>
        {
            entity.ToTable("crew_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.LeadEmpId).HasColumnName("lead_emp_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<EmpMaster>(entity =>
        {
            entity.ToTable("emp_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.EmployeeNumber)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("employee_number");
            entity.Property(e => e.IsActive)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_active");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("name");
            entity.Property(e => e.ResignationAt).HasColumnName("resignation_at");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<LoginCred>(entity =>
        {
            entity.ToTable("login_creds");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.EmpId).HasColumnName("emp_id");
            entity.Property(e => e.IsActive)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_active");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.Password)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("password");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<PlanMaster>(entity =>
        {
            entity.ToTable("plan_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AreaId).HasColumnName("area_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CrewId).HasColumnName("crew_id");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsActive)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_active");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.PlannedEnd)
                .HasColumnType("datetime")
                .HasColumnName("planned_end");
            entity.Property(e => e.PlannedStart)
                .HasColumnType("datetime")
                .HasColumnName("planned_start");
            entity.Property(e => e.ShiftId).HasColumnName("shift_id");
            entity.Property(e => e.Comment)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("comment");
            entity.Property(e => e.Target).HasColumnName("target");
            entity.Property(e => e.TypeId).HasColumnName("type_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.IsAccepted).HasColumnName("is_accepted");
            entity.Property(e => e.AcceptedBy).HasColumnName("accepted_by");
            entity.Property(e => e.AcceptedAt)
            .HasColumnType("datetime")
            .HasColumnName("accepted_at");

        });

        modelBuilder.Entity<PlanTypeMaster>(entity =>
        {
            entity.ToTable("plan_type_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("type");
            entity.Property(e => e.Unit)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("unit");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            
        });

        modelBuilder.Entity<RoleMaster>(entity =>
        {
            entity.ToTable("role_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.IsActive)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_active");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("role");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<ShiftLog>(entity =>
        {
            entity.ToTable("shift_logs");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Comment)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("comment");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.EmpId).HasColumnName("emp_id");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.LogType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("log_type");
            entity.Property(e => e.ShiftId).HasColumnName("shift_id");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        modelBuilder.Entity<ShiftMaster>(entity =>
        {
            entity.ToTable("shift_master");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Date).HasColumnName("date");
            entity.Property(e => e.DeletedAt)
                .HasColumnType("datetime")
                .HasColumnName("deleted_at");
            entity.Property(e => e.DeletedBy).HasColumnName("deleted_by");
            entity.Property(e => e.EndTime).HasColumnName("end_time");
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_deleted");
            entity.Property(e => e.IsUpdated)
                .HasMaxLength(50)
                .IsFixedLength()
                .HasColumnName("is_updated");
            entity.Property(e => e.StartTime).HasColumnName("start_time");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("type");
            entity.Property(e => e.UpdatedAt)
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
