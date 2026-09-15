using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.ShiftRoleRequirements;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ShiftRoleRequirementsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public ShiftRoleRequirementsController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ShiftRoleRequirementResponse>>>
        GetRequirements()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var requirements = await _context.ShiftRoleRequirements
            .Where(srr => srr.Shift.Location.CompanyId == companyId.Value)
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
    public async Task<ActionResult<ShiftRoleRequirementResponse>>
        GetRequirement(int id)
    {
        var requirement = await _context.ShiftRoleRequirements
            .Where(srr => srr.Id == id)
            .Select(srr => new
            {
                Requirement = new ShiftRoleRequirementResponse
                {
                    Id = srr.Id,
                    ShiftId = srr.ShiftId,
                    RoleId = srr.RoleId,
                    RoleName = srr.Role.Name,
                    RequiredEmployees = srr.RequiredEmployees
                },
                CompanyId = srr.Shift.Location.CompanyId
            })
            .FirstOrDefaultAsync();

        if (requirement is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                requirement.CompanyId))
        {
            return Forbid();
        }

        return Ok(requirement.Requirement);
    }

    [HttpGet("shift/{shiftId:int}")]
    public async Task<ActionResult<IEnumerable<ShiftRoleRequirementResponse>>>
        GetRequirementsForShift(int shiftId)
    {
        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == shiftId);

        if (shift is null)
        {
            return NotFound("The shift does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(
                shift.Location.CompanyId))
        {
            return Forbid();
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

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<ShiftRoleRequirementResponse>>
        CreateRequirement(
            CreateShiftRoleRequirementRequest request)
    {
        if (request.RequiredEmployees <= 0)
        {
            return BadRequest(
                "RequiredEmployees must be greater than zero.");
        }

        var shift = await _context.Shifts
            .Include(s => s.Location)
            .FirstOrDefaultAsync(s => s.Id == request.ShiftId);

        if (shift is null)
        {
            return NotFound("The shift does not exist.");
        }

        if (!_accessControlService.IsCompanyAllowed(
                shift.Location.CompanyId))
        {
            return Forbid();
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
            return Conflict(
                "This role requirement already exists for the shift.");
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

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteRequirement(int id)
    {
        var requirement = await _context.ShiftRoleRequirements
            .Include(srr => srr.Shift)
            .ThenInclude(s => s.Location)
            .FirstOrDefaultAsync(srr => srr.Id == id);

        if (requirement is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(
                requirement.Shift.Location.CompanyId))
        {
            return Forbid();
        }

        _context.ShiftRoleRequirements.Remove(requirement);

        await _context.SaveChangesAsync();

        return NoContent();
    }
}