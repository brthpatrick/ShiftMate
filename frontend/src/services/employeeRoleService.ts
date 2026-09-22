import api from './api'
import type { CreateEmployeeRoleRequest, EmployeeRole } from '../types/employeeRole'

export const getEmployeeRoles = async (): Promise<EmployeeRole[]> => {
    const response = await api.get<EmployeeRole[]>('/EmployeeRoles')

    return response.data
}

export const createEmployeeRole = async (request: CreateEmployeeRoleRequest): Promise<EmployeeRole> => {
    const response = await api.post<EmployeeRole>('/EmployeeRoles', request)

    return response.data
}

export const deleteEmployeeRole = async (employeeId: number, roleId: number): Promise<void> => {
    await api.delete(`/EmployeeRoles/${employeeId}/${roleId}`)
}
