using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Authentication;

public interface ICurrentUserService
{
    int? UserId { get; }

    int? CompanyId { get; }

    int? EmployeeId { get; }

    UserRole? Role { get; }

    string? Email { get; }

    bool IsAuthenticated { get; }
}