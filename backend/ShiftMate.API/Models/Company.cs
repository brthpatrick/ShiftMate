namespace ShiftMate.API.Models;

public class Company
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public DateTime CreatedAt { get; set; } 
    
    public ICollection<Location> Locations { get; set; } = new List<Location>();
}