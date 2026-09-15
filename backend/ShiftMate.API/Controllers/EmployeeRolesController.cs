using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.EmployeeRoles;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class EmployeeRolesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public EmployeeRolesController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeRoleResponse>>> GetEmployeeRoles()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var employeeRoles = await _context.EmployeeRoles
            .Where(er => er.Employee.CompanyId == companyId.Value)
            .Select(er => new EmployeeRoleResponse
            {
                EmployeeId = er.EmployeeId,
                RoleId = er.RoleId,
                EmployeeName = er.Employee.FirstName + " " + er.Employee.LastName,
                RoleName = er.Role.Name
            })
            .ToListAsync();

        return Ok(employeeRoles);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<EmployeeRoleResponse>> AssignRole(
        AssignEmployeeRoleRequest request)
    {
        var employeeAllowed =
            await _accessControlService.IsEmployeeAllowedAsync(
                request.EmployeeId);

        if (!employeeAllowed)
        {
            return Forbid();
        }

        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest(
                "The specified employee does not exist.");
        }

        var roleExists = await _context.Roles
            .AnyAsync(r => r.Id == request.RoleId);

        if (!roleExists)
        {
            return BadRequest(
                "The specified role does not exist.");
        }

        var assignmentExists = await _context.EmployeeRoles
            .AnyAsync(er =>
                er.EmployeeId == request.EmployeeId &&
                er.RoleId == request.RoleId);

        if (assignmentExists)
        {
            return Conflict(
                "This role is already assigned to the employee.");
        }

        var employeeRole = new EmployeeRole
        {
            EmployeeId = request.EmployeeId,
            RoleId = request.RoleId
        };

        _context.EmployeeRoles.Add(employeeRole);

        await _context.SaveChangesAsync();

        var response = await _context.EmployeeRoles
            .Where(er =>
                er.EmployeeId == request.EmployeeId &&
                er.RoleId == request.RoleId)
            .Select(er => new EmployeeRoleResponse
            {
                EmployeeId = er.EmployeeId,
                RoleId = er.RoleId,
                EmployeeName = er.Employee.FirstName + " " +
                               er.Employee.LastName,
                RoleName = er.Role.Name
            })
            .FirstOrDefaultAsync();

        return Ok(response);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{employeeId:int}/{roleId:int}")]
    public async Task<IActionResult> RemoveRole(
        int employeeId,
        int roleId)
    {
        var employeeAllowed =
            await _accessControlService.IsEmployeeAllowedAsync(
                employeeId);

        if (!employeeAllowed)
        {
            return Forbid();
        }

        var employeeRole = await _context.EmployeeRoles
            .FirstOrDefaultAsync(er =>
                er.EmployeeId == employeeId &&
                er.RoleId == roleId);

        if (employeeRole is null)
        {
            return NotFound();
        }

        _context.EmployeeRoles.Remove(employeeRole);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}