namespace ShiftMate.API.Models;

public class Employee
{
    public int Id { get; set; }

    public int CompanyId { get; set; }

    public int DepartmentId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public DateTime HireDate { get; set; }

    public bool IsActive { get; set; }

    public Company Company { get; set; } = null!;

    public Department Department { get; set; } = null!;
}