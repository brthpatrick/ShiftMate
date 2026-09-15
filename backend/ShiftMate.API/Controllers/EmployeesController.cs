using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Employees;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public EmployeesController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeResponse>>> GetEmployees()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var employees = await _context.Employees
            .Where(e => e.CompanyId == companyId.Value)
            .Select(e => new EmployeeResponse
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                DepartmentId = e.DepartmentId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Phone = e.Phone,
                HireDate = e.HireDate,
                IsActive = e.IsActive
            })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeResponse>> GetEmployee(int id)
    {
        var employee = await _context.Employees
            .Where(e => e.Id == id)
            .Select(e => new EmployeeResponse
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                DepartmentId = e.DepartmentId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Phone = e.Phone,
                HireDate = e.HireDate,
                IsActive = e.IsActive
            })
            .FirstOrDefaultAsync();

        if (employee == null)
        {
            return NotFound();
        }

        if (!await _accessControlService.IsEmployeeAllowedAsync(id))
        {
            return Forbid();
        }

        return Ok(employee);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<EmployeeResponse>> CreateEmployee(
     CreateEmployeeRequest request)
    {
        var currentCompanyId = _currentUserService.CompanyId;

        if (!currentCompanyId.HasValue)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            return BadRequest("First name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            return BadRequest("Last name is required.");
        }

        var companyExists = await _context.Companies
            .AnyAsync(c => c.Id == currentCompanyId.Value);

        if (!companyExists)
        {
            return BadRequest("The current company does not exist.");
        }

        var departmentExists = await _context.Departments
            .AnyAsync(d =>
                d.Id == request.DepartmentId &&
                d.CompanyId == currentCompanyId.Value);

        if (!departmentExists)
        {
            return BadRequest(
                "The specified department does not exist or does not belong to your company.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Email is required.");
        }

        var email = request.Email.Trim().ToLower();

        var emailExists = await _context.Employees
            .AnyAsync(e => e.Email == email);

        if (emailExists)
        {
            return Conflict(
                "An employee with the specified email already exists.");
        }

        var employee = new Employee
        {
            CompanyId = currentCompanyId.Value,
            DepartmentId = request.DepartmentId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = email,
            Phone = string.IsNullOrWhiteSpace(request.Phone)
                ? null
                : request.Phone.Trim(),
            HireDate = request.HireDate,
            IsActive = true
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        var response = new EmployeeResponse
        {
            Id = employee.Id,
            CompanyId = employee.CompanyId,
            DepartmentId = employee.DepartmentId,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Email = employee.Email,
            Phone = employee.Phone,
            HireDate = employee.HireDate,
            IsActive = employee.IsActive
        };

        return CreatedAtAction(
            nameof(GetEmployee),
            new { id = employee.Id },
            response);
    }
}