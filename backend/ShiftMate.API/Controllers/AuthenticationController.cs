using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Authentication;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthenticationController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IPasswordService _passwordService;

    private readonly IJwtService _jwtService;

    private readonly ICurrentUserService _currentUserService;

    public AuthenticationController(
        ShiftMateDbContext context,
        IPasswordService passwordService,
        IJwtService jwtService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
        _currentUserService = currentUserService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message = "Email is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password is required."
            });
        }

        if (request.Password.Length < 8)
        {
            return BadRequest(new
            {
                message = "Password must contain at least 8 characters."
            });
        }

        var companyExists = await _context.Companies
            .AnyAsync(c => c.Id == request.CompanyId);

        if (!companyExists)
        {
            return BadRequest(new
            {
                message = "The company does not exist."
            });
        }

        if (request.EmployeeId.HasValue)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e =>
                    e.Id == request.EmployeeId.Value);

            if (employee is null)
            {
                return BadRequest(new
                {
                    message = "The employee does not exist."
                });
            }

            if (employee.CompanyId != request.CompanyId)
            {
                return BadRequest(new
                {
                    message = "The employee does not belong to the selected company."
                });
            }
        }

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == email);

        if (emailExists)
        {
            return Conflict(new
            {
                message = "A user with this email already exists."
            });
        }

        var user = new User
        {
            CompanyId = request.CompanyId,
            EmployeeId = request.EmployeeId,
            Email = email,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordService.HashPassword(
            user,
            request.Password);

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        var response = new RegisterResponse
        {
            Id = user.Id,
            CompanyId = user.CompanyId,
            EmployeeId = user.EmployeeId,
            Email = user.Email,
            Role = user.Role,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };

        return CreatedAtAction(
            nameof(Register),
            new { id = user.Id },
            response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message = "Email is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password is required."
            });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user is null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new
            {
                message = "The user account is inactive."
            });
        }

        var passwordValid = _passwordService.VerifyPassword(
            user,
            user.PasswordHash,
            request.Password);

        if (!passwordValid)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        var (token, expiresAt) = _jwtService.GenerateToken(user);

        var response = new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            UserId = user.Id,
            CompanyId = user.CompanyId,
            EmployeeId = user.EmployeeId,
            Email = user.Email,
            Role = user.Role.ToString()
        };

        return Ok(response);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin-test")]
    public IActionResult AdminTest()
    {
        return Ok(new
        {
            message = "Admin authorization successful."
        });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            message = "Authentication successful."
        });
    }

    [Authorize]
    [HttpGet("current-user")]
    public IActionResult CurrentUser()
    {
        return Ok(new
        {
            isAuthenticated = _currentUserService.IsAuthenticated,
            userId = _currentUserService.UserId,
            companyId = _currentUserService.CompanyId,
            employeeId = _currentUserService.EmployeeId,
            email = _currentUserService.Email,
            role = _currentUserService.Role?.ToString()
        });
    }
}