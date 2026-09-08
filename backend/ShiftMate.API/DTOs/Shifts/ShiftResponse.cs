namespace ShiftMate.API.DTOs.Shifts;

public class ShiftResponse
{
    public int Id { get; set; }

    public int LocationId { get; set; }

    public string LocationName { get; set; } = null!;
    
    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public int RequiredEmployees { get; set; }
    
    public string? Notes { get; set; }
}