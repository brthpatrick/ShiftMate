import api from './api'
import type { Department } from '../types/department'

export const getDepartments = async (): Promise<Department[]> => {
    const response = await api.get<Department[]>('/Departments')

    return response.data
}