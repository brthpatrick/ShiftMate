namespace ShiftMate.API.Models;

public class EmployeePreference
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public int? MaxWeeklyHours { get; set; }

    public Employee Employee { get; set; } = null!;
}