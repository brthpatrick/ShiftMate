using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.Employees;

public class CreateEmployeeRequest
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int DepartmentId { get; set; }

    public DateTime HireDate { get; set; }
}