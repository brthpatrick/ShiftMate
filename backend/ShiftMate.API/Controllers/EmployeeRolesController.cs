using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.EmployeeRoles;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeeRolesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public EmployeeRolesController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeRoleResponse>>> GetEmployeeRoles()
    {
        var employeeRoles = await _context.EmployeeRoles
            .Include(er => er.Employee)
            .Include(er => er.Role)
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

    [HttpPost]
    public async Task<ActionResult<EmployeeRoleResponse>> AssignRole(
        AssignEmployeeRoleRequest request)
    {
        var employeeExists = await _context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId);

        if (!employeeExists)
        {
            return BadRequest("The specified employee does not exist.");
        }

        var roleExists = await _context
            .Roles.AnyAsync(r => r.Id == request.RoleId);

        if (!roleExists)
        {
            return BadRequest("The specified role does not exist.");
        }

        var assignmentExists = await _context.EmployeeRoles
            .AnyAsync(er => 
                er.EmployeeId == request.EmployeeId &&
                er.RoleId == request.RoleId);

        if (assignmentExists)
        {
            return Conflict("This role is already assigned to the employee.");
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
                EmployeeName = er.Employee.FirstName + " " + er.Employee.LastName,
                RoleName = er.Role.Name
            })
            .FirstOrDefaultAsync();

        return Ok(response);
    }

    [HttpDelete("{employeeId:int}/{roleId:int}")]
    public async Task<IActionResult> RemoveRole(
        int employeeId, 
        int roleId)
    {
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