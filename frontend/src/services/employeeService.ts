import api from './api'
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee'

export const getEmployees = async (): Promise<Employee[]> => {
    const response = await api.get<Employee[]>('/Employees')

    return response.data
}

export const createEmployee = async (
    employee: CreateEmployeeRequest,
): Promise<Employee> => {
    const response = await api.post<Employee>(
        '/Employees',
        employee,
    )

    return response.data
}

export const updateEmployee = async (
    id: number,
    employee: UpdateEmployeeRequest,
): Promise<Employee> => {
    const response = await api.put<Employee>(
        `/Employees/${id}`,
        employee,
    )

    return response.data
}