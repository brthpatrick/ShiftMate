import api from './api'
import type { Location } from '../types/location'

export const getLocations = async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/Location')

    return response.data
}