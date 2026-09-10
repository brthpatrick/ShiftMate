using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeWorkloadController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IEmployeeWorkloadService _workloadService;

    public EmployeeWorkloadController(
        ShiftMateDbContext context,
        IEmployeeWorkloadService workloadService)
    {
        _context = context;
        _workloadService = workloadService;
    }

    [HttpGet("{employeeId}")]
    public async Task<IActionResult> GetWorkload(int employeeId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return NotFound(new
            {
                message = "The employee does not exist."
            });
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