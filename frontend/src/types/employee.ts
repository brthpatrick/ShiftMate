export interface Employee {
    id: number
    departmentId: number
    companyId: number
    firstName: string
    lastName: string
    email: string
    phone: string | null
    hireDate: string
    isActive: boolean
}

export interface CreateEmployeeRequest {
    firstName: string
    lastName: string
    email: string
    phone: string 
    departmentId: number
    hireDate: string
}

export interface UpdateEmployeeRequest {
    firstName: string
    lastName: string
    email: string
    phone: string
    departmentId: number
    hireDate: string
    isActive: boolean
}