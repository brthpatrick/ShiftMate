using Microsoft.AspNetCore.Mvc;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulingCandidatesController : ControllerBase
{
    private readonly ISchedulingCandidateService _candidateService;

    public SchedulingCandidatesController(
        ISchedulingCandidateService candidateService)
    {
        _candidateService = candidateService;
    }

    [HttpGet("shift/{shiftId:int}")]
    public async Task<ActionResult<List<SchedulingCandidateResult>>> GetCandidates(
        int shiftId)
    {
        var candidates = await _candidateService
            .GetCandidatesAsync(shiftId);

        return Ok(candidates);
    }
}