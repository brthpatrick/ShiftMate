import api from './api'
import type {
    Shift,
    CreateShiftRequest,
    UpdateShiftStatusRequest,
} from '../types/shift'

export const getShifts = async (): Promise<Shift[]> => {
    const response = await api.get<Shift[]>('/Shifts')

    return response.data
}

export const createShift = async (
    shift: CreateShiftRequest,
): Promise<Shift> => {
    const response = await api.post<Shift>(
        '/Shifts',
        shift,
    )

    return response.data
}

export const updateShiftStatus = async (
    id: number,
    request: UpdateShiftStatusRequest,
): Promise<Shift> => {
    const response = await api.patch<Shift>(
        `/Shifts/${id}/status`,
        request,
    )

    return response.data
}