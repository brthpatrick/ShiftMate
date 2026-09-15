using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    [HttpPost("register-company")]
    public async Task<IActionResult> RegisterCompany(
        RegisterCompanyRequest request)
    {
        var companyName = request.CompanyName.Trim();
        var companyEmail = request.CompanyEmail.Trim().ToLower();
        var email = request.Email.Trim().ToLower();

        if (string.IsNullOrWhiteSpace(companyName))
        {
            return BadRequest(new
            {
                message = "Company name is required."
            });
        }

        if (string.IsNullOrWhiteSpace(companyEmail))
        {
            return BadRequest(new
            {
                message = "Company email is required."
            });
        }

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

        var companyEmailExists = await _context.Companies
            .AnyAsync(c => c.Email.ToLower() == companyEmail);

        if (companyEmailExists)
        {
            return Conflict(new
            {
                message = "A company with this email already exists."
            });
        }

        var userEmailExists = await _context.Users
            .AnyAsync(u => u.Email == email);

        if (userEmailExists)
        {
            return Conflict(new
            {
                message = "A user with this email already exists."
            });
        }

        var company = new Company
        {
            Name = companyName,
            Email = companyEmail,
            Phone = request.CompanyPhone?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        var user = new User
        {
            CompanyId = company.Id,
            EmployeeId = null,
            Email = email,
            Role = UserRole.Admin,
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
            nameof(RegisterCompany),
            new { id = user.Id },
            response);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request)
    {
        var currentCompanyId = _currentUserService.CompanyId;

        if (!currentCompanyId.HasValue)
        {
            return Unauthorized(new
            {
                message = "The current user is not associated with a company."
            });
        }

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

        if (request.Role == UserRole.Admin)
        {
            return Forbid();
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

            if (employee.CompanyId != currentCompanyId.Value)
            {
                return Forbid();
            }

            var employeeAlreadyHasUser = await _context.Users
                .AnyAsync(u =>
                    u.EmployeeId == request.EmployeeId.Value);

            if (employeeAlreadyHasUser)
            {
                return Conflict(new
                {
                    message = "This employee already has a user account."
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
            CompanyId = currentCompanyId.Value,
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
    public async Task<IActionResult> Login(
        LoginRequest request)
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