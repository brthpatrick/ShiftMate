export interface ShiftAssignment {
    id: number
    shiftId: number
    employeeId: number
    employeeName: string
    locationName: string
    shiftStartTime: string
    shiftEndTime: string
    assignedAt: string
    status: string
}

export  interface AssignEmployeeToShiftRequest {
    shiftId: number
    employeeId: number
}