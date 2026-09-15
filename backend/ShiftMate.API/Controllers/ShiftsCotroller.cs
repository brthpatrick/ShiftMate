using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Shifts;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShiftsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IShiftStatusService _statusService;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public ShiftsController(
        ShiftMateDbContext context,
        IShiftStatusService statusService,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _statusService = statusService;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftResponse>>> GetShifts()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var shifts = await _context.Shifts
            .Where(s => s.Location.CompanyId == companyId.Value)
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

        if (!await _accessControlService.IsShiftAllowedAsync(id))
        {
            return Forbid();
        }

        return Ok(shift);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<ShiftResponse>> CreateShift(
        CreateShiftRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest(
                "End time must be later than start time.");
        }

        var location = await _context.Locations
            .FirstOrDefaultAsync(l => l.Id == request.LocationId);

        if (location is null)
        {
            return BadRequest(
                "The specified location does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(
                location.CompanyId))
        {
            return Forbid();
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

    [Authorize(Roles = "Admin,Manager")]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateShiftStatusRequest request)
    {
        if (!await _accessControlService.IsShiftAllowedAsync(id))
        {
            var shiftExists = await _context.Shifts
                .AnyAsync(s => s.Id == id);

            if (!shiftExists)
            {
                return NotFound(new
                {
                    message = "The shift does not exist."
                });
            }

            return Forbid();
        }

        var result = await _statusService.ChangeStatusAsync(
            id,
            request.Status);

        if (!result.Success)
        {
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