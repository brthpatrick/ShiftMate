using ShiftMate.API.Models;

namespace ShiftMate.API.DTOs.Authentication;

public class RegisterResponse
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public int? EmployeeId { get; set; }

    public string Email { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }
}