namespace ShiftMate.API.DTOs.Authentication;

public class RegisterCompanyRequest
{
    public string CompanyName { get; set; } = string.Empty;

    public string CompanyEmail { get; set; } = string.Empty;

    public string? CompanyPhone { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}