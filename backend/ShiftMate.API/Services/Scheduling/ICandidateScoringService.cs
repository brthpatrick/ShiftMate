namespace ShiftMate.API.Services.Scheduling;

public interface ICandidateScoringService
{
    Task<int> CalculateScoreAsync(
        int employeeId,
        int shiftId);
}