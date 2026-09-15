using Microsoft.EntityFrameworkCore;
using Moq;
using ShiftMate.API.Data;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.Tests.Services.Scheduling;

public class CandidateScoringServiceTests
{
    private static ShiftMateDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ShiftMateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ShiftMateDbContext(options);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeDoesNotExist_ReturnsZero()
    {
        await using var context = CreateContext();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(999, 1);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenShiftDoesNotExist_ReturnsZero()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 999);

        Assert.Equal(0, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeHasNoRequirementsAndNoAvailability_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        context.Locations.Add(new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        Assert.Equal(75, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeMatchesRoleAvailabilityAndPreference_Returns100()
    {
        await using var context = CreateContext();

        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        };

        var location = new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var requirement = new ShiftRoleRequirement
        {
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1
        };

        var employeeRole = new EmployeeRole
        {
            EmployeeId = 1,
            RoleId = 1
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = shift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            IsAvailable = true
        };

        var dayPreference = new EmployeeDayPreference
        {
            EmployeeId = 1,
            DayOfWeek = shift.StartTime.DayOfWeek,
            IsPreferred = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Roles.Add(role);
        context.ShiftRoleRequirements.Add(requirement);
        context.EmployeeRoles.Add(employeeRole);
        context.Availabilities.Add(availability);
        context.EmployeeDayPreferences.Add(dayPreference);

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        Assert.Equal(100, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeHasTwoAssignedShifts_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        context.Locations.Add(new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 2,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // No role requirement: +40
        // No availability: +0
        // 1-2 assigned shifts: +10
        // Less than 8 scheduled hours: +20
        // No preferred day: +0
        // Total: 70
        Assert.Equal(70, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeHasFourAssignedShifts_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        context.Locations.Add(new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 4,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 40 + 0 + 5 + 20 = 65
        Assert.Equal(65, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeHasEightScheduledHours_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        context.Locations.Add(new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 8
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 40 + 0 + 15 + 15 = 70
        Assert.Equal(70, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeHasSixteenScheduledHours_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        context.Locations.Add(new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 16
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 40 + 0 + 15 + 10 = 65
        Assert.Equal(65, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeHasTwentyFourScheduledHours_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        context.Locations.Add(new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        });

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 24
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 40 + 0 + 15 + 5 = 60
        Assert.Equal(60, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeePrefersShiftDay_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        };

        var location = new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var dayPreference = new EmployeeDayPreference
        {
            EmployeeId = 1,
            DayOfWeek = shift.StartTime.DayOfWeek,
            IsPreferred = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.EmployeeDayPreferences.Add(dayPreference);

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 40 + 0 + 15 + 20 + 10 = 85
        Assert.Equal(85, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeIsAvailableForEntireShift_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        };

        var location = new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = shift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            IsAvailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 40 + 25 + 15 + 20 = 100
        Assert.Equal(100, result);
    }

    [Fact]
    public async Task CalculateScoreAsync_WhenEmployeeDoesNotMatchRequiredRole_ReturnsExpectedScore()
    {
        await using var context = CreateContext();

        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        };

        var location = new Location
        {
            Id = 1,
            CompanyId = 1,
            Name = "Main Office"
        };

        var shift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var role = new Role
        {
            Id = 1,
            Name = "Waiter"
        };

        var requirement = new ShiftRoleRequirement
        {
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Roles.Add(role);
        context.ShiftRoleRequirements.Add(requirement);

        await context.SaveChangesAsync();

        var workloadService = new Mock<IEmployeeWorkloadService>();

        workloadService
            .Setup(x => x.GetWorkloadAsync(1))
            .ReturnsAsync(new EmployeeWorkloadResult
            {
                EmployeeId = 1,
                AssignedShiftCount = 0,
                ScheduledHours = 0
            });

        var service = new CandidateScoringService(
            context,
            workloadService.Object);

        var result = await service.CalculateScoreAsync(1, 1);

        // 0 + 0 + 15 + 20 = 35
        Assert.Equal(35, result);
    }
}