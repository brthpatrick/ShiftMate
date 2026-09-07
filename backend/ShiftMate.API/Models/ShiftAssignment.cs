namespace ShiftMate.API.Models;

public class ShiftAssignment
{
    public int Id { get; set; }

    public int ShiftId { get; set; }

    public int EmployeeId { get; set; }

    public DateTime AssignedAt { get; set; }

    public string Status { get; set; } = string.Empty;

    public Shift Shift { get; set; } = null!;

    public Employee Employee { get; set; } = null!;
}