namespace ShiftMate.API.Services.Scheduling;

public class ShiftEligibilityResult
{
    public bool IsEligible { get; set; }
    public string? Reason { get; set; }
}