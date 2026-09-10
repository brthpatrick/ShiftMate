namespace ShiftMate.API.Services.Scheduling
{
    public class EmployeeWorkloadResult
    {
        public int EmployeeId { get; set; }

        public int AssignedShiftCount { get; set; }
        
        public double ScheduledHours { get; set; }
    }
}