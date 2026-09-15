using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Services.Authentication;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[Authorize(Roles = "Admin,Manager")]
[ApiController]
[Route("api/[controller]")]
public class SchedulingCandidatesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly ISchedulingCandidateService _candidateService;
    private readonly IAccessControlService _accessControlService;

    public SchedulingCandidatesController(
        ShiftMateDbContext context,
        ISchedulingCandidateService candidateService,
        IAccessControlService accessControlService)
    {
        _context = context;
        _candidateService = candidateService;
        _accessControlService = accessControlService;
    }

    [HttpGet("shift/{shiftId:int}")]
    public async Task<ActionResult<List<SchedulingCandidateResult>>> GetCandidates(
        int shiftId)
    {
        var shiftExists = await _context.Shifts
            .AnyAsync(s => s.Id == shiftId);

        if (!shiftExists)
        {
            return NotFound("The shift does not exist.");
        }

        if (!await _accessControlService.IsShiftAllowedAsync(shiftId))
        {
            return Forbid();
        }

        var candidates = await _candidateService
            .GetCandidatesAsync(shiftId);

        return Ok(candidates);
    }
}