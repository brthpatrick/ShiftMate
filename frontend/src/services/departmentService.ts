import api from './api'
import type {
    CreateDepartmentRequest,
    Department,
} from '../types/department'

export const getDepartments = async (): Promise<Department[]> => {
    const response = await api.get<Department[]>('/Departments')

    return response.data
}

export const createDepartment = async (
    request: CreateDepartmentRequest,
): Promise<Department> => {
    const response = await api.post<Department>(
        '/Departments',
        request,
    )

    return response.data
}