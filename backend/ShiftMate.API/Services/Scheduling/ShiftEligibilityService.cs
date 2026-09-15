using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;

namespace ShiftMate.API.Services.Scheduling;

public class ShiftEligibilityService : IShiftEligibilityService
{
    private readonly ShiftMateDbContext _context;

    public ShiftEligibilityService(ShiftMateDbContext context)
    {
        _context = context;
    }

    public async Task<ShiftEligibilityResult> CheckEligibilityAsync(
        int employeeId,
        int shiftId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId);

        if (employee is null)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee does not exist."
            };
        }

        if (!employee.IsActive)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee is not active."
            };
        }

        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift is null)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The shift does not exist."
            };
        }

        if (employee.CompanyId != shift.Location.CompanyId)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee does not belong to the same company of the shift."
            };
        }

        var alreadyAssigned = await _context.ShiftAssignments
            .AnyAsync(sa =>
                sa.EmployeeId == employeeId &&
                sa.ShiftId == shiftId &&
                sa.Status != "Cancelled");

        if (alreadyAssigned)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee is already assigned to this shift."
            };
        }

        var requiredRoles = await _context.ShiftRoleRequirements
            .Where(srr => srr.ShiftId == shiftId)
            .ToListAsync();

        foreach (var requirement in requiredRoles)
        {
            var employeeHasRole = await _context.EmployeeRoles
                .AnyAsync(er =>
                    er.EmployeeId == employeeId &&
                    er.RoleId == requirement.RoleId);

            if (!employeeHasRole)
            {
                var roleName = await _context.Roles
                    .Where(r => r.Id == requirement.RoleId)
                    .Select(r => r.Name)
                    .FirstAsync();

                return new ShiftEligibilityResult
                {
                    IsEligible = false,
                    Reason = $"The employee does not have the required role: {roleName}."
                };
            }

            var assignedEmployeesWithRole = await _context.ShiftAssignments
                .Where(sa =>
                    sa.ShiftId == shiftId &&
                    sa.Status != "Cancelled")
                .Where(sa =>
                    _context.EmployeeRoles.Any(er =>
                        er.EmployeeId == sa.EmployeeId &&
                        er.RoleId == requirement.RoleId))
                .CountAsync();

            if (assignedEmployeesWithRole >= requirement.RequiredEmployees)
            {
                var roleName = await _context.Roles
                    .Where(r => r.Id == requirement.RoleId)
                    .Select(r => r.Name)
                    .FirstAsync();

                return new ShiftEligibilityResult
                {
                    IsEligible = false,
                    Reason = $"The required number of employees with role '{roleName}' has already been reached."
                };
            }
        }

        var hasShiftConflict = await _context.ShiftAssignments
            .AnyAsync(sa =>
                sa.EmployeeId == employeeId &&
                sa.Status != "Cancelled" &&
                sa.Shift.StartTime < shift.EndTime &&
                shift.StartTime < sa.Shift.EndTime);

        if (hasShiftConflict)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee already has another shift during this time."
            };
        }

        // Maximum weekly working hours
        var preference = await _context.EmployeePreferences
            .FirstOrDefaultAsync(ep => ep.EmployeeId == employeeId);

        if (preference?.MaxWeeklyHours.HasValue == true)
        {
            var weekStart = shift.StartTime.Date
                .AddDays(-(int)shift.StartTime.DayOfWeek);

            var weekEnd = weekStart.AddDays(7);

            var weeklyAssignments = await _context.ShiftAssignments
                .Where(sa =>
                    sa.EmployeeId == employeeId &&
                    sa.Status != "Cancelled" &&
                    sa.Shift.StartTime >= weekStart &&
                    sa.Shift.StartTime < weekEnd)
                .Select(sa => new
                {
                    sa.Shift.StartTime,
                    sa.Shift.EndTime
                })
                .ToListAsync();

            var currentWeeklyHours = weeklyAssignments.Sum(a =>
                (a.EndTime - a.StartTime).TotalHours);

            var newShiftHours =
                (shift.EndTime - shift.StartTime).TotalHours;

            if (currentWeeklyHours + newShiftHours >
                preference.MaxWeeklyHours.Value)
            {
                return new ShiftEligibilityResult
                {
                    IsEligible = false,
                    Reason = "The employee would exceed their maximum weekly working hours."
                };
            }
        }

        var dayPreference = await _context.EmployeeDayPreferences
            .FirstOrDefaultAsync(edp =>
                edp.EmployeeId == employeeId &&
                edp.DayOfWeek == shift.StartTime.DayOfWeek);

        if (dayPreference?.IsUnavailable == true)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee is unavailable on this day."
            };
        }

        var dayOfWeek = shift.StartTime.DayOfWeek;
        var shiftStartTime = shift.StartTime.TimeOfDay;
        var shiftEndTime = shift.EndTime.TimeOfDay;

        var hasAvailability = await _context.Availabilities
            .AnyAsync(a =>
                a.EmployeeId == employeeId &&
                a.DayOfWeek == dayOfWeek &&
                a.IsAvailable &&
                a.StartTime <= shiftStartTime &&
                a.EndTime >= shiftEndTime);

        if (!hasAvailability)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee is not available during the entire shift."
            };
        }

        var hasApprovedLeave = await _context.LeaveRequests
            .AnyAsync(lr =>
                lr.EmployeeId == employeeId &&
                lr.Status == "Approved" &&
                lr.StartDate.Date <= shift.StartTime.Date &&
                lr.EndDate.Date >= shift.StartTime.Date);

        if (hasApprovedLeave)
        {
            return new ShiftEligibilityResult
            {
                IsEligible = false,
                Reason = "The employee is on approved leave during this shift."
            };
        }

        return new ShiftEligibilityResult
        {
            IsEligible = true
        };
    }
}