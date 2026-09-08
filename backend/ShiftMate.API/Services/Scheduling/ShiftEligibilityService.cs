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
            lr.EndDate.Date >= shift.EndTime.Date);

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