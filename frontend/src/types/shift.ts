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