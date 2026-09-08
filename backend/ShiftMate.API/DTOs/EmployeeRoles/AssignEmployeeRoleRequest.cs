using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.EmployeeRoles;

public class AssignEmployeeRoleRequest
{
    [Required]
    public int EmployeeId { get; set; }

    [Required]
    public int RoleId { get; set; }
}