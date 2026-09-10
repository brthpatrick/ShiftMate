namespace ShiftMate.API.Services.Scheduling;

public interface IEmployeeWorkloadService
{
    Task<EmployeeWorkloadResult> GetWorkloadAsync(int employeeId);
}