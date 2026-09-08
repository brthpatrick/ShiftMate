using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;

namespace ShiftMate.API.Services.Scheduling;

public class CandidateScoringService : ICandidateScoringService
{
    private readonly ShiftMateDbContext _context;

    public CandidateScoringService(ShiftMateDbContext context)
    {
        _context = context;
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

        // 3. Number of assigned shifts
        var assignedShiftCount = await _context.ShiftAssignments
            .CountAsync(sa =>
                sa.EmployeeId == employeeId &&
                sa.Status != "Cancelled");

        if (assignedShiftCount == 0)
        {
            score += 15;
        }
        else if (assignedShiftCount <= 2)
        {
            score += 10;
        }
        else if (assignedShiftCount <= 4)
        {
            score += 5;
        }

        // 4. Total scheduled hours
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

        var totalScheduledHours = assignments.Sum(a =>
            (a.EndTime - a.StartTime).TotalHours);

        if (totalScheduledHours < 8)
        {
            score += 20;
        }
        else if (totalScheduledHours < 16)
        {
            score += 15;
        }
        else if (totalScheduledHours < 24)
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