using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.Availabilities;

public class CreateAvailabilityRequest
{
    [Required]
    public int EmployeeId { get; set; }

    [Required]
    public DayOfWeek DayOfWeek { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    public bool IsAvailable { get; set; } = true;
}