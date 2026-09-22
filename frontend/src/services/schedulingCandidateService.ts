import api from './api'
import type { SchedulingCandidate } from '../types/schedulingCandidate'

export const getSchedulingCandidates = async (
    shiftId: number,
): Promise<SchedulingCandidate[]> => {
    const response = await api.get<SchedulingCandidate[]>(
        `/SchedulingCandidates/shift/${shiftId}`,
    )

    return response.data
}