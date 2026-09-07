namespace ShiftMate.API.DTOs.Departments;

public class DepartmentResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int CompanyId { get; set; }
}