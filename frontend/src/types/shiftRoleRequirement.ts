export interface ShiftRoleRequirement {
    id: number
    shiftId: number
    roleId: number
    roleName: string
    requiredEmployees: number
}

export interface CreateShiftRoleRequirementRequest {
    shiftId: number
    roleId: number
    requiredEmployees: number
}