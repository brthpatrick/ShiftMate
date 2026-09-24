using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Authentication;

public interface IRefreshTokenService
{
    (string Token, string TokenHash, DateTime ExpiresAt)
        GenerateToken();

    Task<RefreshToken?> GetValidTokenAsync(
        string token);

    Task RevokeTokenAsync(
        RefreshToken token,
        string? replacementTokenHash = null);
}