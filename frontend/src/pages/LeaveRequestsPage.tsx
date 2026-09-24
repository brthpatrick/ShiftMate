import { useEffect, useMemo, useState } from 'react'
import {
    approveLeaveRequest,
    createLeaveRequest,
    getLeaveRequests,
    rejectLeaveRequest,
} from '../services/leaveRequestService'
import { getEmployees } from '../services/employeeService'
import type { Employee } from '../types/employee'
import type {
    CreateLeaveRequest,
    LeaveRequest,
} from '../types/leaveRequest'
import { getApiErrorMessage } from '../services/apiError'

function getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-700'
        case 'approved':
            return 'bg-green-100 text-green-700'
        case 'rejected':
            return 'bg-red-100 text-red-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export default function LeaveRequestsPage() {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')

    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [processingAction, setProcessingAction] =
        useState<'approve' | 'reject' | null>(null)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [leaveData, employeeData] = await Promise.all([
                getLeaveRequests(),
                getEmployees(),
            ])

            setLeaveRequests(leaveData)
            setEmployees(employeeData)
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredLeaveRequests = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return leaveRequests
        }

        return leaveRequests.filter((request) =>
            request.employeeName
                .toLowerCase()
                .includes(searchTerm),
        )
    }, [leaveRequests, search])

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault()

        setError('')
        setSuccess('')

        if (!selectedEmployeeId) {
            setError('Please select an employee.')
            return
        }

        if (!startDate || !endDate) {
            setError('Please select both start and end date.')
            return
        }

        if (endDate < startDate) {
            setError(
                'End date must be later than or equal to start date.',
            )
            return
        }

        try {
            setSaving(true)

            const request: CreateLeaveRequest = {
                employeeId: Number(selectedEmployeeId),
                startDate,
                endDate,
                reason: reason.trim(),
            }

            await createLeaveRequest(request)

            setSuccess('Leave request created successfully.')

            setSelectedEmployeeId('')
            setStartDate('')
            setEndDate('')
            setReason('')

            await loadData()
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id)
            setProcessingAction('approve')
            setError('')
            setSuccess('')

            await approveLeaveRequest(id)

            setSuccess('Leave request approved.')

            await loadData()
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setProcessingId(null)
            setProcessingAction(null)
        }
    }

    const handleReject = async (id: number) => {
        try {
            setProcessingId(id)
            setProcessingAction('reject')
            setError('')
            setSuccess('')

            await rejectLeaveRequest(id)

            setSuccess('Leave request rejected.')

            await loadData()
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setProcessingId(null)
            setProcessingAction(null)
        }
    }

    const activeEmployees = employees.filter(
        (employee) => employee.isActive,
    )

    const isProcessing = processingId !== null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Leave Requests
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage employee leave requests and approvals.
                </p>
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

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Create Leave Request
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Create a leave period for an active employee.
                    </p>
                </div>

                <form
                    onSubmit={handleCreate}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                    <div>
                        <label
                            htmlFor="leave-employee"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Employee
                        </label>

                        <select
                            id="leave-employee"
                            value={selectedEmployeeId}
                            onChange={(event) =>
                                setSelectedEmployeeId(
                                    event.target.value,
                                )
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">
                                Select employee
                            </option>

                            {activeEmployees.map((employee) => (
                                <option
                                    key={employee.id}
                                    value={employee.id}
                                >
                                    {employee.firstName}{' '}
                                    {employee.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="leave-start-date"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Start Date
                        </label>

                        <input
                            id="leave-start-date"
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(event.target.value)
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="leave-end-date"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            End Date
                        </label>

                        <input
                            id="leave-end-date"
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(event) =>
                                setEndDate(event.target.value)
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="leave-reason"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Reason
                        </label>

                        <input
                            id="leave-reason"
                            type="text"
                            value={reason}
                            onChange={(event) =>
                                setReason(event.target.value)
                            }
                            placeholder="Optional reason"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4">
                        <button
                            type="submit"
                            disabled={
                                saving ||
                                activeEmployees.length === 0
                            }
                            className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {saving
                                ? 'Creating...'
                                : 'Create Leave Request'}
                        </button>

                        {activeEmployees.length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                No active employees are available for a
                                leave request.
                            </p>
                        )}
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Leave Requests
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredLeaveRequests.length}{' '}
                            {filteredLeaveRequests.length === 1
                                ? 'request'
                                : 'requests'}
                            {search.trim()
                                ? ' matching your search'
                                : ''}
                        </p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search employee..."
                            aria-label="Search employee"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400 transition hover:text-gray-700"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-10">
                        <p className="text-sm text-gray-500">
                            Loading leave requests...
                        </p>
                    </div>
                ) : filteredLeaveRequests.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {leaveRequests.length === 0
                                ? 'No leave requests yet.'
                                : 'No leave requests match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {leaveRequests.length === 0
                                ? 'Create a leave request above to get started.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1000px] w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Employee
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Start Date
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        End Date
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Reason
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredLeaveRequests.map(
                                    (request) => {
                                        const isCurrentRequestProcessing =
                                            processingId === request.id

                                        return (
                                            <tr
                                                key={request.id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {
                                                        request.employeeName
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                    {formatDate(
                                                        request.startDate,
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                    {formatDate(
                                                        request.endDate,
                                                    )}
                                                </td>

                                                <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                                    <span
                                                        className="block max-w-xs truncate"
                                                        title={
                                                            request.reason ||
                                                            undefined
                                                        }
                                                    >
                                                        {request.reason ||
                                                            '—'}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                                            request.status,
                                                        )}`}
                                                    >
                                                        {
                                                            request.status
                                                        }
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                    {request.status.toLowerCase() ===
                                                        'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApprove(
                                                                        request.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isCurrentRequestProcessing &&
                                                                    processingAction ===
                                                                    'approve'
                                                                    ? 'Approving...'
                                                                    : 'Approve'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleReject(
                                                                        request.id,
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing
                                                                }
                                                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isCurrentRequestProcessing &&
                                                                    processingAction ===
                                                                    'reject'
                                                                    ? 'Rejecting...'
                                                                    : 'Reject'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            No actions
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}