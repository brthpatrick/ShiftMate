using System.ComponentModel.DataAnnotations;

namespace ShiftMate.API.DTOs.LeaveRequests
{
    public class CreateLeaveRequest
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public string? Reason { get; set; }
    }
}