using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.Locations;

public class CreateLocationRequest
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }
}