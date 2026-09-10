namespace ShiftMate.API.Services.Scheduling;

public class AutomaticSchedulingResult
{
    public int ShiftId { get; set; }

    public string Status { get; set; } = string.Empty;

    public List<AutomaticSchedulingAssignmentResult> AssignedEmployees { get; set; } = new();

    public List<AutomaticSchedulingMissingRequirementResult> MissingRequirements { get; set; } = new();
}

public class AutomaticSchedulingAssignmentResult
{
    public int EmployeeId { get; set; }

    public string EmployeeName { get; set; } = string.Empty;

    public int RoleId { get; set; }

    public string RoleName { get; set; } = string.Empty;

    public int Score { get; set; }
}

public class AutomaticSchedulingMissingRequirementResult
{
    public int RoleId { get; set; }

    public string RoleName { get; set; } = string.Empty;

    public int MissingEmployees { get; set; }
}