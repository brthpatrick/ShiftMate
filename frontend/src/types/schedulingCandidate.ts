export interface SchedulingCandidate {
    employeeId: number
    employeeName: string
    score: number
    roles: string[]
    notes: string | null
}