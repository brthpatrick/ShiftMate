using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Locations;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public LocationController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LocationResponse>>> GetLocations()
    {
        var locations = await _context.Locations
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

        return Ok(location);
    }

    [HttpPost]
    public async Task<ActionResult<LocationResponse>> CreateLocation(
        CreateLocationRequest request)
    {
        var companyExists = await _context.Companies
            .AnyAsync(c => c.Id == request.CompanyId);

        if (!companyExists)
        {
            return BadRequest("The specified company does not exist.");
        }

        var locationExists = await _context.Locations
            .AnyAsync(l => 
                l.CompanyId == request.CompanyId && 
                l.Name == request.Name);

        if (locationExists)
        {
            return Conflict("A location with this name already exists in the company.");
        }

        var location = new Location
        {
            CompanyId = request.CompanyId,
            Name = request.Name,
            Address = request.Address,
            City = request.City
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
