using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Roles;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public RolesController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleResponse>>> GetRoles()
    {
        var roles = await _context.Roles
            .Select(r => new RoleResponse
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description
            })
            .ToListAsync();

        return Ok(roles);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoleResponse>> GetRole(int id)
    {
        var role = await _context.Roles
            .Where(r => r.Id == id)
            .Select(r => new RoleResponse
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description
            })
            .FirstOrDefaultAsync();

        if (role == null)
        {
            return NotFound();
        }

        return Ok(role);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<RoleResponse>> CreateRole(
        CreateRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Role name is required.");
        }

        var name = request.Name.Trim();

        var roleExists = await _context.Roles
            .AnyAsync(r => r.Name == name);

        if (roleExists)
        {
            return Conflict("A role with this name already exists.");
        }

        var role = new Role
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim()
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();

        var response = new RoleResponse
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description
        };

        return CreatedAtAction(
            nameof(GetRole),
            new { id = role.Id },
            response);
    }
}