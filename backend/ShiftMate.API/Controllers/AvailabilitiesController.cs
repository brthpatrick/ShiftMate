using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Availabilities;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvailabilitiesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public AvailabilitiesController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AvailabilityResponse>>> GetAvailabilities()
    {
        var availabilities = await _context.Availabilities
            .Select(a => new AvailabilityResponse
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                IsAvailable = a.IsAvailable
            })
            .ToListAsync();

        return Ok(availabilities);
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<AvailabilityResponse>>> GetEmployeeAvailabilities(
        int employeeId)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
        {
            return NotFound("The specified employee does not exist.");
        }

        var availabilities = await _context.Availabilities
            .Where(a => a.EmployeeId == employeeId)
            .Select(a => new AvailabilityResponse
            {
                Id = a.Id,
                EmployeeId = a.EmployeeId,
                EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                IsAvailable = a.IsAvailable
            })
            .ToListAsync();

        return Ok(availabilities);
    }

    [HttpPost]
    public async Task<ActionResult<AvailabilityResponse>> CreateAvailability(
        CreateAvailabilityRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest("End time must be later than start time.");
        }

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest("The specified employee does not exist.");
        }

        var overlappingAvailability = await _context.Availabilities
            .AnyAsync(a =>
                a.EmployeeId == request.EmployeeId &&
                a.DayOfWeek == request.DayOfWeek &&
                a.StartTime < request.EndTime &&
                a.EndTime > request.StartTime);

        if (overlappingAvailability)
        {
            return Conflict("The availability period overlaps with an existing availability.");
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
                EmployeeName = a.Employee.FirstName + " " + a.Employee.LastName,
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

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAvailability(int id)
    {
        var availability = await _context.Availabilities
            .FirstOrDefaultAsync(a => a.Id == id);

        if (availability is null)
        {
            return NotFound();
        }

        _context.Availabilities.Remove(availability);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}