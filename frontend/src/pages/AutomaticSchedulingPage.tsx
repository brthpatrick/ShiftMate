import { useEffect, useState } from 'react'
import { getShifts } from '../services/shiftService'
import { runAutomaticScheduling } from '../services/automaticSchedulingService'
import type { Shift } from '../types/shift'
import type { AutomaticSchedulingResult } from '../types/automaticScheduling'
import { getApiErrorMessage } from '../services/apiError'

const formatDateTime = (value: string): string => {
    return new Date(value).toLocaleString()
}

const getStatusClasses = (status: string): string => {
    switch (status) {
        case 'Completed':
            return 'bg-green-50 text-green-700'

        case 'PartiallyCompleted':
            return 'bg-yellow-50 text-yellow-700'

        case 'Failed':
            return 'bg-red-50 text-red-700'

        case 'NoRequirements':
            return 'bg-gray-100 text-gray-700'

        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function AutomaticSchedulingPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [selectedShiftId, setSelectedShiftId] =
        useState<number | ''>('')

    const [result, setResult] =
        useState<AutomaticSchedulingResult | null>(null)

    const [loadingShifts, setLoadingShifts] = useState(true)
    const [isRunning, setIsRunning] = useState(false)

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

    const selectedShift = shifts.find(
        (shift) => shift.id === selectedShiftId,
    )

    const handleRunScheduling = async () => {
        setError('')
        setSuccess('')

        if (selectedShiftId === '') {
            setError('Please select a shift.')
            return
        }

        try {
            setIsRunning(true)
            setResult(null)

            const data = await runAutomaticScheduling(
                selectedShiftId,
            )

            setResult(data)

            if (data.status === 'Completed') {
                setSuccess(
                    'Automatic scheduling completed successfully.',
                )
            } else if (data.status === 'PartiallyCompleted') {
                setSuccess(
                    'Automatic scheduling completed partially.',
                )
            }
        } catch (err) {
            setError(getApiErrorMessage(err))
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                    Automatic Scheduling
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Automatically assign eligible employees to a shift.
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
                                        : Number(event.target.value),
                                )

                                setResult(null)
                                setError('')
                                setSuccess('')
                            }}
                            disabled={loadingShifts || isRunning}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    </div>

                    <button
                        type="button"
                        onClick={handleRunScheduling}
                        disabled={
                            selectedShiftId === '' ||
                            isRunning ||
                            loadingShifts
                        }
                        className="w-full rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                    >
                        {isRunning
                            ? 'Scheduling...'
                            : 'Run Automatic Scheduling'}
                    </button>
                </div>

                {shifts.length === 0 && !loadingShifts && !error && (
                    <div className="mt-5 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-700">
                            No shifts are available.
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Create a shift before running automatic
                            scheduling.
                        </p>
                    </div>
                )}

                {selectedShift && (
                    <div className="mt-5 rounded-lg bg-slate-50 p-4">
                        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-slate-500">
                                    Shift
                                </p>

                                <p className="font-medium text-slate-800">
                                    #{selectedShift.id}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    Start
                                </p>

                                <p className="font-medium text-slate-800">
                                    {formatDateTime(
                                        selectedShift.startTime,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    End
                                </p>

                                <p className="font-medium text-slate-800">
                                    {formatDateTime(
                                        selectedShift.endTime,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">
                                    Required Employees
                                </p>

                                <p className="font-medium text-slate-800">
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
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            {result && (
                <>
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Scheduling Result
                            </h2>

                            <span
                                className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                    result.status,
                                )}`}
                            >
                                {result.status}
                            </span>
                        </div>

                        <div className="p-6">
                            {result.assignedEmployees.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-sm font-medium text-slate-700">
                                        No employees were assigned.
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        The scheduling process did not
                                        find an employee to assign.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px] text-left text-sm">
                                        <thead className="border-b border-slate-200 bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 font-medium text-slate-600">
                                                    Employee
                                                </th>

                                                <th className="px-6 py-3 font-medium text-slate-600">
                                                    Role
                                                </th>

                                                <th className="px-6 py-3 font-medium text-slate-600">
                                                    Score
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {result.assignedEmployees.map(
                                                (employee) => (
                                                    <tr
                                                        key={`${employee.employeeId}-${employee.roleId}`}
                                                        className="hover:bg-slate-50"
                                                    >
                                                        <td className="px-6 py-4 font-medium text-slate-800">
                                                            {
                                                                employee.employeeName
                                                            }
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                                                {
                                                                    employee.roleName
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-4">
                                                            <span className="font-semibold text-slate-800">
                                                                {
                                                                    employee.score
                                                                }
                                                            </span>

                                                            <span className="text-slate-400">
                                                                /100
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {result.missingRequirements.length > 0 && (
                        <div className="rounded-xl border border-yellow-200 bg-white shadow-sm">
                            <div className="border-b border-yellow-200 px-6 py-4">
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Missing Requirements
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Some required roles could not be
                                    fully staffed.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[500px] text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-slate-600">
                                                Role
                                            </th>

                                            <th className="px-6 py-3 font-medium text-slate-600">
                                                Missing Employees
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {result.missingRequirements.map(
                                            (requirement) => (
                                                <tr
                                                    key={requirement.roleId}
                                                    className="hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4 font-medium text-slate-800">
                                                        {
                                                            requirement.roleName
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 text-yellow-700">
                                                        {
                                                            requirement.missingEmployees
                                                        }
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default AutomaticSchedulingPage