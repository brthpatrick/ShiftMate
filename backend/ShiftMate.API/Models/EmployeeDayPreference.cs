namespace ShiftMate.API.Models;

public class EmployeeDayPreference
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public bool IsPreferred { get; set; }

    public bool IsUnavailable { get; set; }

    public Employee Employee { get; set; } = null!;
}