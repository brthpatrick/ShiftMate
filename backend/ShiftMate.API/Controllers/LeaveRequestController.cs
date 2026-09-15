using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.LeaveRequests;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LeaveRequestsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public LeaveRequestsController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaveRequestResponse>>>
        GetLeaveRequests()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var leaveRequests = await _context.LeaveRequests
            .Where(lr => lr.Employee.CompanyId == companyId.Value)
            .Select(lr => new LeaveRequestResponse
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FirstName + " " +
                               lr.Employee.LastName,
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
    public async Task<ActionResult<LeaveRequestResponse>>
        GetLeaveRequest(int id)
    {
        var leaveRequest = await _context.LeaveRequests
            .Where(lr => lr.Id == id)
            .Select(lr => new
            {
                LeaveRequest = new LeaveRequestResponse
                {
                    Id = lr.Id,
                    EmployeeId = lr.EmployeeId,
                    EmployeeName = lr.Employee.FirstName + " " +
                                   lr.Employee.LastName,
                    StartDate = lr.StartDate,
                    EndDate = lr.EndDate,
                    Reason = lr.Reason,
                    Status = lr.Status,
                    CreatedAt = lr.CreatedAt
                },
                CompanyId = lr.Employee.CompanyId
            })
            .FirstOrDefaultAsync();

        if (leaveRequest is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                leaveRequest.CompanyId))
        {
            return Forbid();
        }

        return Ok(leaveRequest.LeaveRequest);
    }

    [HttpGet("employee/{employeeId:int}")]
    public async Task<ActionResult<IEnumerable<LeaveRequestResponse>>>
        GetEmployeeLeaveRequests(int employeeId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return NotFound(
                "The specified employee does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(
                employee.CompanyId))
        {
            return Forbid();
        }

        var leaveRequests = await _context.LeaveRequests
            .Where(lr => lr.EmployeeId == employeeId)
            .Select(lr => new LeaveRequestResponse
            {
                Id = lr.Id,
                EmployeeId = lr.EmployeeId,
                EmployeeName = lr.Employee.FirstName + " " +
                               lr.Employee.LastName,
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
    public async Task<ActionResult<LeaveRequestResponse>>
        CreateLeaveRequest(CreateLeaveRequest request)
    {
        if (request.EndDate < request.StartDate)
        {
            return BadRequest(
                "End date must be greater than or equal to start date.");
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

        if (employee is null)
        {
            return BadRequest(
                "The specified employee does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(
                employee.CompanyId))
        {
            return Forbid();
        }

        var overlappingLeave = await _context.LeaveRequests
            .AnyAsync(lr =>
                lr.EmployeeId == request.EmployeeId &&
                lr.Status != "Rejected" &&
                lr.StartDate <= request.EndDate &&
                lr.EndDate >= request.StartDate);

        if (overlappingLeave)
        {
            return Conflict(
                "The leave request overlaps with an existing leave request.");
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
                EmployeeName = lr.Employee.FirstName + " " +
                               lr.Employee.LastName,
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

    [Authorize(Roles = "Admin,Manager")]
    [HttpPatch("{id:int}/approve")]
    public async Task<IActionResult> ApproveLeaveRequest(int id)
    {
        var leaveRequest = await _context.LeaveRequests
            .Include(lr => lr.Employee)
            .FirstOrDefaultAsync(lr => lr.Id == id);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                leaveRequest.Employee.CompanyId))
        {
            return Forbid();
        }

        if (leaveRequest.Status != "Pending")
        {
            return BadRequest(
                "Only pending leave requests can be approved.");
        }

        leaveRequest.Status = "Approved";

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPatch("{id:int}/reject")]
    public async Task<IActionResult> RejectLeaveRequest(int id)
    {
        var leaveRequest = await _context.LeaveRequests
            .Include(lr => lr.Employee)
            .FirstOrDefaultAsync(lr => lr.Id == id);

        if (leaveRequest is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                leaveRequest.Employee.CompanyId))
        {
            return Forbid();
        }

        if (leaveRequest.Status != "Pending")
        {
            return BadRequest(
                "Only pending leave requests can be rejected.");
        }

        leaveRequest.Status = "Rejected";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}