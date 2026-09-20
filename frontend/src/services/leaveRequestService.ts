import api from './api'
import type {
    LeaveRequest,
    CreateLeaveRequest,
} from '../types/leaveRequest'

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const response = await api.get<LeaveRequest[]>('/LeaveRequests')
    return response.data
}

export const createLeaveRequest = async (
    request: CreateLeaveRequest,
): Promise<LeaveRequest> => {
    const response = await api.post<LeaveRequest>(
        '/LeaveRequests',
        request,
    )
    return response.data
}

export const approveLeaveRequest = async (
    id: number,
): Promise<LeaveRequest> => {
    const response = await api.patch<LeaveRequest>(
        `/LeaveRequests/${id}/approve`,
    )
    return response.data
}

export const rejectLeaveRequest = async (
    id: number,
): Promise<LeaveRequest> => {
    const response = await api.patch<LeaveRequest>(
        `/LeaveRequests/${id}/reject`,
    )
    return response.data
}