using Microsoft.EntityFrameworkCore;
using Moq;
using ShiftMate.API.Data;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.Tests.Services.Scheduling;

public class AutomaticSchedulingServiceTests
{
    private ShiftMateDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ShiftMateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ShiftMateDbContext(options);
    }

    [Fact]
    public async Task ScheduleShiftAsync_ShiftDoesNotExist_ReturnsShiftNotFound()
    {
        using var context = CreateContext();

        var candidateService = new Mock<ISchedulingCandidateService>();
        var workloadService = new Mock<IEmployeeWorkloadService>();

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(999);

        Assert.Equal(999, result.ShiftId);
        Assert.Equal("ShiftNotFound", result.Status);
        Assert.Empty(result.AssignedEmployees);
        Assert.Empty(result.MissingRequirements);

        candidateService.Verify(
            x => x.GetCandidatesAsync(It.IsAny<int>()),
            Times.Never);
    }

    [Fact]
    public async Task ScheduleShiftAsync_NoRequirements_ReturnsNoRequirements()
    {
        using var context = CreateContext();

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 2
        };

        context.Shifts.Add(shift);
        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        var workloadService = new Mock<IEmployeeWorkloadService>();

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("NoRequirements", result.Status);
        Assert.Empty(result.AssignedEmployees);
        Assert.Empty(result.MissingRequirements);

        candidateService.Verify(
            x => x.GetCandidatesAsync(It.IsAny<int>()),
            Times.Never);
    }

    [Fact]
    public async Task ScheduleShiftAsync_MatchingCandidate_AssignsEmployee()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        var requirement = new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);
        context.ShiftRoleRequirements.Add(requirement);

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
                new()
                {
                    EmployeeId = 1,
                    EmployeeName = "John Smith",
                    Score = 90,
                    Roles = new List<string> { "Waiter" }
                }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();
        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Single(result.AssignedEmployees);

        var assignment = result.AssignedEmployees[0];

        Assert.Equal(1, assignment.EmployeeId);
        Assert.Equal("John Smith", assignment.EmployeeName);
        Assert.Equal(1, assignment.RoleId);
        Assert.Equal("Waiter", assignment.RoleName);
        Assert.Equal(90, assignment.Score);

        var savedAssignment = await context.ShiftAssignments
            .SingleAsync();

        Assert.Equal(1, savedAssignment.ShiftId);
        Assert.Equal(1, savedAssignment.EmployeeId);
        Assert.Equal("Assigned", savedAssignment.Status);
    }

    [Fact]
    public async Task ScheduleShiftAsync_NotEnoughMatchingCandidates_ReturnsPartiallyCompleted()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 2
        };

        var requirement = new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 2,
            Role = role
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);
        context.ShiftRoleRequirements.Add(requirement);

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
                new()
                {
                    EmployeeId = 1,
                    EmployeeName = "John Smith",
                    Score = 90,
                    Roles = new List<string> { "Waiter" }
                }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();
        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("PartiallyCompleted", result.Status);

        Assert.Single(result.AssignedEmployees);
        Assert.Equal(1, result.AssignedEmployees[0].EmployeeId);

        Assert.Single(result.MissingRequirements);
        Assert.Equal(1, result.MissingRequirements[0].RoleId);
        Assert.Equal("Waiter", result.MissingRequirements[0].RoleName);
        Assert.Equal(1, result.MissingRequirements[0].MissingEmployees);
    }

    [Fact]
    public async Task ScheduleShiftAsync_LowerScheduledHours_CandidateIsSelectedFirst()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        var requirement = new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);
        context.ShiftRoleRequirements.Add(requirement);
        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
            new()
            {
                EmployeeId = 1,
                EmployeeName = "John Smith",
                Score = 80,
                Roles = new List<string> { "Waiter" }
            },
            new()
            {
                EmployeeId = 2,
                EmployeeName = "Jane Doe",
                Score = 70,
                Roles = new List<string> { "Waiter" }
            }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 2,
                ScheduledHours = 12
            });

        workloadService
            .Setup(x => x.GetWorkloadAsync(2))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 2,
                AssignedShiftCount = 5,
                ScheduledHours = 8
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Single(result.AssignedEmployees);
        Assert.Equal(2, result.AssignedEmployees[0].EmployeeId);
    }

    [Fact]
    public async Task ScheduleShiftAsync_SameHours_FewerAssignedShiftsIsSelectedFirst()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);
        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
            new()
            {
                EmployeeId = 1,
                EmployeeName = "John Smith",
                Score = 90,
                Roles = new List<string> { "Waiter" }
            },
            new()
            {
                EmployeeId = 2,
                EmployeeName = "Jane Doe",
                Score = 80,
                Roles = new List<string> { "Waiter" }
            }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 4,
                ScheduledHours = 10
            });

        workloadService
            .Setup(x => x.GetWorkloadAsync(2))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 2,
                AssignedShiftCount = 2,
                ScheduledHours = 10
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Single(result.AssignedEmployees);
        Assert.Equal(2, result.AssignedEmployees[0].EmployeeId);
    }

    [Fact]
    public async Task ScheduleShiftAsync_SameWorkload_HigherScoreIsSelectedFirst()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);
        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
            new()
            {
                EmployeeId = 1,
                EmployeeName = "John Smith",
                Score = 70,
                Roles = new List<string> { "Waiter" }
            },
            new()
            {
                EmployeeId = 2,
                EmployeeName = "Jane Doe",
                Score = 90,
                Roles = new List<string> { "Waiter" }
            }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 2,
                ScheduledHours = 10
            });

        workloadService
            .Setup(x => x.GetWorkloadAsync(2))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 2,
                AssignedShiftCount = 2,
                ScheduledHours = 10
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Single(result.AssignedEmployees);
        Assert.Equal(2, result.AssignedEmployees[0].EmployeeId);
    }

    [Fact]
    public async Task ScheduleShiftAsync_CompleteTie_EmployeeNameIsUsedAsFinalTieBreaker()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);
        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
            new()
            {
                EmployeeId = 1,
                EmployeeName = "Zoltan",
                Score = 80,
                Roles = new List<string> { "Waiter" }
            },
            new()
            {
                EmployeeId = 2,
                EmployeeName = "Adam",
                Score = 80,
                Roles = new List<string> { "Waiter" }
            }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(It.IsAny<int>()))
            .ReturnsAsync((int employeeId) => new EmployeeWorkloadResult
            {
                EmployeeId = employeeId,
                AssignedShiftCount = 2,
                ScheduledHours = 10
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Single(result.AssignedEmployees);
        Assert.Equal(2, result.AssignedEmployees[0].EmployeeId);
        Assert.Equal("Adam", result.AssignedEmployees[0].EmployeeName);
    }

    [Fact]
    public async Task ScheduleShiftAsync_RequirementAlreadySatisfied_DoesNotAssignMoreEmployees()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);

        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        });

        context.EmployeeRoles.Add(new EmployeeRole
        {
            EmployeeId = 1,
            RoleId = 1
        });

        context.ShiftAssignments.Add(new ShiftAssignment
        {
            Id = 1,
            ShiftId = 1,
            EmployeeId = 1,
            AssignedAt = DateTime.UtcNow,
            Status = "Assigned"
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        var workloadService = new Mock<IEmployeeWorkloadService>();

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Empty(result.AssignedEmployees);
        Assert.Empty(result.MissingRequirements);

        var assignments = await context.ShiftAssignments.ToListAsync();
        Assert.Single(assignments);
    }

    [Fact]
    public async Task ScheduleShiftAsync_CancelledAssignment_DoesNotCountTowardsRequirement()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);

        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        });

        context.EmployeeRoles.Add(new EmployeeRole
        {
            EmployeeId = 1,
            RoleId = 1
        });

        context.ShiftAssignments.Add(new ShiftAssignment
        {
            Id = 1,
            ShiftId = 1,
            EmployeeId = 1,
            AssignedAt = DateTime.UtcNow,
            Status = "Cancelled"
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
            new()
            {
                EmployeeId = 2,
                EmployeeName = "Jane Doe",
                Score = 90,
                Roles = new List<string> { "Waiter" }
            }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();
        workloadService
            .Setup(x => x.GetWorkloadAsync(2))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 2,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Single(result.AssignedEmployees);
        Assert.Equal(2, result.AssignedEmployees[0].EmployeeId);

        var assignments = await context.ShiftAssignments.ToListAsync();
        Assert.Equal(2, assignments.Count);
    }

    [Fact]
    public async Task ScheduleShiftAsync_NoMatchingCandidates_ReturnsFailed()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);

        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1,
            Role = role
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>());

        var workloadService = new Mock<IEmployeeWorkloadService>();

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Failed", result.Status);
        Assert.Empty(result.AssignedEmployees);

        Assert.Single(result.MissingRequirements);
        Assert.Equal(1, result.MissingRequirements[0].RoleId);
        Assert.Equal("Waiter", result.MissingRequirements[0].RoleName);
        Assert.Equal(1, result.MissingRequirements[0].MissingEmployees);
    }

    [Fact]
    public async Task ScheduleShiftAsync_MultipleEmployeesNeeded_AssignsRequiredNumber()
    {
        using var context = CreateContext();

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 3
        };

        context.Roles.Add(role);
        context.Shifts.Add(shift);

        context.ShiftRoleRequirements.Add(new ShiftRoleRequirement
        {
            Id = 1,
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 2,
            Role = role
        });

        await context.SaveChangesAsync();

        var candidateService = new Mock<ISchedulingCandidateService>();
        candidateService
            .Setup(x => x.GetCandidatesAsync(1))
            .ReturnsAsync(new List<SchedulingCandidateResult>
            {
            new()
            {
                EmployeeId = 1,
                EmployeeName = "John Smith",
                Score = 90,
                Roles = new List<string> { "Waiter" }
            },
            new()
            {
                EmployeeId = 2,
                EmployeeName = "Jane Doe",
                Score = 80,
                Roles = new List<string> { "Waiter" }
            },
            new()
            {
                EmployeeId = 3,
                EmployeeName = "Peter Brown",
                Score = 70,
                Roles = new List<string> { "Waiter" }
            }
            });

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(It.IsAny<int>()))
            .ReturnsAsync((int employeeId) => new EmployeeWorkloadResult
            {
                EmployeeId = employeeId,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new AutomaticSchedulingService(
            context,
            candidateService.Object,
            workloadService.Object);

        var result = await service.ScheduleShiftAsync(1);

        Assert.Equal("Completed", result.Status);
        Assert.Equal(2, result.AssignedEmployees.Count);

        Assert.Equal(1, result.AssignedEmployees[0].EmployeeId);
        Assert.Equal(2, result.AssignedEmployees[1].EmployeeId);

        var assignments = await context.ShiftAssignments.ToListAsync();

        Assert.Equal(2, assignments.Count);
    }
}