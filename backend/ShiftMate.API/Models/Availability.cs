namespace ShiftMate.API.Models;

public class Availability
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public bool IsAvailable { get; set; }

    public Employee Employee { get; set; } = null!;
}