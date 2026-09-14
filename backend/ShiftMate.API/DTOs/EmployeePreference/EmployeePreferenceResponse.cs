namespace ShiftMate.API.DTOs.EmployeePreference;

public class EmployeePreferenceResponse
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; } = string.Empty;

    public int? MaxWeeklyHours { get; set; }
}