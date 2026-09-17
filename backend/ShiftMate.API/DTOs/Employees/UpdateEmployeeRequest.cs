namespace ShiftMate.API.DTOs.Employees;

public class UpdateEmployeeRequest
{
    public int DepartmentId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public DateTime HireDate { get; set; }

    public bool IsActive { get; set; }
}