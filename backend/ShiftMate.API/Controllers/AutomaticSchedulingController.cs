using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Services.Authentication;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AutomaticSchedulingController : ControllerBase
{
    private readonly IAutomaticSchedulingService _schedulingService;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ShiftMateDbContext _context;
    public AutomaticSchedulingController(
        IAutomaticSchedulingService schedulingService,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService,
        ShiftMateDbContext context)
    {
        _schedulingService = schedulingService;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
        _context = context;
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("shift/{shiftId:int}")]
    public async Task<ActionResult<AutomaticSchedulingResult>> ScheduleShift(
     int shiftId)
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var shiftExists = await _context.Shifts
            .AnyAsync(s => s.Id == shiftId);

        if (!shiftExists)
        {
            return NotFound("The shift does not exist.");
        }

        var shiftAllowed =
            await _accessControlService.IsShiftAllowedAsync(shiftId);

        if (!shiftAllowed)
        {
            return Forbid();
        }

        var result = await _schedulingService
            .ScheduleShiftAsync(shiftId);

        if (result.Status == "ShiftNotFound")
        {
            return NotFound("The shift does not exist.");
        }

        if (result.Status == "NoRequirements")
        {
            return BadRequest("The shift has no role requirements.");
        }

        return Ok(result);
    }
}