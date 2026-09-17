export interface LeaveRequest {
    id: number
    employeeId: number
    employeeName: string
    startDate: string
    endDate: string
    reason: string | null
    status: string
    createdAt: string
}