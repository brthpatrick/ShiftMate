import api from './api'
import type { CreateRoleRequest, Role } from '../types/role'

export const getRoles = async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/Roles')

    return response.data
}

export const createRole = async (request: CreateRoleRequest,): Promise<Role> => {
    const response = await api.post<Role>('/Roles', request)

    return response.data
}