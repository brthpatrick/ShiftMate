namespace ShiftMate.API.Services.Scheduling;

public interface IAutomaticSchedulingService
{
    Task<AutomaticSchedulingResult> ScheduleShiftAsync(int shiftId);
}