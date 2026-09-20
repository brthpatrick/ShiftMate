import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import {
    createEmployeeDayPreference,
    deleteEmployeeDayPreference,
    getEmployeeDayPreferences,
} from '../services/employeeDayPreferenceService'
import { getEmployees } from '../services/employeeService'
import type { Employee } from '../types/employee'
import type {
    CreateEmployeeDayPreferenceRequest,
    EmployeeDayPreference,
} from '../types/employeeDayPreference'

const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
]

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

function getDayName(dayOfWeek: number): string {
    return (
        daysOfWeek.find((day) => day.value === dayOfWeek)?.label ??
        'Unknown'
    )
}

export default function EmployeeDayPreferencesPage() {
    const [preferences, setPreferences] = useState<EmployeeDayPreference[]>(
        [],
    )
    const [employees, setEmployees] = useState<Employee[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
    const [selectedDay, setSelectedDay] = useState('')
    const [isPreferred, setIsPreferred] = useState(false)
    const [isUnavailable, setIsUnavailable] = useState(false)

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

            const [preferenceData, employeeData] = await Promise.all([
                getEmployeeDayPreferences(),
                getEmployees(),
            ])

            setPreferences(preferenceData)
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

    const filteredPreferences = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return preferences
        }

        return preferences.filter((preference) =>
            preference.employeeName.toLowerCase().includes(searchTerm),
        )
    }, [preferences, search])

    const availableEmployees = useMemo(() => {
        const configuredEmployeeDayPairs = new Set(
            preferences.map(
                (preference) =>
                    `${preference.employeeId}-${preference.dayOfWeek}`,
            ),
        )

        if (!selectedEmployeeId || selectedDay === '') {
            return employees.filter((employee) => employee.isActive)
        }

        return employees.filter(
            (employee) =>
                employee.isActive &&
                (
                    employee.id === Number(selectedEmployeeId) ||
                    !configuredEmployeeDayPairs.has(
                        `${employee.id}-${Number(selectedDay)}`,
                    )
                ),
        )
    }, [employees, preferences, selectedEmployeeId, selectedDay])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!selectedEmployeeId) {
            setError('Please select an employee.')
            return
        }

        if (selectedDay === '') {
            setError('Please select a day.')
            return
        }

        if (!isPreferred && !isUnavailable) {
            setError(
                'Please select Preferred or Unavailable.',
            )
            return
        }

        if (isPreferred && isUnavailable) {
            setError(
                'A day cannot be both Preferred and Unavailable.',
            )
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const request: CreateEmployeeDayPreferenceRequest = {
                employeeId: Number(selectedEmployeeId),
                dayOfWeek: Number(selectedDay),
                isPreferred,
                isUnavailable,
            }

            await createEmployeeDayPreference(request)

            setSuccess(
                'Employee day preference created successfully.',
            )

            setSelectedEmployeeId('')
            setSelectedDay('')
            setIsPreferred(false)
            setIsUnavailable(false)

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

            await deleteEmployeeDayPreference(id)

            setPreferences((current) =>
                current.filter((preference) => preference.id !== id),
            )

            setSuccess(
                'Employee day preference deleted successfully.',
            )
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
                    Employee Day Preferences
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Configure preferred and unavailable days for employees.
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
                    Add Employee Day Preference
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4"
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

                            {availableEmployees.map((employee) => (
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
                            value={selectedDay}
                            onChange={(event) =>
                                setSelectedDay(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">Select day</option>

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

                    <div className="flex flex-col justify-end gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isPreferred}
                                onChange={(event) => {
                                    setIsPreferred(event.target.checked)

                                    if (event.target.checked) {
                                        setIsUnavailable(false)
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                            />

                            Preferred
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={isUnavailable}
                                onChange={(event) => {
                                    setIsUnavailable(event.target.checked)

                                    if (event.target.checked) {
                                        setIsPreferred(false)
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                            />

                            Unavailable
                        </label>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : 'Add Preference'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Employee Day Preferences
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredPreferences.length} preference
                            {filteredPreferences.length !== 1
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
                        Loading preferences...
                    </div>
                ) : filteredPreferences.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        No employee day preferences found.
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
                                        Preference
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredPreferences.map((preference) => (
                                    <tr key={preference.id}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                            {preference.employeeName}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                            {getDayName(
                                                preference.dayOfWeek,
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            {preference.isUnavailable ? (
                                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                                                    Unavailable
                                                </span>
                                            ) : preference.isPreferred ? (
                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                    Preferred
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">
                                                    None
                                                </span>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        preference.id,
                                                    )
                                                }
                                                disabled={
                                                    deletingId ===
                                                    preference.id
                                                }
                                                className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {deletingId ===
                                                    preference.id
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </button>
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