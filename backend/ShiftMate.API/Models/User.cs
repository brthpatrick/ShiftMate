namespace ShiftMate.API.Models;

public class User
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public int? EmployeeId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public Company Company { get; set; } = null!;

    public Employee? Employee { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}