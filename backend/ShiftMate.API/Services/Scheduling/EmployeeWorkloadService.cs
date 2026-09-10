using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;

namespace ShiftMate.API.Services.Scheduling;

public class EmployeeWorkloadService : IEmployeeWorkloadService
{
    private readonly ShiftMateDbContext _context;

    public EmployeeWorkloadService(ShiftMateDbContext context)
    {
        _context = context;
    }

    public async Task<EmployeeWorkloadResult> GetWorkloadAsync(
        int employeeId)
    {
        var assignments = await _context.ShiftAssignments
            .Where(sa =>
                sa.EmployeeId == employeeId &&
                sa.Status != "Cancelled")
            .Select(sa => new
            {
                sa.Shift.StartTime,
                sa.Shift.EndTime
            })
            .ToListAsync();

        var scheduledHours = assignments.Sum(a =>
            (a.EndTime - a.StartTime).TotalHours);

        return new EmployeeWorkloadResult
        {
            EmployeeId = employeeId,
            AssignedShiftCount = assignments.Count,
            ScheduledHours = scheduledHours
        };
    }
}