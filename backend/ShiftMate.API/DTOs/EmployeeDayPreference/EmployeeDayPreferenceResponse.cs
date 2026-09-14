namespace ShiftMate.API.DTOs.EmployeeDayPreference;

public class EmployeeDayPreferenceResponse
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; } = string.Empty;

    public DayOfWeek DayOfWeek { get; set; }

    public bool IsPreferred { get; set; }

    public bool IsUnavailable { get; set; }
}