namespace ShiftMate.API.Models;

public class ShiftRoleRequirement
{
    public int Id { get; set; }

    public int ShiftId { get; set; }

    public int RoleId { get; set; } 

    public int RequiredEmployees { get; set; }

    public Shift Shift { get; set; } = null!;

    public Role Role { get; set; } = null!;
}