using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;

namespace ShiftMate.API.Services.Scheduling;

public class CandidateScoringService : ICandidateScoringService
{
    private readonly ShiftMateDbContext _context;
    private readonly IEmployeeWorkloadService _workloadService;

    public CandidateScoringService(
        ShiftMateDbContext context,
        IEmployeeWorkloadService workloadService)
    {
        _context = context;
        _workloadService = workloadService;
    }

    public async Task<int> CalculateScoreAsync(
        int employeeId,
        int shiftId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return 0;
        }

        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift is null)
        {
            return 0;
        }

        var score = 0;

        // 1. Role match
        var requiredRoleIds = await _context.ShiftRoleRequirements
            .Where(srr => srr.ShiftId == shiftId)
            .Select(srr => srr.RoleId)
            .ToListAsync();

        if (requiredRoleIds.Count > 0)
        {
            var hasRequiredRole = await _context.EmployeeRoles
                .AnyAsync(er =>
                    er.EmployeeId == employeeId &&
                    requiredRoleIds.Contains(er.RoleId));

            if (hasRequiredRole)
            {
                score += 40;
            }
        }
        else
        {
            score += 40;
        }

        // 2. Availability
        var hasAvailability = await _context.Availabilities
            .AnyAsync(a =>
                a.EmployeeId == employeeId &&
                a.DayOfWeek == shift.StartTime.DayOfWeek &&
                a.IsAvailable &&
                a.StartTime <= shift.StartTime.TimeOfDay &&
                a.EndTime >= shift.EndTime.TimeOfDay);

        if (hasAvailability)
        {
            score += 25;
        }

        // 3. Employee workload
        var workload = await _workloadService
            .GetWorkloadAsync(employeeId);

        if (workload.AssignedShiftCount == 0)
        {
            score += 15;
        }
        else if (workload.AssignedShiftCount <= 2)
        {
            score += 10;
        }
        else if (workload.AssignedShiftCount <= 4)
        {
            score += 5;
        }

        // 4. Total scheduled hours
        if (workload.ScheduledHours < 8)
        {
            score += 20;
        }
        else if (workload.ScheduledHours < 16)
        {
            score += 15;
        }
        else if (workload.ScheduledHours < 24)
        {
            score += 10;
        }
        else
        {
            score += 5;
        }

        return Math.Min(score, 100);
    }
}