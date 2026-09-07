namespace ShiftMate.API.Models;

public class Role
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public ICollection<EmployeeRole> EmployeeRoles { get; set; } = new List<EmployeeRole>();
}