import api from './api'
import type {
    EmployeeDayPreference,
    CreateEmployeeDayPreferenceRequest,
} from '../types/employeeDayPreference'

export const getEmployeeDayPreferences = async (): Promise<
    EmployeeDayPreference[]
> => {
    const response = await api.get<EmployeeDayPreference[]>(
        '/EmployeeDayPreferences',
    )

    return response.data
}

export const getEmployeeDayPreferencesByEmployee = async (
    employeeId: number,
): Promise<EmployeeDayPreference[]> => {
    const response = await api.get<EmployeeDayPreference[]>(
        `/EmployeeDayPreferences/${employeeId}`,
    )

    return response.data
}

export const createEmployeeDayPreference = async (
    request: CreateEmployeeDayPreferenceRequest,
): Promise<EmployeeDayPreference> => {
    const response = await api.post<EmployeeDayPreference>(
        '/EmployeeDayPreferences',
        request,
    )

    return response.data
}

export const deleteEmployeeDayPreference = async (
    id: number,
): Promise<void> => {
    await api.delete(`/EmployeeDayPreferences/${id}`)
}