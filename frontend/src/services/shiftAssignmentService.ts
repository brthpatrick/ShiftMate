import api from './api'
import type { ShiftAssignment, AssignEmployeeToShiftRequest } from '../types/shiftAssignment'

export const getShiftAssignments = async (): Promise<ShiftAssignment[]> => {
    const response = await api.get<ShiftAssignment[]>('/ShiftAssignments')

    return response.data
}

export const assignEmployeeToShift = async (
    request: AssignEmployeeToShiftRequest,
): Promise<ShiftAssignment> => {
    const response = await api.post<ShiftAssignment>('/ShiftAssignments', request)

    return response.data
}

export const cancelShiftAssignment = async (id: number): Promise<void> => {
    await api.delete(`/ShiftAssignments/${id}`)
}