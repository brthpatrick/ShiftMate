import api from './api'
import type {
    ShiftRoleRequirement,
    CreateShiftRoleRequirementRequest,
} from '../types/shiftRoleRequirement'

export const getShiftRoleRequirements = async (): Promise<
    ShiftRoleRequirement[]
> => {
    const response = await api.get<ShiftRoleRequirement[]>(
        '/ShiftRoleRequirements',
    )

    return response.data
}

export const createShiftRoleRequirement = async (
    request: CreateShiftRoleRequirementRequest,
): Promise<ShiftRoleRequirement> => {
    const response = await api.post<ShiftRoleRequirement>(
        '/ShiftRoleRequirements',
        request,
    )

    return response.data
}

export const deleteShiftRoleRequirement = async (
    id: number,
): Promise<void> => {
    await api.delete(`/ShiftRoleRequirements/${id}`)
}