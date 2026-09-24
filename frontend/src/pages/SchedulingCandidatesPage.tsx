import { useEffect, useState } from 'react'
import { getShifts } from '../services/shiftService'
import { getSchedulingCandidates } from '../services/schedulingCandidateService'
import type { Shift } from '../types/shift'
import type { SchedulingCandidate } from '../types/schedulingCandidate'
import { getApiErrorMessage } from '../services/apiError'

const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Moderate'
    return 'Low'
}

const formatDateTime = (value: string): string => {
    return new Date(value).toLocaleString()
}

function SchedulingCandidatesPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [selectedShiftId, setSelectedShiftId] = useState<number | ''>('')
    const [candidates, setCandidates] = useState<SchedulingCandidate[]>([])

    const [loadingShifts, setLoadingShifts] = useState(true)
    const [loadingCandidates, setLoadingCandidates] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        const loadShifts = async () => {
            try {
                setLoadingShifts(true)
                setError('')

                const data = await getShifts()
                setShifts(data)
            } catch (err) {
                setError(getApiErrorMessage(err))
            } finally {
                setLoadingShifts(false)
            }
        }

        loadShifts()
    }, [])

    const handleFindCandidates = async () => {
        if (selectedShiftId === '') {
            setError('Please select a shift.')
            return
        }

        try {
            setLoadingCandidates(true)
            setError('')
            setSuccess('')
            setCandidates([])

            const data = await getSchedulingCandidates(selectedShiftId)

            setCandidates(data)
            setSuccess(
                `Found ${data.length} scheduling candidate${data.length === 1 ? '' : 's'
                }.`,
            )
        } catch (err) {
            setError(getApiErrorMessage(err))
        } finally {
            setLoadingCandidates(false)
        }
    }

    const selectedShift = shifts.find(
        (shift) => shift.id === selectedShiftId,
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                    Scheduling Candidates
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Find and evaluate employees who can be assigned to a shift.
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                        <label
                            htmlFor="shift"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Select Shift
                        </label>

                        <select
                            id="shift"
                            value={selectedShiftId}
                            onChange={(e) => {
                                setSelectedShiftId(
                                    e.target.value === ''
                                        ? ''
                                        : Number(e.target.value),
                                )
                                setCandidates([])
                                setError('')
                                setSuccess('')
                            }}
                            disabled={loadingShifts}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">
                                {loadingShifts
                                    ? 'Loading shifts...'
                                    : 'Select a shift'}
                            </option>

                            {shifts.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                    #{shift.id} —{' '}
                                    {formatDateTime(shift.startTime)} →{' '}
                                    {formatDateTime(shift.endTime)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleFindCandidates}
                        disabled={
                            selectedShiftId === '' || loadingCandidates
                        }
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loadingCandidates
                            ? 'Finding...'
                            : 'Find Candidates'}
                    </button>
                </div>

                {selectedShift && (
                    <div className="mt-5 rounded-lg bg-slate-50 p-4">
                        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-slate-500">Shift</p>
                                <p className="font-medium text-slate-800">
                                    #{selectedShift.id}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Start</p>
                                <p className="font-medium text-slate-800">
                                    {formatDateTime(selectedShift.startTime)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">End</p>
                                <p className="font-medium text-slate-800">
                                    {formatDateTime(selectedShift.endTime)}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    Required Employees
                                </p>
                                <p className="font-medium text-slate-800">
                                    {selectedShift.requiredEmployees}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Candidates
                    </h2>
                </div>

                {loadingCandidates ? (
                    <div className="px-6 py-10 text-center text-sm text-slate-500">
                        Finding suitable employees...
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-slate-500">
                        Select a shift and click "Find Candidates".
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-600">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 font-medium text-slate-600">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 font-medium text-slate-600">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 font-medium text-slate-600">
                                        Roles
                                    </th>
                                    <th className="px-6 py-3 font-medium text-slate-600">
                                        Notes
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {candidates.map((candidate) => (
                                    <tr
                                        key={candidate.employeeId}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {candidate.employeeName}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-800">
                                                {candidate.score}
                                            </span>
                                            <span className="text-slate-400">
                                                /100
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                {getScoreLabel(
                                                    candidate.score,
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            {candidate.roles?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {candidate.roles.map(
                                                        (role) => (
                                                            <span
                                                                key={role}
                                                                className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                                                            >
                                                                {role}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">
                                                    No roles
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {candidate.notes || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SchedulingCandidatesPage