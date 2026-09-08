using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.ShiftAssignments;

public class AssignEmployeeToShiftRequest
{
    [Required]
    public int ShiftId { get; set; }

    [Required]
    public int EmployeeId { get; set; }
}