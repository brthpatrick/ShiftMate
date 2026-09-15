using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Companies;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAccessControlService _accessControlService;

    public CompaniesController(
        ShiftMateDbContext context,
        ICurrentUserService currentUserService,
        IAccessControlService accessControlService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _accessControlService = accessControlService;
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CompanyResponse>>> GetCompanies()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var companies = await _context.Companies
            .Where(c => c.Id == companyId.Value)
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

    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompanyResponse>> GetCompany(int id)
    {
        if (!_accessControlService.IsCompanyAllowed(id))
        {
            return Forbid();
        }

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

        if (company is null)
        {
            return NotFound();
        }

        return Ok(company);
    }

    [HttpPost]
    public async Task<ActionResult<CompanyResponse>> CreateCompany(
        CreateCompanyRequest request)
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