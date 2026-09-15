using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.ShiftAssignments;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShiftAssignmentsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IShiftEligibilityService _eligibilityService;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public ShiftAssignmentsController(
        ShiftMateDbContext context,
        IShiftEligibilityService eligibilityService,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _eligibilityService = eligibilityService;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftAssignmentResponse>>> GetAssignments()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var assignments = await _context.ShiftAssignments
            .Where(sa => sa.Employee.CompanyId == companyId.Value)
            .Select(sa => new ShiftAssignmentResponse
            {
                Id = sa.Id,
                ShiftId = sa.ShiftId,
                EmployeeId = sa.EmployeeId,
                EmployeeName = sa.Employee.FirstName + " " +
                              sa.Employee.LastName,
                LocationName = sa.Shift.Location.Name,
                ShiftStartTime = sa.Shift.StartTime,
                ShiftEndTime = sa.Shift.EndTime,
                AssignedAt = sa.AssignedAt,
                Status = sa.Status
            })
            .ToListAsync();

        return Ok(assignments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ShiftAssignmentResponse>> GetAssignment(
        int id)
    {
        var assignment = await _context.ShiftAssignments
            .Where(sa => sa.Id == id)
            .Select(sa => new
            {
                Assignment = new ShiftAssignmentResponse
                {
                    Id = sa.Id,
                    ShiftId = sa.ShiftId,
                    EmployeeId = sa.EmployeeId,
                    EmployeeName = sa.Employee.FirstName + " " +
                                  sa.Employee.LastName,
                    LocationName = sa.Shift.Location.Name,
                    ShiftStartTime = sa.Shift.StartTime,
                    ShiftEndTime = sa.Shift.EndTime,
                    AssignedAt = sa.AssignedAt,
                    Status = sa.Status
                },
                CompanyId = sa.Employee.CompanyId
            })
            .FirstOrDefaultAsync();

        if (assignment is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                assignment.CompanyId))
        {
            return Forbid();
        }

        return Ok(assignment.Assignment);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<ShiftAssignmentResponse>> AssignEmployee(
        AssignEmployeeToShiftRequest request)
    {
        var employeeAllowed =
            await _accessControlService.IsEmployeeAllowedAsync(
                request.EmployeeId);

        if (!employeeAllowed)
        {
            return Forbid();
        }

        var shiftAllowed =
            await _accessControlService.IsShiftAllowedAsync(
                request.ShiftId);

        if (!shiftAllowed)
        {
            var shiftExists = await _context.Shifts
                .AnyAsync(s => s.Id == request.ShiftId);

            if (!shiftExists)
            {
                return BadRequest(
                    "The specified shift does not exist.");
            }

            return Forbid();
        }

        var eligibility =
            await _eligibilityService.CheckEligibilityAsync(
                request.EmployeeId,
                request.ShiftId);

        if (!eligibility.IsEligible)
        {
            return Conflict(eligibility.Reason);
        }

        var assignment = new ShiftAssignment
        {
            ShiftId = request.ShiftId,
            EmployeeId = request.EmployeeId,
            AssignedAt = DateTime.UtcNow,
            Status = "Assigned"
        };

        _context.ShiftAssignments.Add(assignment);

        await _context.SaveChangesAsync();

        var response = await _context.ShiftAssignments
            .Where(sa => sa.Id == assignment.Id)
            .Select(sa => new ShiftAssignmentResponse
            {
                Id = sa.Id,
                ShiftId = sa.ShiftId,
                EmployeeId = sa.EmployeeId,
                EmployeeName = sa.Employee.FirstName + " " +
                              sa.Employee.LastName,
                LocationName = sa.Shift.Location.Name,
                ShiftStartTime = sa.Shift.StartTime,
                ShiftEndTime = sa.Shift.EndTime,
                AssignedAt = sa.AssignedAt,
                Status = sa.Status
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetAssignment),
            new { id = assignment.Id },
            response);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> CancelAssignment(int id)
    {
        var assignment = await _context.ShiftAssignments
            .Where(sa => sa.Id == id)
            .Select(sa => new
            {
                Entity = sa,
                CompanyId = sa.Employee.CompanyId
            })
            .FirstOrDefaultAsync();

        if (assignment is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                assignment.CompanyId))
        {
            return Forbid();
        }

        assignment.Entity.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}