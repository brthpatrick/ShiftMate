namespace ShiftMate.API.DTOs.EmployeeDayPreference;

public class CreateEmployeeDayPreferenceRequest
{
    public int EmployeeId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public bool IsPreferred { get; set; }

    public bool IsUnavailable { get; set; }
}