export interface Department {
    id: number
    name: string
    companyId: number
}

export interface CreateDepartmentRequest {
    name: string
}