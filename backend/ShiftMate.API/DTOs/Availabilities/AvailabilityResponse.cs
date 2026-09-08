namespace ShiftMate.API.DTOs.Availabilities;

public class AvailabilityResponse
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; } = string.Empty;

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }
    
    public bool IsAvailable { get; set; }
}