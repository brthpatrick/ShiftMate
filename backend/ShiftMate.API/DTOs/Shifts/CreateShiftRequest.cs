using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.Shifts;

public class CreateShiftRequest
{
    [Required]
    public int LocationId { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    [Range(1, 1000)]
    public int RequiredEmployees { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}