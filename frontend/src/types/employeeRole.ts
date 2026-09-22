export interface EmployeeRole {
    employeeId: number
    employeeName: string
    roleId: number
    roleName: string
}

export interface CreateEmployeeRoleRequest {
    employeeId: number
    roleId: number
}