namespace ShiftMate.API.DTOs.Locations;

public class LocationResponse
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
}