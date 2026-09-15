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
public class EmployeeWorkloadController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IEmployeeWorkloadService _workloadService;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public EmployeeWorkloadController(
        ShiftMateDbContext context,
        IEmployeeWorkloadService workloadService,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _workloadService = workloadService;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet("{employeeId:int}")]
    public async Task<IActionResult> GetWorkload(int employeeId)
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "The employee does not exist."
            });
        }

        if (!_accessControlService.IsCompanyAllowed(employee.CompanyId))
        {
            return Forbid();
        }

        var workload = await _workloadService
            .GetWorkloadAsync(employeeId);

        return Ok(new
        {
            employeeId = employee.Id,
            employeeName = $"{employee.FirstName} {employee.LastName}",
            assignedShiftCount = workload.AssignedShiftCount,
            scheduledHours = workload.ScheduledHours
        });
    }
}