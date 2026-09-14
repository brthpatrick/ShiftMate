using ShiftMate.API.Models;

namespace ShiftMate.API.DTOs.Shifts;

public class UpdateShiftStatusRequest
{
    public ShiftStatus Status { get; set; }
}