namespace ShiftMate.API.DTOs.ShiftRoleRequirements;

public class ShiftRoleRequirementResponse
{
    public int Id { get; set; }

    public int ShiftId { get; set; }

    public int RoleId { get; set; }

    public string RoleName { get; set; } = string.Empty;

    public int RequiredEmployees { get; set; }
}