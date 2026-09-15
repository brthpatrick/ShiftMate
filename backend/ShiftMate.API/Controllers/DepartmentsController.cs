using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Departments;
using ShiftMate.API.Models;
using ShiftMate.API.Services.Authentication;

namespace ShiftMate.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly ShiftMateDbContext _context;
    private readonly IAccessControlService _accessControlService;
    private readonly ICurrentUserService _currentUserService;

    public DepartmentsController(
        ShiftMateDbContext context,
        IAccessControlService accessControlService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _accessControlService = accessControlService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentResponse>>> GetDepartments()
    {
        var companyId = _currentUserService.CompanyId;

        if (!companyId.HasValue)
        {
            return Unauthorized();
        }

        var departments = await _context.Departments
            .Where(d => d.CompanyId == companyId.Value)
            .Select(d => new DepartmentResponse
            {
                Id = d.Id,
                Name = d.Name,
                CompanyId = d.CompanyId
            })
            .ToListAsync();

        return Ok(departments);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentResponse>> GetDepartment(int id)
    {
        var department = await _context.Departments
            .Where(d => d.Id == id)
            .Select(d => new DepartmentResponse
            {
                Id = d.Id,
                Name = d.Name,
                CompanyId = d.CompanyId
            })
            .FirstOrDefaultAsync();

        if (department is null)
        {
            return NotFound();
        }

        if (!_accessControlService.IsCompanyAllowed(department.CompanyId))
        {
            return Forbid();
        }

        return Ok(department);
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentResponse>> CreateDepartment(
        CreateDepartmentRequest request)
    {
        if (!_currentUserService.CompanyId.HasValue ||
            !_accessControlService.IsCompanyAllowed(request.CompanyId))
        {
            return Forbid();
        }

        var companyExists = await _context.Companies
            .AnyAsync(c => c.Id == request.CompanyId);

        if (!companyExists)
        {
            return BadRequest("The specified company does not exist.");
        }

        var departmentExists = await _context.Departments
            .AnyAsync(d =>
                d.Name == request.Name &&
                d.CompanyId == request.CompanyId);

        if (departmentExists)
        {
            return BadRequest(
                "A department with the same name already exists in the specified company.");
        }

        var department = new Department
        {
            Name = request.Name,
            CompanyId = request.CompanyId
        };

        _context.Departments.Add(department);

        await _context.SaveChangesAsync();

        var response = new DepartmentResponse
        {
            Id = department.Id,
            Name = department.Name,
            CompanyId = department.CompanyId
        };

        return CreatedAtAction(
            nameof(GetDepartment),
            new { id = department.Id },
            response);
    }
}