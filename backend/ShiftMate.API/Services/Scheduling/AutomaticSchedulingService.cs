using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Models;

namespace ShiftMate.API.Services.Scheduling;

public class AutomaticSchedulingService : IAutomaticSchedulingService
{
    private readonly ShiftMateDbContext _context;
    private readonly ISchedulingCandidateService _candidateService;
    private readonly ICandidateScoringService _scoringService;

    public AutomaticSchedulingService(
        ShiftMateDbContext context,
        ISchedulingCandidateService candidateService,
        ICandidateScoringService scoringService)
    {
        _context = context;
        _candidateService = candidateService;
        _scoringService = scoringService;
    }

    public async Task<AutomaticSchedulingResult> ScheduleShiftAsync(int shiftId)
    {
        var result = new AutomaticSchedulingResult
        {
            ShiftId = shiftId
        };

        var shift = await _context.Shifts
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift is null)
        {
            result.Status = "ShiftNotFound";
            return result;
        }

        var requirements = await _context.ShiftRoleRequirements
            .Where(srr => srr.ShiftId == shiftId)
            .Select(srr => new
            {
                srr.RoleId,
                srr.RequiredEmployees,
                RoleName = srr.Role.Name
            })
            .ToListAsync();

        if (requirements.Count == 0)
        {
            result.Status = "NoRequirements";
            return result;
        }

        foreach (var requirement in requirements)
        {
            var alreadyAssignedCount = await _context.ShiftAssignments
                .Where(sa =>
                    sa.ShiftId == shiftId &&
                    sa.Status != "Cancelled")
                .Where(sa =>
                    _context.EmployeeRoles.Any(er =>
                        er.EmployeeId == sa.EmployeeId &&
                        er.RoleId == requirement.RoleId))
                .CountAsync();

            var neededEmployees =
                requirement.RequiredEmployees - alreadyAssignedCount;

            if (neededEmployees <= 0)
            {
                continue;
            }

            var candidates = await _candidateService
                .GetCandidatesAsync(shiftId);

            var matchingCandidates = candidates
                .Where(c =>
                    c.Roles.Contains(requirement.RoleName))
                .Take(neededEmployees)
                .ToList();

            foreach (var candidate in matchingCandidates)
            {
                var assignment = new ShiftAssignment
                {
                    ShiftId = shiftId,
                    EmployeeId = candidate.EmployeeId,
                    AssignedAt = DateTime.UtcNow,
                    Status = "Assigned"
                };

                _context.ShiftAssignments.Add(assignment);

                result.AssignedEmployees.Add(
                    new AutomaticSchedulingAssignmentResult
                    {
                        EmployeeId = candidate.EmployeeId,
                        EmployeeName = candidate.EmployeeName,
                        RoleId = requirement.RoleId,
                        RoleName = requirement.RoleName,
                        Score = candidate.Score
                    });
            }

            await _context.SaveChangesAsync();

            var missing =
                neededEmployees - matchingCandidates.Count;

            if (missing > 0)
            {
                result.MissingRequirements.Add(
                    new AutomaticSchedulingMissingRequirementResult
                    {
                        RoleId = requirement.RoleId,
                        RoleName = requirement.RoleName,
                        MissingEmployees = missing
                    });
            }
        }

        result.Status =
            result.MissingRequirements.Count == 0
                ? "Completed"
                : result.AssignedEmployees.Count > 0
                    ? "PartiallyCompleted"
                    : "Failed";

        return result;
    }
}