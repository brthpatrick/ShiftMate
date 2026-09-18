import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import {
    createAvailability,
    deleteAvailability,
    getAvailabilities,
} from '../services/availabilityService'
import { getEmployees } from '../services/employeeService'
import type { Availability } from '../types/availability'
import type { Employee } from '../types/employee'

const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
]

function getDayName(dayOfWeek: number): string {
    return (
        daysOfWeek.find((day) => day.value === dayOfWeek)?.label ??
        'Unknown'
    )
}

function getErrorMessage(error: unknown): string {
    const axiosError = error as AxiosError<{ message?: string }>

    return (
        axiosError.response?.data?.message ??
        'An unexpected error occurred.'
    )
}

export default function AvailabilityPage() {
    const [availabilities, setAvailabilities] = useState<Availability[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
    const [dayOfWeek, setDayOfWeek] = useState('1')
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('16:00')
    const [isAvailable, setIsAvailable] = useState(true)

    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [availabilityData, employeeData] = await Promise.all([
                getAvailabilities(),
                getEmployees(),
            ])

            setAvailabilities(availabilityData)
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

    const filteredAvailabilities = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return availabilities
        }

        return availabilities.filter((availability) =>
            availability.employeeName
                .toLowerCase()
                .includes(searchTerm),
        )
    }, [availabilities, search])

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!selectedEmployeeId) {
            setError('Please select an employee.')
            return
        }

        if (!startTime || !endTime) {
            setError('Please enter both start and end time.')
            return
        }

        if (endTime <= startTime) {
            setError('End time must be later than start time.')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            await createAvailability({
                employeeId: Number(selectedEmployeeId),
                dayOfWeek: Number(dayOfWeek),
                startTime: `${startTime}:00`,
                endTime: `${endTime}:00`,
                isAvailable,
            })

            setSuccess('Availability created successfully.')

            setSelectedEmployeeId('')
            setDayOfWeek('1')
            setStartTime('08:00')
            setEndTime('16:00')
            setIsAvailable(true)

            await loadData()
        } catch (error) {
            setError(getErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id)
            setError('')
            setSuccess('')

            await deleteAvailability(id)

            setAvailabilities((current) =>
                current.filter((availability) => availability.id !== id),
            )

            setSuccess('Availability deleted successfully.')
        } catch (error) {
            setError(getErrorMessage(error))
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Availability
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage employee availability for shift scheduling.
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
                    Add Availability
                </h2>

                <form
                    onSubmit={handleCreate}
                    className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                            Day
                        </label>

                        <select
                            value={dayOfWeek}
                            onChange={(event) =>
                                setDayOfWeek(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            {daysOfWeek.map((day) => (
                                <option
                                    key={day.value}
                                    value={day.value}
                                >
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Availability
                        </label>

                        <select
                            value={isAvailable ? 'true' : 'false'}
                            onChange={(event) =>
                                setIsAvailable(
                                    event.target.value === 'true',
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="true">Available</option>
                            <option value="false">Unavailable</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Start Time
                        </label>

                        <input
                            type="time"
                            value={startTime}
                            onChange={(event) =>
                                setStartTime(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            End Time
                        </label>

                        <input
                            type="time"
                            value={endTime}
                            onChange={(event) =>
                                setEndTime(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Add Availability'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Employee Availability
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {filteredAvailabilities.length} availability
                            record
                            {filteredAvailabilities.length !== 1
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
                        Loading availability...
                    </div>
                ) : filteredAvailabilities.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        No availability records found.
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
                                        Day
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Start
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        End
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredAvailabilities.map(
                                    (availability) => (
                                        <tr key={availability.id}>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {
                                                    availability.employeeName
                                                }
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {getDayName(
                                                    availability.dayOfWeek,
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {availability.startTime}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {availability.endTime}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${availability.isAvailable
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                >
                                                    {availability.isAvailable
                                                        ? 'Available'
                                                        : 'Unavailable'}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            availability.id,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        availability.id
                                                    }
                                                    className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingId ===
                                                        availability.id
                                                        ? 'Deleting...'
                                                        : 'Delete'}
                                                </button>
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
    )
}