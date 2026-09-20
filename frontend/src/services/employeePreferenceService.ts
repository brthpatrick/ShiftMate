import api from './api'
import type {
    EmployeePreference,
    CreateEmployeePreferenceRequest,
} from '../types/employeePreference'

export const getEmployeePreferences = async (): Promise<
    EmployeePreference[]
> => {
    const response = await api.get<EmployeePreference[]>(
        '/EmployeePreferences',
    )
    return response.data
}

export const createEmployeePreference = async (
    request: CreateEmployeePreferenceRequest,
): Promise<EmployeePreference> => {
    const response = await api.post<EmployeePreference>(
        '/EmployeePreferences',
        request,
    )
    return response.data
}

export const updateEmployeePreference = async (
    employeeId: number,
    request: CreateEmployeePreferenceRequest,
): Promise<EmployeePreference> => {
    const response = await api.put<EmployeePreference>(
        `/EmployeePreferences/${employeeId}`,
        {
            maxWeeklyHours: request.maxWeeklyHours,
        },
    )

    return response.data
}

export const deleteEmployeePreference = async (
    employeeId: number,
): Promise<void> => {
    await api.delete(`/EmployeePreferences/${employeeId}`)
}