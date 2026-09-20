export interface EmployeePreference {
    id: number
    employeeId: number
    employeeName: string
    maxWeeklyHours: number | null
}

export interface CreateEmployeePreferenceRequest {
    employeeId: number
    maxWeeklyHours: number
}