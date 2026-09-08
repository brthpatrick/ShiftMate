namespace ShiftMate.API.Services.Scheduling;

public interface ISchedulingCandidateService
{
    Task<List<SchedulingCandidateResult>> GetCandidatesAsync(
        int shiftId);
}