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

const getScoreClass = (score: number): string => {
    if (score >= 80) {
        return 'bg-green-100 text-green-700'
    }

    if (score >= 60) {
        return 'bg-blue-100 text-blue-700'
    }

    if (score >= 40) {
        return 'bg-yellow-100 text-yellow-700'
    }

    return 'bg-red-100 text-red-700'
}

const formatDateTime = (value: string): string => {
    return new Date(value).toLocaleString()
}

function SchedulingCandidatesPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [selectedShiftId, setSelectedShiftId] = useState<number | ''>('')
    const [candidates, setCandidates] = useState<
        SchedulingCandidate[]
    >([])

    const [loadingShifts, setLoadingShifts] = useState(true)
    const [loadingCandidates, setLoadingCandidates] =
        useState(false)

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
        setError('')
        setSuccess('')

        if (selectedShiftId === '') {
            setError('Please select a shift.')
            return
        }

        try {
            setLoadingCandidates(true)
            setCandidates([])

            const data =
                await getSchedulingCandidates(selectedShiftId)

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
                    Find and evaluate employees who can be
                    assigned to a shift.
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
                            onChange={(event) => {
                                setSelectedShiftId(
                                    event.target.value === ''
                                        ? ''
                                        : Number(
                                            event.target
                                                .value,
                                        ),
                                )
                                setCandidates([])
                                setError('')
                                setSuccess('')
                            }}
                            disabled={
                                loadingShifts ||
                                loadingCandidates ||
                                shifts.length === 0
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        >
                            <option value="">
                                {loadingShifts
                                    ? 'Loading shifts...'
                                    : shifts.length === 0
                                        ? 'No shifts available'
                                        : 'Select a shift'}
                            </option>

                            {shifts.map((shift) => (
                                <option
                                    key={shift.id}
                                    value={shift.id}
                                >
                                    #{shift.id} —{' '}
                                    {formatDateTime(
                                        shift.startTime,
                                    )}{' '}
                                    →{' '}
                                    {formatDateTime(
                                        shift.endTime,
                                    )}
                                </option>
                            ))}
                        </select>

                        {!loadingShifts && shifts.length === 0 && (
                            <p className="mt-2 text-xs text-slate-500">
                                Create a shift before searching for
                                scheduling candidates.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleFindCandidates}
                        disabled={
                            selectedShiftId === '' ||
                            loadingCandidates ||
                            loadingShifts
                        }
                        className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                    >
                        {loadingCandidates
                            ? 'Finding...'
                            : 'Find Candidates'}
                    </button>
                </div>

                {selectedShift && (
                    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-slate-800">
                                Selected Shift
                            </h2>
                        </div>

                        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-slate-500">
                                    Shift
                                </p>

                                <p className="mt-1 font-medium text-slate-800">
                                    #{selectedShift.id}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    Start
                                </p>

                                <p className="mt-1 font-medium text-slate-800">
                                    {formatDateTime(
                                        selectedShift.startTime,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    End
                                </p>

                                <p className="mt-1 font-medium text-slate-800">
                                    {formatDateTime(
                                        selectedShift.endTime,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    Required Employees
                                </p>

                                <p className="mt-1 font-medium text-slate-800">
                                    {
                                        selectedShift.requiredEmployees
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Candidates
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {candidates.length > 0
                                ? `${candidates.length} candidate${candidates.length === 1
                                    ? ''
                                    : 's'
                                } found`
                                : 'Employees ranked by scheduling suitability.'}
                        </p>
                    </div>
                </div>

                {loadingCandidates ? (
                    <div className="flex items-center justify-center px-6 py-12">
                        <p className="text-sm text-slate-500">
                            Finding suitable employees...
                        </p>
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-sm font-medium text-slate-700">
                            {selectedShiftId === ''
                                ? 'No shift selected.'
                                : 'No suitable candidates found.'}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            {selectedShiftId === ''
                                ? 'Select a shift above and click "Find Candidates".'
                                : 'No employees currently meet the eligibility requirements for this shift.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[950px] w-full text-left text-sm">
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
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                                            {
                                                candidate.employeeName
                                            }
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="font-semibold text-slate-800">
                                                {candidate.score}
                                            </span>

                                            <span className="text-slate-400">
                                                /100
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getScoreClass(
                                                    candidate.score,
                                                )}`}
                                            >
                                                {getScoreLabel(
                                                    candidate.score,
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            {candidate.roles?.length >
                                                0 ? (
                                                <div className="flex max-w-xs flex-wrap gap-1.5">
                                                    {candidate.roles.map(
                                                        (
                                                            role,
                                                        ) => (
                                                            <span
                                                                key={
                                                                    role
                                                                }
                                                                className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                                            >
                                                                {
                                                                    role
                                                                }
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

                                        <td className="max-w-sm px-6 py-4 text-slate-600">
                                            <span
                                                className="block max-w-sm truncate"
                                                title={
                                                    candidate.notes ||
                                                    undefined
                                                }
                                            >
                                                {candidate.notes ||
                                                    '—'}
                                            </span>
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