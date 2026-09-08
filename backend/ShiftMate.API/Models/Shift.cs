namespace ShiftMate.API.Models;

public class Shift
{
    public int Id { get; set; }

    public int LocationId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public int RequiredEmployees { get; set; }

    public string? Notes { get; set; }

    public Location Location { get; set; } = null!;

    public ICollection<ShiftAssignment> ShiftAssignments { get; set; } = new List<ShiftAssignment>();

    public ICollection<ShiftRoleRequirement> RoleRequirements { get; set; } = new List<ShiftRoleRequirement>();
}