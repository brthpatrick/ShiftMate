import api from './api'
import type {
    CreateLocationRequest,
    Location,
} from '../types/location'

export const getLocations = async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/Location')

    return response.data
}

export const createLocation = async (
    request: CreateLocationRequest,
): Promise<Location> => {
    const response = await api.post<Location>(
        '/Location',
        request,
    )

    return response.data
}