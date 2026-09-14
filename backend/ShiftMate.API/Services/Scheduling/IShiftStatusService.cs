using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Scheduling;

public interface IShiftStatusService
{
    Task<(bool Success, string? Error)> ChangeStatusAsync(
        int shiftId,
        ShiftStatus newStatus);
}