using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Shifts;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    private readonly IShiftStatusService _statusService;

    public ShiftsController(ShiftMateDbContext context, IShiftStatusService statusService)
    {
        _context = context;
        _statusService = statusService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftResponse>>> GetShifts()
    {
        var shifts = await _context.Shifts
            .Select(s => new ShiftResponse
            {
                Id = s.Id,
                LocationId = s.LocationId,
                LocationName = s.Location.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                RequiredEmployees = s.RequiredEmployees,
                Notes = s.Notes,
                Status = s.Status
            })
            .ToListAsync();

        return Ok(shifts);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ShiftResponse>> GetShift(int id)
    {
        var shift = await _context.Shifts
            .Where(s => s.Id == id)
            .Select(s => new ShiftResponse
            {
                Id = s.Id,
                LocationId = s.LocationId,
                LocationName = s.Location.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                RequiredEmployees = s.RequiredEmployees,
                Notes = s.Notes,
                Status = s.Status
            })
            .FirstOrDefaultAsync();

        if (shift is null)
        {
            return NotFound();
        }

        return Ok(shift);
    }

    [HttpPost]
    public async Task<ActionResult<ShiftResponse>> CreateShift(
        CreateShiftRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest("End time must be later than start time.");
        }

        var locationExists = await _context.Locations
            .AnyAsync(l => l.Id == request.LocationId);

        if (!locationExists)
        {
            return BadRequest("The specified location does not exist.");
        }

        var shift = new Shift
        {
            LocationId = request.LocationId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            RequiredEmployees = request.RequiredEmployees,
            Notes = request.Notes
        };

        _context.Shifts.Add(shift);

        await _context.SaveChangesAsync();

        var response = await _context.Shifts
            .Where(s => s.Id == shift.Id)
            .Select(s => new ShiftResponse
            {
                Id = s.Id,
                LocationId = s.LocationId,
                LocationName = s.Location.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                RequiredEmployees = s.RequiredEmployees,
                Notes = s.Notes,
                Status = s.Status
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetShift),
            new { id = shift.Id },
            response);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateShiftStatusRequest request)
    {
        var result = await _statusService.ChangeStatusAsync(
            id,
            request.Status);

        if (!result.Success)
        {
            if (result.Error == "The shift does not exist.")
            {
                return NotFound(new
                {
                    message = result.Error
                });
            }

            return BadRequest(new
            {
                message = result.Error
            });
        }

        var shift = await _context.Shifts
            .Where(s => s.Id == id)
            .Select(s => new ShiftResponse
            {
                Id = s.Id,
                LocationId = s.LocationId,
                LocationName = s.Location.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                RequiredEmployees = s.RequiredEmployees,
                Notes = s.Notes,
                Status = s.Status
            })
            .FirstAsync();

        return Ok(shift);
    }
}