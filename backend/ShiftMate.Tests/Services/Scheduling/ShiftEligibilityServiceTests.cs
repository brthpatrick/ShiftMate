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

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeIsAlreadyAssigned_ReturnsNotEligible()
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

        var assignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 1,
            Status = "Scheduled"
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.ShiftAssignments.Add(assignment);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee is already assigned to this shift.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeDoesNotHaveRequiredRole_ReturnsNotEligible()
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

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee does not have the required role: Waiter.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenRequiredRoleCapacityIsReached_ReturnsNotEligible()
    {
        await using var context = CreateContext();

        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        };

        var assignedEmployee = new Employee
        {
            Id = 2,
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

        var employeeRole = new EmployeeRole
        {
            EmployeeId = 1,
            RoleId = 1
        };

        var assignedEmployeeRole = new EmployeeRole
        {
            EmployeeId = 2,
            RoleId = 1
        };

        var requirement = new ShiftRoleRequirement
        {
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1
        };

        var assignment = new ShiftAssignment
        {
            EmployeeId = 2,
            ShiftId = 1,
            Status = "Scheduled"
        };

        context.Employees.AddRange(employee, assignedEmployee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Roles.Add(role);
        context.EmployeeRoles.AddRange(
            employeeRole,
            assignedEmployeeRole);
        context.ShiftRoleRequirements.Add(requirement);
        context.ShiftAssignments.Add(assignment);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(
            employeeId: 1,
            shiftId: 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The required number of employees with role 'Waiter' has already been reached.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeHasOverlappingShift_ReturnsNotEligible()
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

        var currentShift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 14, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 18, 0, 0),
            RequiredEmployees = 1
        };

        var existingShift = new Shift
        {
            Id = 2,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 12, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var assignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 2,
            Status = "Scheduled"
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.AddRange(currentShift, existingShift);
        context.ShiftAssignments.Add(assignment);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee already has another shift during this time.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenWeeklyHoursWouldBeExceeded_ReturnsNotEligible()
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

        var currentShift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var previousShift = new Shift
        {
            Id = 2,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 14, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 14, 16, 0, 0),
            RequiredEmployees = 1
        };

        var assignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 2,
            Status = "Scheduled"
        };

        var preference = new EmployeePreference
        {
            EmployeeId = 1,
            MaxWeeklyHours = 12
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = currentShift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            IsAvailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.AddRange(currentShift, previousShift);
        context.ShiftAssignments.Add(assignment);
        context.EmployeePreferences.Add(preference);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee would exceed their maximum weekly working hours.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeIsUnavailableOnDay_ReturnsNotEligible()
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
            IsUnavailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.EmployeeDayPreferences.Add(dayPreference);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee is unavailable on this day.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeIsNotAvailableDuringEntireShift_ReturnsNotEligible()
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
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(15, 0, 0),
            IsAvailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee is not available during the entire shift.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenEmployeeHasApprovedLeave_ReturnsNotEligible()
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

        var leaveRequest = new LeaveRequest
        {
            EmployeeId = 1,
            StartDate = new DateTime(2026, 9, 15),
            EndDate = new DateTime(2026, 9, 15),
            Status = "Approved"
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Availabilities.Add(availability);
        context.LeaveRequests.Add(leaveRequest);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee is on approved leave during this shift.",
            result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenExistingAssignmentIsCancelled_ReturnsEligible()
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

        var assignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 1,
            Status = "Cancelled"
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
        context.ShiftAssignments.Add(assignment);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.True(result.IsEligible);
        Assert.Null(result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenOverlappingAssignmentIsCancelled_ReturnsEligible()
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

        var currentShift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 14, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 18, 0, 0),
            RequiredEmployees = 1
        };

        var existingShift = new Shift
        {
            Id = 2,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 12, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var assignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 2,
            Status = "Cancelled"
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = currentShift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(19, 0, 0),
            IsAvailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.AddRange(currentShift, existingShift);
        context.ShiftAssignments.Add(assignment);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.True(result.IsEligible);
        Assert.Null(result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenCancelledAssignmentHasRequiredRole_ReturnsEligible()
    {
        await using var context = CreateContext();

        var employee = new Employee
        {
            Id = 1,
            CompanyId = 1,
            IsActive = true
        };

        var assignedEmployee = new Employee
        {
            Id = 2,
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

        var employeeRole = new EmployeeRole
        {
            EmployeeId = 1,
            RoleId = 1
        };

        var assignedEmployeeRole = new EmployeeRole
        {
            EmployeeId = 2,
            RoleId = 1
        };

        var requirement = new ShiftRoleRequirement
        {
            ShiftId = 1,
            RoleId = 1,
            RequiredEmployees = 1
        };

        var cancelledAssignment = new ShiftAssignment
        {
            EmployeeId = 2,
            ShiftId = 1,
            Status = "Cancelled"
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = shift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            IsAvailable = true
        };

        context.Employees.AddRange(employee, assignedEmployee);
        context.Locations.Add(location);
        context.Shifts.Add(shift);
        context.Roles.Add(role);
        context.EmployeeRoles.AddRange(employeeRole, assignedEmployeeRole);
        context.ShiftRoleRequirements.Add(requirement);
        context.ShiftAssignments.Add(cancelledAssignment);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.True(result.IsEligible);
        Assert.Null(result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenCancelledAssignmentWouldExceedWeeklyHours_ReturnsEligible()
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

        var currentShift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var previousShift = new Shift
        {
            Id = 2,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 14, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 14, 16, 0, 0),
            RequiredEmployees = 1
        };

        var cancelledAssignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 2,
            Status = "Cancelled"
        };

        var preference = new EmployeePreference
        {
            EmployeeId = 1,
            MaxWeeklyHours = 12
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = currentShift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            IsAvailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.AddRange(currentShift, previousShift);
        context.ShiftAssignments.Add(cancelledAssignment);
        context.EmployeePreferences.Add(preference);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.True(result.IsEligible);
        Assert.Null(result.Reason);
    }

    [Fact]
    public async Task CheckEligibilityAsync_WhenActiveAssignmentWouldExceedWeeklyHours_ReturnsNotEligible()
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

        var currentShift = new Shift
        {
            Id = 1,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 15, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 15, 16, 0, 0),
            RequiredEmployees = 1
        };

        var previousShift = new Shift
        {
            Id = 2,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 14, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 14, 16, 0, 0),
            RequiredEmployees = 1
        };

        var assignment = new ShiftAssignment
        {
            EmployeeId = 1,
            ShiftId = 2,
            Status = "Scheduled"
        };

        var preference = new EmployeePreference
        {
            EmployeeId = 1,
            MaxWeeklyHours = 12
        };

        var availability = new Availability
        {
            EmployeeId = 1,
            DayOfWeek = currentShift.StartTime.DayOfWeek,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(17, 0, 0),
            IsAvailable = true
        };

        context.Employees.Add(employee);
        context.Locations.Add(location);
        context.Shifts.AddRange(currentShift, previousShift);
        context.ShiftAssignments.Add(assignment);
        context.EmployeePreferences.Add(preference);
        context.Availabilities.Add(availability);

        await context.SaveChangesAsync();

        var service = new ShiftEligibilityService(context);

        var result = await service.CheckEligibilityAsync(1, 1);

        Assert.False(result.IsEligible);
        Assert.Equal(
            "The employee would exceed their maximum weekly working hours.",
            result.Reason);
    }
}