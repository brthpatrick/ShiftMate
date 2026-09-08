using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;

namespace ShiftMate.API.Services.Scheduling;

public class SchedulingCandidateService : ISchedulingCandidateService
{
    private readonly ShiftMateDbContext _context;
    private readonly IShiftEligibilityService _eligibilityService;

    private readonly ICandidateScoringService _scoringService;

    public SchedulingCandidateService(
        ShiftMateDbContext context,
        IShiftEligibilityService eligibilityService,
        ICandidateScoringService scoringService)
    {
        _context = context;
        _eligibilityService = eligibilityService;
        _scoringService = scoringService;
    }

    public async Task<List<SchedulingCandidateResult>> GetCandidatesAsync(
        int shiftId)
    {
        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift is null)
        {
            return new List<SchedulingCandidateResult>();
        }

        var employees = await _context.Employees
            .Where(e =>
                e.CompanyId == shift.Location.CompanyId &&
                e.IsActive)
            .ToListAsync();

        var candidates = new List<SchedulingCandidateResult>();

        foreach (var employee in employees)
        {
            var eligibility = await _eligibilityService
                .CheckEligibilityAsync(employee.Id, shiftId);

            if (!eligibility.IsEligible)
            {
                continue;
            }

            var roles = await _context.EmployeeRoles
                .Where(er => er.EmployeeId == employee.Id)
                .Select(er => er.Role.Name)
                .ToListAsync();

            candidates.Add(new SchedulingCandidateResult
            {
                EmployeeId = employee.Id,
                EmployeeName = $"{employee.FirstName} {employee.LastName}",
                Score = await _scoringService.CalculateScoreAsync(
                    employee.Id,
                    shiftId),
                Roles = roles,
                Notes = "Employee is eligible for this shift."
            });
        }

        return candidates
            .OrderByDescending(c => c.Score)
            .ThenBy(c => c.EmployeeName)
            .ToList();
    }
}