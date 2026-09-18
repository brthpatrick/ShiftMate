export interface Shift {
    id: number
    locationId: number
    locationName: string
    startTime: string
    endTime: string
    requiredEmployees: number
    notes: string | null
    status: number
}

export interface CreateShiftRequest {
    locationId: number
    startTime: string
    endTime: string
    requiredEmployees: number
    notes: string
}

export interface UpdateShiftStatusRequest {
    status: number
}