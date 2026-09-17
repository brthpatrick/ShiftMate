import api from './api'
import type { Employee } from '../types/employee'
import type { Shift } from '../types/shift'
import type { LeaveRequest } from '../types/leaveRequest'
import type { ShiftAssignment } from '../types/shiftAssignment'

export const getEmployees = async (): Promise<Employee[]> => {
    const response = await api.get<Employee[]>('/Employees')

    return response.data
}

export const getShifts = async (): Promise<Shift[]> => {
    const response = await api.get<Shift[]>('/Shifts')

    return response.data
}

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const response = await api.get<LeaveRequest[]>('/LeaveRequests')

    return response.data
}

export const getShiftAssignments = async (): Promise<ShiftAssignment[]> => {
    const response = await api.get<ShiftAssignment[]>('/ShiftAssignments')

    return response.data
}