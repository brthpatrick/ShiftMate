using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;

namespace ShiftMate.API.Services.Authentication;

public class AccessControlService : IAccessControlService
{
    private readonly ShiftMateDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AccessControlService(
        ShiftMateDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public bool IsCompanyAllowed(int companyId)
    {
        return _currentUserService.CompanyId == companyId;
    }

    public async Task<bool> IsEmployeeAllowedAsync(int employeeId)
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return false;
        }

        return await _context.Employees
            .AnyAsync(e =>
                e.Id == employeeId &&
                e.CompanyId == companyId.Value);
    }

    public async Task<bool> IsShiftAllowedAsync(int shiftId)
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return false;
        }

        return await _context.Shifts
            .Where(s => s.Id == shiftId)
            .Select(s => s.Location.CompanyId)
            .AnyAsync(id => id == companyId.Value);
    }
}