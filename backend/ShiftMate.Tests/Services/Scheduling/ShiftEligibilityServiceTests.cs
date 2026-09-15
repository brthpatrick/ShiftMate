using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.Tests.Services.Scheduling;

public class ShiftEligibilityServiceTests
{
    private static ShiftMateDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ShiftMateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ShiftMateDbContext(options);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeDoesNotExist_ReturnsNotEligible()
    {
        await using var context = CreateContext();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 999,
            shiftId: 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee does not exist.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeIsInactive_ReturnsNotEligible()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = false
        });

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee is not active.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenShiftDoesNotExist_ReturnsNotEligible()
    {
        await using var context = CreateContext();

        context.Employees.Add(new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        });

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 999);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The shift does not exist.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeAndShiftBelongToDifferentCompanies_ReturnsNotEligible()
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
            CompanyId = 2
        });

        context.Shifts.Add(new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0)
        });

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee does not belong to the same company of the shift.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeIsAvailable_ReturnsEligible()
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

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 1);

        Assert.True(result.IsEligible);
        Assert.Null(result.Reason);
    }
}