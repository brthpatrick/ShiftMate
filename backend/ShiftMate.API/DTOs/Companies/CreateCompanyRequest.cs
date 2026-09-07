namespace ShiftMate.API.DTOs.Companies;

public class CreateCompanyRequest
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }
}