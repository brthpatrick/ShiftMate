using ShiftMate.API.Models;

namespace ShiftMate.API.DTOs.Authentication;

public class RegisterRequest
{
    public int CompanyId { get; set; }

    public int? EmployeeId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public UserRole Role { get; set; }
}