using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Authentication;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly ShiftMateDbContext _context;
    private readonly IConfiguration _configuration;

    public RefreshTokenService(
        ShiftMateDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public (string Token, string TokenHash, DateTime ExpiresAt)
        GenerateToken()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(64);

        var token = Convert.ToBase64String(tokenBytes);

        var tokenHash = HashToken(token);

        var expirationDays = _configuration.GetValue<int>(
            "Jwt:RefreshTokenExpirationDays");

        if (expirationDays <= 0)
        {
            expirationDays = 7;
        }

        var expiresAt = DateTime.UtcNow.AddDays(
            expirationDays);

        return (
            token,
            tokenHash,
            expiresAt);
    }

    public async Task<RefreshToken?> GetValidTokenAsync(
        string token)
    {
        var tokenHash = HashToken(token);

        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt =>
                rt.TokenHash == tokenHash &&
                rt.RevokedAt == null &&
                rt.ExpiresAt > DateTime.UtcNow &&
                rt.User.IsActive);
    }

    public async Task RevokeTokenAsync(
        RefreshToken token,
        string? replacementTokenHash = null)
    {
        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByTokenHash = replacementTokenHash;

        await _context.SaveChangesAsync();
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(token));

        return Convert.ToHexString(bytes);
    }
}