export interface EmployeeDayPreference {
    id: number
    employeeId: number
    employeeName: string
    dayOfWeek: number
    isPreferred: boolean
    isUnavailable: boolean
}

export interface CreateEmployeeDayPreferenceRequest {
    employeeId: number
    dayOfWeek: number
    isPreferred: boolean
    isUnavailable: boolean
}