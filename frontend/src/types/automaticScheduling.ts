export interface AssignedEmployee {
    employeeId: number
    employeeName: string
    roleId: number
    roleName: string
    score: number
}

export interface MissingRequirement {
    roleId: number
    roleName: string
    missingEmployees: number
}

export interface AutomaticSchedulingResult {
    shiftId: number
    status: string
    assignedEmployees: AssignedEmployee[]
    missingRequirements: MissingRequirement[]
}