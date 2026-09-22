export interface Role {
    id: number
    companyId: number
    name: string
}

export interface CreateRoleRequest {
    name: string
}