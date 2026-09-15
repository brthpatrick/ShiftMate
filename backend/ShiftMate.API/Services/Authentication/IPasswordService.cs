using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Authentication;

public interface IPasswordService
{
    string HashPassword(User user, string password);
    bool VerifyPassword(
        User user,
        string hashedPassword,
        string providedPassword);
}