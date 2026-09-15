using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShiftMate.API.Services.Authentication;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SchedulingCandidatesController : ControllerBase
{
    private readonly ISchedulingCandidateService _candidateService;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public SchedulingCandidatesController(
        ISchedulingCandidateService candidateService,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _candidateService = candidateService;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet("shift/{shiftId:int}")]
    public async Task<ActionResult<List<SchedulingCandidateResult>>>
        GetCandidates(int shiftId)
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var shiftAllowed =
            await _accessControlService.IsShiftAllowedAsync(shiftId);

        if (!shiftAllowed)
        {
            return NotFound("The shift does not exist.");
        }

        var candidates = await _candidateService
            .GetCandidatesAsync(shiftId);

        return Ok(candidates);
    }
}