using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Scheduling;

public class ShiftStatusService : IShiftStatusService
{
    private readonly ShiftMateDbContext _context;

    public ShiftStatusService(ShiftMateDbContext context)
    {
        _context = context;
    }

    public async Task<(bool Success, string? Error)> ChangeStatusAsync(
        int shiftId,
        ShiftStatus newStatus)
    {
        var shift = await _context.Shifts
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift is null)
        {
            return (false, "The shift does not exist.");
        }

        if (shift.Status == newStatus)
        {
            return (false, "The shift already has this status.");
        }

        var isValidTransition = shift.Status switch
        {
            ShiftStatus.Draft =>
                newStatus == ShiftStatus.Open ||
                newStatus == ShiftStatus.Cancelled,

            ShiftStatus.Open =>
                newStatus == ShiftStatus.Scheduled ||
                newStatus == ShiftStatus.Cancelled,

            ShiftStatus.Scheduled =>
                newStatus == ShiftStatus.InProgress ||
                newStatus == ShiftStatus.Cancelled,

            ShiftStatus.InProgress =>
                newStatus == ShiftStatus.Completed,

            ShiftStatus.Completed => false,

            ShiftStatus.Cancelled => false,

            _ => false
        };

        if (!isValidTransition)
        {
            return (
                false,
                $"Invalid status transition from '{shift.Status}' to '{newStatus}'."
            );
        }

        shift.Status = newStatus;

        await _context.SaveChangesAsync();

        return (true, null);
    }
}