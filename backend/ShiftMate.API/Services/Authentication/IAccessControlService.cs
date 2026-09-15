namespace ShiftMate.API.Services.Authentication;

public interface IAccessControlService
{
    bool IsCompanyAllowed(int companyId);

    Task<bool> IsEmployeeAllowedAsync(int employeeId);

    Task<bool> IsShiftAllowedAsync(int shiftId);
}