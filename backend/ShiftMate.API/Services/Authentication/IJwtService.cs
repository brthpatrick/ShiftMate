using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Authentication;

public interface IJwtService
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}