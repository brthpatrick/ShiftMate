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