using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Scheduling;

namespace ShiftMate.Tests.Services.Scheduling;

public class ShiftStatusServiceTests
{
    private ShiftMateDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ShiftMateDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ShiftMateDbContext(options);
    }

    private async Task AddShiftAsync(
        ShiftMateDbContext context,
        int id,
        ShiftStatus status)
    {
        context.Shifts.Add(new Shift
        {
            Id = id,
            LocationId = 1,
            StartTime = new DateTime(2026, 9, 20, 8, 0, 0),
            EndTime = new DateTime(2026, 9, 20, 16, 0, 0),
            RequiredEmployees = 1,
            Status = status
        });

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task ChangeStatusAsync_ShiftDoesNotExist_ReturnsError()
    {
        using var context = CreateContext();

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            999,
            ShiftStatus.Open);

        Assert.False(result.Success);
        Assert.Equal(
            "The shift does not exist.",
            result.Error);
    }

    [Fact]
    public async Task ChangeStatusAsync_SameStatus_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Draft);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Draft);

        Assert.False(result.Success);
        Assert.Equal(
            "The shift already has this status.",
            result.Error);
    }

    [Fact]
    public async Task ChangeStatusAsync_DraftToOpen_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Draft);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Open);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Open,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_OpenToScheduled_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Open);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Scheduled);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Scheduled,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_DraftToScheduled_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Draft);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Scheduled);

        Assert.False(result.Success);
        Assert.Equal(
            "Invalid status transition from 'Draft' to 'Scheduled'.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Draft,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_OpenToCancelled_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Open);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Cancelled);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Cancelled,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_ScheduledToInProgress_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Scheduled);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.InProgress);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.InProgress,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_InProgressToCompleted_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.InProgress);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Completed);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Completed,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_ScheduledToCancelled_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Scheduled);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Cancelled);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Cancelled,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_CompletedToOpen_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Completed);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Open);

        Assert.False(result.Success);
        Assert.Equal(
            "Invalid status transition from 'Completed' to 'Open'.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Completed,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_CancelledToOpen_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Cancelled);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Open);

        Assert.False(result.Success);
        Assert.Equal(
            "Invalid status transition from 'Cancelled' to 'Open'.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Cancelled,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_InProgressToCancelled_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.InProgress);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Cancelled);

        Assert.False(result.Success);
        Assert.Equal(
            "Invalid status transition from 'InProgress' to 'Cancelled'.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.InProgress,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_DraftToCancelled_Succeeds()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Draft);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Cancelled);

        Assert.True(result.Success);
        Assert.Null(result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Cancelled,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_ScheduledToScheduled_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Scheduled);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Scheduled);

        Assert.False(result.Success);
        Assert.Equal(
            "The shift already has this status.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Scheduled,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_CompletedToCancelled_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Completed);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Cancelled);

        Assert.False(result.Success);
        Assert.Equal(
            "Invalid status transition from 'Completed' to 'Cancelled'.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Completed,
            shift.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_CancelledToCompleted_ReturnsError()
    {
        using var context = CreateContext();

        await AddShiftAsync(
            context,
            1,
            ShiftStatus.Cancelled);

        var service = new ShiftStatusService(context);

        var result = await service.ChangeStatusAsync(
            1,
            ShiftStatus.Completed);

        Assert.False(result.Success);
        Assert.Equal(
            "Invalid status transition from 'Cancelled' to 'Completed'.",
            result.Error);

        var shift = await context.Shifts
            .SingleAsync(s => s.Id == 1);

        Assert.Equal(
            ShiftStatus.Cancelled,
            shift.Status);
    }
}