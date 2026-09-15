using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.EmployeeDayPreference;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EmployeeDayPreferencesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public EmployeeDayPreferencesController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeDayPreferenceResponse>>>
        GetPreferences()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var preferences = await _context.EmployeeDayPreferences
            .Where(edp => edp.Employee.CompanyId == companyId.Value)
            .Select(edp => new EmployeeDayPreferenceResponse
            {
                Id = edp.Id,
                EmployeeId = edp.EmployeeId,
                EmployeeName = edp.Employee.FirstName + " " +
                               edp.Employee.LastName,
                DayOfWeek = edp.DayOfWeek,
                IsPreferred = edp.IsPreferred,
                IsUnavailable = edp.IsUnavailable
            })
            .ToListAsync();

        return Ok(preferences);
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<EmployeeDayPreferenceResponse>>>
        GetEmployeePreferences(int employeeId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "The employee does not exist."
            });
        }

        if (!_accessControlService.IsCompanyAllowed(employee.CompanyId))
        {
            return Forbid();
        }

        var preferences = await _context.EmployeeDayPreferences
            .Where(edp => edp.EmployeeId == employeeId)
            .Select(edp => new EmployeeDayPreferenceResponse
            {
                Id = edp.Id,
                EmployeeId = edp.EmployeeId,
                EmployeeName = edp.Employee.FirstName + " " +
                               edp.Employee.LastName,
                DayOfWeek = edp.DayOfWeek,
                IsPreferred = edp.IsPreferred,
                IsUnavailable = edp.IsUnavailable
            })
            .OrderBy(edp => edp.DayOfWeek)
            .ToListAsync();

        return Ok(preferences);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDayPreferenceResponse>>
        CreatePreference(CreateEmployeeDayPreferenceRequest request)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee is null)
        {
            return BadRequest(new
            {
                message = "The employee does not exist."
            });
        }

        if (!_accessControlService.IsCompanyAllowed(employee.CompanyId))
        {
            return Forbid();
        }

        if (request.IsPreferred && request.IsUnavailable)
        {
            return BadRequest(new
            {
                message =
                    "A day cannot be both preferred and unavailable."
            });
        }

        var existingPreference = await _context.EmployeeDayPreferences
            .AnyAsync(edp =>
                edp.EmployeeId == request.EmployeeId &&
                edp.DayOfWeek == request.DayOfWeek);

        if (existingPreference)
        {
            return Conflict(new
            {
                message =
                    "A preference for this employee and day already exists."
            });
        }

        var preference = new EmployeeDayPreference
        {
            EmployeeId = request.EmployeeId,
            DayOfWeek = request.DayOfWeek,
            IsPreferred = request.IsPreferred,
            IsUnavailable = request.IsUnavailable
        };

        _context.EmployeeDayPreferences.Add(preference);

        await _context.SaveChangesAsync();

        var response = new EmployeeDayPreferenceResponse
        {
            Id = preference.Id,
            EmployeeId = employee.Id,
            EmployeeName =
                $"{employee.FirstName} {employee.LastName}",
            DayOfWeek = preference.DayOfWeek,
            IsPreferred = preference.IsPreferred,
            IsUnavailable = preference.IsUnavailable
        };

        return CreatedAtAction(
            nameof(GetEmployeePreferences),
            new { employeeId = preference.EmployeeId },
            response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePreference(int id)
    {
        var preference = await _context.EmployeeDayPreferences
            .Include(edp => edp.Employee)
            .FirstOrDefaultAsync(edp => edp.Id == id);

        if (preference is null)
        {
            return NotFound(new
            {
                message = "The day preference does not exist."
            });
        }

        if (!_accessControlService.IsCompanyAllowed(
                preference.Employee.CompanyId))
        {
            return Forbid();
        }

        _context.EmployeeDayPreferences.Remove(preference);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}