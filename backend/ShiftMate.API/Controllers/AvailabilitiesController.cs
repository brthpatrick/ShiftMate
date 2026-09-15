using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Availabilities;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AvailabilitiesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public AvailabilitiesController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AvailabilityResponse>>> GetAvailabilities()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var availabilities = await _context.Availabilities
            .Where(a => a.Employee.CompanyId == companyId.Value)
            .Select(a => new AvailabilityResponse
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " +
                               a.Employee.LastName,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                IsAvailable = a.IsAvailable
            })
            .ToListAsync();

        return Ok(availabilities);
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<AvailabilityResponse>>>
        GetEmployeeAvailabilities(int employeeId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return NotFound("The specified employee does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(employee.CompanyId))
        {
            return Forbid();
        }

        var availabilities = await _context.Availabilities
            .Where(a => a.EmployeeId == employeeId)
            .Select(a => new AvailabilityResponse
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " +
                               a.Employee.LastName,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                IsAvailable = a.IsAvailable
            })
            .ToListAsync();

        return Ok(availabilities);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<AvailabilityResponse>>
       CreateAvailability(CreateAvailabilityRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest(
                "End time must be later than start time.");
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee is null)
        {
            return NotFound(
                "The specified employee does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(employee.CompanyId))
        {
            return Forbid();
        }

        var overlappingAvailability = await _context.Availabilities
            .AnyAsync(a =>
                a.EmployeeId == request.EmployeeId &&
                a.DayOfWeek == request.DayOfWeek &&
                a.StartTime < request.EndTime &&
                a.EndTime > request.StartTime);

        if (overlappingAvailability)
        {
            return Conflict(
                "The availability period overlaps with an existing availability.");
        }

        var availability = new Availability
        {
            EmployeeId = request.EmployeeId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsAvailable = request.IsAvailable
        };

        _context.Availabilities.Add(availability);
        await _context.SaveChangesAsync();

        var response = await _context.Availabilities
            .Where(a => a.Id == availability.Id)
            .Select(a => new AvailabilityResponse
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " +
                               a.Employee.LastName,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                IsAvailable = a.IsAvailable
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetEmployeeAvailabilities),
            new { employeeId = availability.EmployeeId },
            response);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAvailability(int id)
    {
        var availability = await _context.Availabilities
            .Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (availability is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                availability.Employee.CompanyId))
        {
            return Forbid();
        }

        _context.Availabilities.Remove(availability);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}