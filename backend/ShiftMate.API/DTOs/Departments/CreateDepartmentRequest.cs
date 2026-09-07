using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.Departments;

public class CreateDepartmentRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int CompanyId { get; set; }
}