namespace ShiftMate.API.Models;

public class Location
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public string Name { get; set; } = string.Empty;
    
    public string? Address { get; set; }
    
    public string? City { get; set; }
    
    public Company Company { get; set; } = null!;
}