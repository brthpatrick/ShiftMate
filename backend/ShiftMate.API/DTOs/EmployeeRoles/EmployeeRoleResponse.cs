namespace ShiftMate.API.DTOs.EmployeeRoles;

public class EmployeeRoleResponse
{
    public int EmployeeId { get; set; }
    public int RoleId { get; set; }

    public string EmployeeName { get; set; } = string.Empty;

    public string RoleName { get; set; } = string.Empty;
}