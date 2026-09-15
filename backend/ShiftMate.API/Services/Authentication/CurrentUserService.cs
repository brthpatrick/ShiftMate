using System.Security.Claims;
using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Authentication;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated =>
        User?.Identity?.IsAuthenticated ?? false;

    public int? UserId =>
        TryGetIntClaim(ClaimTypes.NameIdentifier);

    public int? CompanyId =>
        TryGetIntClaim("CompanyId");

    public int? EmployeeId =>
        TryGetIntClaim("EmployeeId");

    public string? Email =>
        User?.FindFirst(ClaimTypes.Email)?.Value;

    public UserRole? Role
    {
        get
        {
            var role = User?.FindFirst(ClaimTypes.Role)?.Value;

            if (Enum.TryParse<UserRole>(role, out var parsedRole))
            {
                return parsedRole;
            }

            return null;
        }
    }

    private int? TryGetIntClaim(string claimType)
    {
        var value = User?.FindFirst(claimType)?.Value;

        if (int.TryParse(value, out var result))
        {
            return result;
        }

        return null;
    }
}