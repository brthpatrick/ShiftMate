namespace ShiftMate.API.DTOs.ShiftAssignments;

public class ShiftAssignmentResponse
{
    public int Id { get; set; }

    public int ShiftId { get; set; }

    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; } = null!;

    public string LocationName { get; set; } = null!;

    public DateTime ShiftStartTime { get; set; }

    public DateTime ShiftEndTime { get; set; }

    public DateTime AssignedAt { get; set; }

    public string Status { get; set; } = string.Empty;
}