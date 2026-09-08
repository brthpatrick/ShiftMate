using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.Roles;

public class CreateRoleRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}