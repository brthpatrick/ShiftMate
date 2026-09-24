using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Models;

namespace ShiftMate.API.Data;

public class ShiftMateDbContext : DbContext
{
    public ShiftMateDbContext(DbContextOptions<ShiftMateDbContext> options)
        : base(options)
    {
    }

    public DbSet<Company> Companies { get; set; }

    public DbSet<Location> Locations { get; set; }

    public DbSet<Department> Departments { get; set; }

    public DbSet<Employee> Employees { get; set; }

    public DbSet<Role> Roles { get; set; }

    public DbSet<EmployeeRole> EmployeeRoles { get; set; }

    public DbSet<Shift> Shifts { get; set; }

    public DbSet<ShiftAssignment> ShiftAssignments { get; set; }

    public DbSet<Availability> Availabilities { get; set; }

    public DbSet<LeaveRequest> LeaveRequests { get; set; }

    public DbSet<ShiftRoleRequirement> ShiftRoleRequirements { get; set; }

    public DbSet<EmployeePreference> EmployeePreferences { get; set; }

    public DbSet<EmployeeDayPreference> EmployeeDayPreferences { get; set; }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<EmployeeRole>()
            .HasKey(er => new { er.EmployeeId, er.RoleId });

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShiftAssignment>()
            .HasOne(sa => sa.Shift)
            .WithMany(s => s.ShiftAssignments)
            .HasForeignKey(sa => sa.ShiftId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShiftAssignment>()
            .HasIndex(sa => new { sa.EmployeeId, sa.ShiftId })
            .IsUnique();

        modelBuilder.Entity<Company>(entity =>
        {
            entity.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.Email)
                .IsRequired()
                .HasMaxLength(320);

            entity.Property(c => c.Phone)
                .HasMaxLength(30);

            entity.HasIndex(c => c.Email)
                .IsUnique();
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.Property(l => l.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(l => l.Address)
                .HasMaxLength(300);

            entity.Property(l => l.City)
                .HasMaxLength(100);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(320);

            entity.Property(e => e.Phone)
                .HasMaxLength(30);

            entity.HasIndex(e => e.Email)
                .IsUnique();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.Property(r => r.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(r => r.Description)
                .HasMaxLength(500);

            entity.HasIndex(r => r.Name)
                .IsUnique();
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.Property(d => d.Name)
                .IsRequired()
                .HasMaxLength(100);
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.Property(s => s.Notes)
                .HasMaxLength(1000);
        });

        modelBuilder.Entity<ShiftAssignment>(entity =>
        {
            entity.Property(sa => sa.Status)
                .HasMaxLength(30)
                .IsRequired();
        });

        modelBuilder.Entity<ShiftRoleRequirement>(entity =>
        {
            entity.Property(srr => srr.RequiredEmployees)
                .IsRequired();

            entity.HasOne(srr => srr.Shift)
                .WithMany(s => s.RoleRequirements)
                .HasForeignKey(srr => srr.ShiftId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(srr => srr.Role)
                .WithMany(r => r.ShiftRoleRequirements)
                .HasForeignKey(srr => srr.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(srr => new { srr.ShiftId, srr.RoleId })
                .IsUnique();
        });

        modelBuilder.Entity<LeaveRequest>(entity =>
        {
            entity.Property(lr => lr.Reason)
                .HasMaxLength(500);

            entity.Property(lr => lr.Status)
                .HasMaxLength(30)
                .IsRequired();
        });

        modelBuilder.Entity<EmployeePreference>(entity =>
        {
            entity.HasOne(ep => ep.Employee)
                .WithMany(e => e.Preferences)
                .HasForeignKey(ep => ep.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(ep => ep.EmployeeId)
                .IsUnique();
        });

        modelBuilder.Entity<EmployeeDayPreference>(entity =>
        {
            entity.HasOne(edp => edp.Employee)
                .WithMany(e => e.DayPreferences)
                .HasForeignKey(edp => edp.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(edp => new
            {
                edp.EmployeeId,
                edp.DayOfWeek
            })
            .IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(u => u.PasswordHash)
                .IsRequired();

            entity.HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(u => u.Employee)
                .WithOne(e => e.User)
                .HasForeignKey<User>(u => u.EmployeeId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => rt.Id);

            entity.Property(rt => rt.TokenHash)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(rt => rt.ReplacedByTokenHash)
                .HasMaxLength(128);

            entity.HasIndex(rt => rt.TokenHash)
                .IsUnique();

            entity.HasIndex(rt => rt.UserId);

            entity.HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}