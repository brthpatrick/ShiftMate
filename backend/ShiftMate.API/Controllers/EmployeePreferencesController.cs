using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.EmployeePreference;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeePreferencesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public EmployeePreferencesController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeePreferenceResponse>>> GetPreferences()
    {
        var preferences = await _context.EmployeePreferences
            .Include(ep => ep.Employee)
            .Select(ep => new EmployeePreferenceResponse
            {
                Id = ep.Id,
                EmployeeId = ep.EmployeeId,
                EmployeeName = $"{ep.Employee.FirstName} {ep.Employee.LastName}",
                MaxWeeklyHours = ep.MaxWeeklyHours
            })
            .ToListAsync();

        return Ok(preferences);
    }

    [HttpGet("{employeeId}")]
    public async Task<ActionResult<EmployeePreferenceResponse>> GetEmployeePreferences(
        int employeeId)
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

        var preference = await _context.EmployeePreferences
            .FirstOrDefaultAsync(ep => ep.EmployeeId == employeeId);

        if (preference is null)
        {
            return NotFound(new
            {
                message = "No preferences were found for this employee."
            });
        }

        return Ok(new EmployeePreferenceResponse
        {
            Id = preference.Id,
            EmployeeId = employee.Id,
            EmployeeName = $"{employee.FirstName} {employee.LastName}",
            MaxWeeklyHours = preference.MaxWeeklyHours
        });
    }

    [HttpPost]
    public async Task<ActionResult<EmployeePreferenceResponse>> CreatePreference(
        CreateEmployeePreferenceRequest request)
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

        if (request.MaxWeeklyHours.HasValue &&
            request.MaxWeeklyHours.Value <= 0)
        {
            return BadRequest(new
            {
                message = "MaxWeeklyHours must be greater than zero."
            });
        }

        var existingPreference = await _context.EmployeePreferences
            .AnyAsync(ep => ep.EmployeeId == request.EmployeeId);

        if (existingPreference)
        {
            return Conflict(new
            {
                message = "The employee already has a preference record."
            });
        }

        var preference = new EmployeePreference
        {
            EmployeeId = request.EmployeeId,
            MaxWeeklyHours = request.MaxWeeklyHours
        };

        _context.EmployeePreferences.Add(preference);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetEmployeePreferences),
            new { employeeId = preference.EmployeeId },
            new EmployeePreferenceResponse
            {
                Id = preference.Id,
                EmployeeId = employee.Id,
                EmployeeName = $"{employee.FirstName} {employee.LastName}",
                MaxWeeklyHours = preference.MaxWeeklyHours
            });
    }
}