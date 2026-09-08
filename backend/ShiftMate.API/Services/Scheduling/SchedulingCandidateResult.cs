namespace ShiftMate.API.Services.Scheduling;

public class SchedulingCandidateResult
{
    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; } = null!;

    public int Score { get; set; }

    public List<string> Roles { get; set; } = new();

    public string? Notes { get; set; }
}