import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
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

function getErrorMessage(error: unknown): string {
    const axiosError = error as AxiosError<
        | string
        | {
            message?: string
            title?: string
            errors?: Record<string, string[]>
        }
    >

    const data = axiosError.response?.data

    if (typeof data === 'string' && data.trim()) {
        return data
    }

    if (data && typeof data === 'object') {
        if ('message' in data && data.message) {
            return data.message
        }

        if ('title' in data && data.title) {
            return data.title
        }

        if ('errors' in data && data.errors) {
            const firstError = Object.values(data.errors)
                .flat()
                .find((message) => message)

            if (firstError) {
                return firstError
            }
        }
    }

    return 'An unexpected error occurred.'
}

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
    return new Date(date).toLocaleDateString()
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
            setError(getErrorMessage(error))
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
            request.employeeName.toLowerCase().includes(searchTerm),
        )
    }, [leaveRequests, search])

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!selectedEmployeeId) {
            setError('Please select an employee.')
            return
        }

        if (!startDate || !endDate) {
            setError('Please select both start and end date.')
            return
        }

        if (endDate < startDate) {
            setError('End date must be later than or equal to start date.')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

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
            setError(getErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id)
            setError('')
            setSuccess('')

            await approveLeaveRequest(id)

            setSuccess('Leave request approved.')

            await loadData()
        } catch (error) {
            setError(getErrorMessage(error))
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id: number) => {
        try {
            setProcessingId(id)
            setError('')
            setSuccess('')

            await rejectLeaveRequest(id)

            setSuccess('Leave request rejected.')

            await loadData()
        } catch (error) {
            setError(getErrorMessage(error))
        } finally {
            setProcessingId(null)
        }
    }

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
                <h2 className="text-lg font-semibold text-gray-900">
                    Create Leave Request
                </h2>

                <form
                    onSubmit={handleCreate}
                    className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Employee
                        </label>

                        <select
                            value={selectedEmployeeId}
                            onChange={(event) =>
                                setSelectedEmployeeId(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Select employee</option>

                            {employees
                                .filter((employee) => employee.isActive)
                                .map((employee) => (
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
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Start Date
                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            End Date
                        </label>

                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) =>
                                setEndDate(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Reason
                        </label>

                        <input
                            type="text"
                            value={reason}
                            onChange={(event) =>
                                setReason(event.target.value)
                            }
                            placeholder="Optional reason"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'Creating...'
                                : 'Create Leave Request'}
                        </button>
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
                            {filteredLeaveRequests.length} request
                            {filteredLeaveRequests.length !== 1
                                ? 's'
                                : ''}
                        </p>
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search employee..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none md:w-64"
                    />
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-gray-500">
                        Loading leave requests...
                    </div>
                ) : filteredLeaveRequests.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        No leave requests found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
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
                                {filteredLeaveRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                            {request.employeeName}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                            {formatDate(request.startDate)}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                            {formatDate(request.endDate)}
                                        </td>

                                        <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                            {request.reason || '-'}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                                    request.status,
                                                )}`}
                                            >
                                                {request.status}
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
                                                            processingId ===
                                                            request.id
                                                        }
                                                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleReject(
                                                                request.id,
                                                            )
                                                        }
                                                        disabled={
                                                            processingId ===
                                                            request.id
                                                        }
                                                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">
                                                    No actions
                                                </span>
                                            )}
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