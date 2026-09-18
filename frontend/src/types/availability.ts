export interface Availability {
    id: number
    employeeId: number
    employeeName: string
    dayOfWeek: number
    startTime: string
    endTime: string
    isAvailable: boolean
}

export interface CreateAvailabilityRequest {
    employeeId: number
    dayOfWeek: number
    startTime: string
    endTime: string
    isAvailable: boolean
}