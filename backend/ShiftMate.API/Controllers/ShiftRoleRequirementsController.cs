using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.ShiftRoleRequirements;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShiftRoleRequirementsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public ShiftRoleRequirementsController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftRoleRequirementResponse>>> GetRequirements()
    {
        var requirements = await _context.ShiftRoleRequirements
            .Select(srr => new ShiftRoleRequirementResponse
            {
                Id = srr.Id,
                ShiftId = srr.ShiftId,
                RoleId = srr.RoleId,
                RoleName = srr.Role.Name,
                RequiredEmployees = srr.RequiredEmployees
            })
            .ToListAsync();

        return Ok(requirements);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ShiftRoleRequirementResponse>> GetRequirement(int id)
    {
        var requirement = await _context.ShiftRoleRequirements
            .Where(srr => srr.Id == id)
            .Select(srr => new ShiftRoleRequirementResponse
            {
                Id = srr.Id,
                ShiftId = srr.ShiftId,
                RoleId = srr.RoleId,
                RoleName = srr.Role.Name,
                RequiredEmployees = srr.RequiredEmployees
            })
            .FirstOrDefaultAsync();

        if (requirement is null)
        {
            return NotFound();
        }

        return Ok(requirement);
    }

    [HttpGet("shift/{shiftId:int}")]
    public async Task<ActionResult<IEnumerable<ShiftRoleRequirementResponse>>> GetRequirementsForShift(
        int shiftId)
    {
        var shiftExists = await _context.Shifts
            .AnyAsync(s => s.Id == shiftId);

        if (!shiftExists)
        {
            return NotFound("The shift does not exist.");
        }

        var requirements = await _context.ShiftRoleRequirements
            .Where(srr => srr.ShiftId == shiftId)
            .Select(srr => new ShiftRoleRequirementResponse
            {
                Id = srr.Id,
                ShiftId = srr.ShiftId,
                RoleId = srr.RoleId,
                RoleName = srr.Role.Name,
                RequiredEmployees = srr.RequiredEmployees
            })
            .ToListAsync();

        return Ok(requirements);
    }

    [HttpPost]
    public async Task<ActionResult<ShiftRoleRequirementResponse>> CreateRequirement(
        CreateShiftRoleRequirementRequest request)
    {
        if (request.RequiredEmployees <= 0)
        {
            return BadRequest("RequiredEmployees must be greater than zero.");
        }

        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == request.ShiftId);

        if (shift is null)
        {
            return NotFound("The shift does not exist.");
        }

        var role = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == request.RoleId);

        if (role is null)
        {
            return NotFound("The role does not exist.");
        }

        var alreadyExists = await _context.ShiftRoleRequirements
            .AnyAsync(srr =>
                srr.ShiftId == request.ShiftId &&
                srr.RoleId == request.RoleId);

        if (alreadyExists)
        {
            return Conflict("This role requirement already exists for the shift.");
        }

        var requirement = new ShiftRoleRequirement
        {
            ShiftId = request.ShiftId,
            RoleId = request.RoleId,
            RequiredEmployees = request.RequiredEmployees
        };

        _context.ShiftRoleRequirements.Add(requirement);

        await _context.SaveChangesAsync();

        var response = await _context.ShiftRoleRequirements
            .Where(srr => srr.Id == requirement.Id)
            .Select(srr => new ShiftRoleRequirementResponse
            {
                Id = srr.Id,
                ShiftId = srr.ShiftId,
                RoleId = srr.RoleId,
                RoleName = srr.Role.Name,
                RequiredEmployees = srr.RequiredEmployees
            })
            .FirstAsync();

        return CreatedAtAction(
            nameof(GetRequirement),
            new { id = requirement.Id },
            response);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRequirement(int id)
    {
        var requirement = await _context.ShiftRoleRequirements
            .FirstOrDefaultAsync(srr => srr.Id == id);

        if (requirement is null)
        {
            return NotFound();
        }

        _context.ShiftRoleRequirements.Remove(requirement);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}