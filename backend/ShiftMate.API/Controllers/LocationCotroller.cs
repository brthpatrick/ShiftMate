using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Locations;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LocationController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public LocationController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocationResponse>>> GetLocations()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var locations = await _context.Locations
            .Where(l => l.CompanyId == companyId.Value)
            .Select(l => new LocationResponse
            {
                Id = l.Id,
                CompanyId = l.CompanyId,
                Name = l.Name,
                Address = l.Address,
                City = l.City
            })
            .ToListAsync();

        return Ok(locations);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LocationResponse>> GetLocation(int id)
    {
        var location = await _context.Locations
            .Where(l => l.Id == id)
            .Select(l => new LocationResponse
            {
                Id = l.Id,
                CompanyId = l.CompanyId,
                Name = l.Name,
                Address = l.Address,
                City = l.City
            })
            .FirstOrDefaultAsync();

        if (location is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(location.CompanyId))
        {
            return Forbid();
        }

        return Ok(location);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<ActionResult<LocationResponse>> CreateLocation(
        CreateLocationRequest request)
    {
        var currentCompanyId = _currentUserService.CompanyId;

        if (!currentCompanyId.HasValue)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Location name is required.");
        }

        var name = request.Name.Trim();

        var companyExists = await _context.Companies
            .AnyAsync(c => c.Id == currentCompanyId.Value);

        if (!companyExists)
        {
            return BadRequest("The current company does not exist.");
        }

        var locationExists = await _context.Locations
            .AnyAsync(l =>
                l.CompanyId == currentCompanyId.Value &&
                l.Name == name);

        if (locationExists)
        {
            return Conflict(
                "A location with this name already exists in your company.");
        }

        var location = new Location
        {
            CompanyId = currentCompanyId.Value,
            Name = name,
            Address = string.IsNullOrWhiteSpace(request.Address)
                ? null
                : request.Address.Trim(),
            City = string.IsNullOrWhiteSpace(request.City)
                ? null
                : request.City.Trim()
        };

        _context.Locations.Add(location);
        await _context.SaveChangesAsync();

        var response = new LocationResponse
        {
            Id = location.Id,
            CompanyId = location.CompanyId,
            Name = location.Name,
            Address = location.Address,
            City = location.City
        };

        return CreatedAtAction(
            nameof(GetLocation),
            new { id = location.Id },
            response);
    }
}