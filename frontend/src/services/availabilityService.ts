import api from './api'
import type {
    Availability,
    CreateAvailabilityRequest,
} from '../types/availability'

export const getAvailabilities = async (): Promise<Availability[]> => {
    const response = await api.get<Availability[]>('/Availabilities')
    return response.data
}

export const getEmployeeAvailabilities = async (
    employeeId: number,
): Promise<Availability[]> => {
    const response = await api.get<Availability[]>(
        `/Availabilities/employee/${employeeId}`,
    )
    return response.data
}

export const createAvailability = async (
    availability: CreateAvailabilityRequest,
): Promise<Availability> => {
    const response = await api.post<Availability>(
        '/Availabilities',
        availability,
    )
    return response.data
}

export const deleteAvailability = async (
    id: number,
): Promise<void> => {
    await api.delete(`/Availabilities/${id}`)
}