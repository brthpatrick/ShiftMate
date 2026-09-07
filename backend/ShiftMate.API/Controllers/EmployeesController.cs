using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShiftMate.API.Data;
using ShiftMate.API.DTOs.Employees;
using ShiftMate.API.Models;

namespace ShiftMate.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly ShiftMateDbContext _context;

    public EmployeesController(ShiftMateDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeResponse>>> GetEmployees()
    {
        var employees = await _context.Employees
            .Select(e => new EmployeeResponse
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                DepartmentId = e.DepartmentId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Phone = e.Phone,
                HireDate = e.HireDate,
                IsActive = e.IsActive
            })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeResponse>> GetEmployee(int id)
    {
        var employee = await _context.Employees
            .Where(e => e.Id == id)
            .Select(e => new EmployeeResponse
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                DepartmentId = e.DepartmentId,
                FirstName = e.FirstName,
                LastName = e.LastName,
                Email = e.Email,
                Phone = e.Phone,
                HireDate = e.HireDate,
                IsActive = e.IsActive
            })
            .FirstOrDefaultAsync();

        if (employee == null)
        {
            return NotFound();
        }

        return Ok(employee);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeResponse>> CreateEmployee(CreateEmployeeRequest request)
    {
        var companyExists = await _context.Companies
            .AnyAsync(c => c.Id == request.CompanyId);

        if (!companyExists)
        {
            return BadRequest("The specified company does not exist.");
        }

        var departmentExists = await _context.Departments
            .AnyAsync(d => 
                d.Id == request.DepartmentId && 
                d.CompanyId == request.CompanyId);

        if (!departmentExists)
        {
            return BadRequest("The specified department does not exist or does not belong to the specified company.");
        }

        var emailExists = await _context.Employees
            .AnyAsync(e => e.Email == request.Email);

        if (emailExists)
        {
            return BadRequest("An employee with the specified email already exists.");
        }

        var employee = new Employee
        {
            CompanyId = request.CompanyId,
            DepartmentId = request.DepartmentId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            HireDate = request.HireDate,
            IsActive = true
        };

        _context.Employees.Add(employee);

        await _context.SaveChangesAsync();

        var response = new EmployeeResponse
        {
            Id = employee.Id,
            CompanyId = employee.CompanyId,
            DepartmentId = employee.DepartmentId,
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            Email = employee.Email,
            Phone = employee.Phone,
            HireDate = employee.HireDate,
            IsActive = employee.IsActive
        };

        return CreatedAtAction(
            nameof(GetEmployee),
            new { id = employee.Id },
            response);
    }
}