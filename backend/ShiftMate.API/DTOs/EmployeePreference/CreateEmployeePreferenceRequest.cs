namespace ShiftMate.API.DTOs.EmployeePreference;

public class CreateEmployeePreferenceRequest
{
    public int EmployeeId { get; set; }

    public int? MaxWeeklyHours { get; set; }
}