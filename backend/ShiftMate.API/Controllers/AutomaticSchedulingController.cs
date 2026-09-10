using Microsoft.AspNetCore.Mvc;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AutomaticSchedulingController : ControllerBase
{
    private readonly IAutomaticSchedulingService _schedulingService;

    public AutomaticSchedulingController(
        IAutomaticSchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }

    [HttpPost("shift/{shiftId:int}")]
    public async Task<ActionResult<AutomaticSchedulingResult>> ScheduleShift(
        int shiftId)
    {
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