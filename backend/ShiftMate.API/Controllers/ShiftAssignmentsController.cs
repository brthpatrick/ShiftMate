using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.ShiftAssignments;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftAssignmentsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public ShiftAssignmentsController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftAssignmentResponse>>> GetAssignments()
    {
        var assignments = await _context.ShiftAssignments
            .Select(sa => new ShiftAssignmentResponse
            {
                Id = sa.Id,
                ShiftId = sa.ShiftId,
                EmployeeId = sa.EmployeeId,
                EmployeeName = sa.Employee.FirstName + " " + sa.Employee.LastName,
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
    public async Task<ActionResult<ShiftAssignmentResponse>> GetAssignment(int id)
    {
        var assignment = await _context.ShiftAssignments
            .Where(sa => sa.Id == id)
            .Select(sa => new ShiftAssignmentResponse
            {
                Id = sa.Id,
                ShiftId = sa.ShiftId,
                EmployeeId = sa.EmployeeId,
                EmployeeName = sa.Employee.FirstName + " " + sa.Employee.LastName,
                LocationName = sa.Shift.Location.Name,
                ShiftStartTime = sa.Shift.StartTime,
                ShiftEndTime = sa.Shift.EndTime,
                AssignedAt = sa.AssignedAt,
                Status = sa.Status
            })
            .FirstOrDefaultAsync();

        if (assignment is null)
        {
            return NotFound();
        }

        return Ok(assignment);
    }

    [HttpPost]
    public async Task<ActionResult<ShiftAssignmentResponse>> AssignEmployee(
        AssignEmployeeToShiftRequest request)
    {
        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == request.ShiftId);

        if (shift is null)
        {
            return BadRequest("The specified shift does not exist.");
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee is null)
        {
            return BadRequest("The specified employee does not exist.");
        }

        if (!employee.IsActive)
        {
            return BadRequest("The employee is not active.");
        }

        var employeeCompanyMatchesLocation = await _context.Locations
            .AnyAsync(l =>
                l.Id == shift.LocationId &&
                l.CompanyId == employee.CompanyId);

        if (!employeeCompanyMatchesLocation)
        {
            return BadRequest("The employee does not belong to the company of the shift location.");
        }

        var alreadyAssigned = await _context.ShiftAssignments
            .AnyAsync(sa =>
                sa.ShiftId == request.ShiftId &&
                sa.EmployeeId == request.EmployeeId);

        if (alreadyAssigned)
        {
            return Conflict("The employee is already assigned to this shift.");
        }

        var hasConflict = await _context.ShiftAssignments
            .AnyAsync(sa =>
                sa.EmployeeId == request.EmployeeId &&
                sa.Status != "Cancelled" &&
                sa.Shift.StartTime < shift.EndTime &&
                sa.Shift.EndTime > shift.StartTime);

        if (hasConflict)
        {
            return Conflict("The employee already has another shift during this time.");
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
                EmployeeName = sa.Employee.FirstName + " " + sa.Employee.LastName,
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

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> CancelAssignment(int id)
    {
        var assignment = await _context.ShiftAssignments
            .FirstOrDefaultAsync(sa => sa.Id == id);

        if (assignment is null)
        {
            return NotFound();
        }

        assignment.Status = "Cancelled";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}