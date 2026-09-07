using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Companies;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public CompaniesController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyResponse>>> GetCompanies()
    {
        var companies = await _context.Companies
            .Select(c => new CompanyResponse
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(companies);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompanyResponse>> GetCompany(int id)
    {
        var company = await _context.Companies
            .Where(c => c.Id == id)
            .Select(c => new CompanyResponse
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (company == null)
        {
            return NotFound();
        }

        return Ok(company);
    }

    [HttpPost]
    public async Task<ActionResult<CompanyResponse>> CreateCompany(CreateCompanyRequest request)
    {
        var company = new Company
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        var response = new CompanyResponse
        {
            Id = company.Id,
            Name = company.Name,
            Email = company.Email,
            Phone = company.Phone,
            CreatedAt = company.CreatedAt
        };

        return CreatedAtAction(
            nameof(GetCompany),
            new { id = response.Id }, 
            response);
    }
}