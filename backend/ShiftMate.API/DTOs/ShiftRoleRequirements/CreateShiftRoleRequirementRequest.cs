namespace ShiftMate.API.DTOs.ShiftRoleRequirements;

public class CreateShiftRoleRequirementRequest
{
    public int ShiftId { get; set; }

    public int RoleId { get; set; }

    public int RequiredEmployees { get; set; }
}