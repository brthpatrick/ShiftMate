using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.LeaveRequests;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaveRequestsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public LeaveRequestsController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaveRequestResponse>>> GetLeaveRequests()
    {
        var leaveRequests = await _context.LeaveRequests
            .Select(lr => new LeaveRequestResponse
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                StartDate = lr.StartDate,
                EndDate = lr.EndDate,
                Reason = lr.Reason,
                Status = lr.Status,
                CreatedAt = lr.CreatedAt
            })
            .ToListAsync();

        return Ok(leaveRequests);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LeaveRequestResponse>> GetLeaveRequest(int id)
    {
        var leaveRequest = await _context.LeaveRequests
            .Where(lr => lr.Id == id)
            .Select(lr => new LeaveRequestResponse
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                StartDate = lr.StartDate,
                EndDate = lr.EndDate,
                Reason = lr.Reason,
                Status = lr.Status,
                CreatedAt = lr.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (leaveRequest is null)
        {
            return NotFound();
        }

        return Ok(leaveRequest);
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<LeaveRequestResponse>>> GetEmployeeLeaveRequests(
        int employeeId)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == employeeId);

        if (!employeeExists)
        {
            return NotFound("The specified employee does not exist.");
        }

        var leaveRequests = await _context.LeaveRequests
            .Where(lr => lr.EmployeeId == employeeId)
            .Select(lr => new LeaveRequestResponse
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                StartDate = lr.StartDate,
                EndDate = lr.EndDate,
                Reason = lr.Reason,
                Status = lr.Status,
                CreatedAt = lr.CreatedAt
            })
            .ToListAsync();

        return Ok(leaveRequests);
    }

    [HttpPost]
    public async Task<ActionResult<LeaveRequestResponse>> CreateLeaveRequest(
        CreateLeaveRequest request)
    {
        if (request.EndDate < request.StartDate)
        {
            return BadRequest("End date must be greater than or equal to start date.");
        }

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest("The specified employee does not exist.");
        }

        var overlappingLeave = await _context.LeaveRequests
            .AnyAsync(lr =>
                lr.EmployeeId == request.EmployeeId &&
                lr.Status != "Rejected" &&
                lr.StartDate <= request.EndDate &&
                lr.EndDate >= request.StartDate);

        if (overlappingLeave)
        {
            return Conflict("The leave request overlaps with an existing leave request.");
        }

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = request.EmployeeId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveRequests.Add(leaveRequest);

        await _context.SaveChangesAsync();

        var response = await _context.LeaveRequests
            .Where(lr => lr.Id == leaveRequest.Id)
            .Select(lr => new LeaveRequestResponse
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FirstName + " " + lr.Employee.LastName,
                StartDate = lr.StartDate,
                EndDate = lr.EndDate,
                Reason = lr.Reason,
                Status = lr.Status,
                CreatedAt = lr.CreatedAt
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetLeaveRequest),
            new { id = leaveRequest.Id },
            response);
    }

    [HttpPatch("{id:int}/approve")]
    public async Task<IActionResult> ApproveLeaveRequest(int id)
    {
        var leaveRequest = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == id);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        if (leaveRequest.Status != "Pending")
        {
            return BadRequest("Only pending leave requests can be approved.");
        }

        leaveRequest.Status = "Approved";

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:int}/reject")]
    public async Task<IActionResult> RejectLeaveRequest(int id)
    {
        var leaveRequest = await _context.LeaveRequests
            .FirstOrDefaultAsync(lr => lr.Id == id);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        if (leaveRequest.Status != "Pending")
        {
            return BadRequest("Only pending leave requests can be rejected.");
        }

        leaveRequest.Status = "Rejected";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}