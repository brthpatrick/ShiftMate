import api from './api'
import type { EmployeeWorkload } from '../types/employeeWorkload'

export const getEmployeeWorkload = async (
    employeeId: number,
): Promise<EmployeeWorkload> => {
    const response = await api.get<EmployeeWorkload>(
        `/EmployeeWorkload/${employeeId}`,
    )

    return response.data
}