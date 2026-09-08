namespace ShiftMate.API.Services.Scheduling;

public interface IShiftEligibilityService
{
    Task<ShiftEligibilityResult> CheckEligibilityAsync(
        int employeeId, 
        int shiftId);
}