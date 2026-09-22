import api from './api'
import type { AutomaticSchedulingResult } from '../types/automaticScheduling'

export const runAutomaticScheduling = async (
    shiftId: number,
): Promise<AutomaticSchedulingResult> => {
    const response = await api.post<AutomaticSchedulingResult>(
        `/AutomaticScheduling/shift/${shiftId}`,
    )

    return response.data
}