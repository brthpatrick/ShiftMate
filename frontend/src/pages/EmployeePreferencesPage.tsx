import { useEffect, useMemo, useState } from 'react'
import {
    createEmployeePreference,
    deleteEmployeePreference,
    getEmployeePreferences,
    updateEmployeePreference,
} from '../services/employeePreferenceService'
import { getEmployees } from '../services/employeeService'
import type { Employee } from '../types/employee'
import type {
    CreateEmployeePreferenceRequest,
    EmployeePreference,
} from '../types/employeePreference'
import { getApiErrorMessage } from '../services/apiError'

export default function EmployeePreferencesPage() {
    const [preferences, setPreferences] = useState<EmployeePreference[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
    const [maxWeeklyHours, setMaxWeeklyHours] = useState('40')
    const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
        null,
    )

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
                getEmployeePreferences(),
                getEmployees(),
            ])

            setPreferences(preferenceData)
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

    const filteredPreferences = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return preferences
        }

        return preferences.filter((preference) =>
            preference.employeeName
                .toLowerCase()
                .includes(searchTerm),
        )
    }, [preferences, search])

    const availableEmployees = useMemo(() => {
        const configuredEmployeeIds = new Set(
            preferences.map((preference) => preference.employeeId),
        )

        return employees.filter(
            (employee) =>
                employee.isActive &&
                (
                    !configuredEmployeeIds.has(employee.id) ||
                    employee.id === editingEmployeeId
                ),
        )
    }, [employees, preferences, editingEmployeeId])

    const handleEdit = (preference: EmployeePreference) => {
        setEditingEmployeeId(preference.employeeId)
        setSelectedEmployeeId(String(preference.employeeId))
        setMaxWeeklyHours(
            preference.maxWeeklyHours !== null
                ? String(preference.maxWeeklyHours)
                : '',
        )
        setError('')
        setSuccess('')
    }

    const handleCancelEdit = () => {
        setEditingEmployeeId(null)
        setSelectedEmployeeId('')
        setMaxWeeklyHours('40')
        setError('')
        setSuccess('')
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        setError('')
        setSuccess('')

        if (!selectedEmployeeId) {
            setError('Please select an employee.')
            return
        }

        const hours = Number(maxWeeklyHours)

        if (!Number.isFinite(hours) || hours <= 0) {
            setError('Maximum weekly hours must be greater than 0.')
            return
        }

        try {
            setSaving(true)

            const request: CreateEmployeePreferenceRequest = {
                employeeId: Number(selectedEmployeeId),
                maxWeeklyHours: hours,
            }

            if (editingEmployeeId !== null) {
                await updateEmployeePreference(
                    editingEmployeeId,
                    request,
                )

                setSuccess('Employee preference updated successfully.')
            } else {
                await createEmployeePreference(request)

                setSuccess('Employee preference created successfully.')
            }

            setSelectedEmployeeId('')
            setMaxWeeklyHours('40')
            setEditingEmployeeId(null)

            await loadData()
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (employeeId: number) => {
        try {
            setDeletingId(employeeId)
            setError('')
            setSuccess('')

            await deleteEmployeePreference(employeeId)

            setPreferences((current) =>
                current.filter(
                    (preference) =>
                        preference.employeeId !== employeeId,
                ),
            )

            if (editingEmployeeId === employeeId) {
                setEditingEmployeeId(null)
                setSelectedEmployeeId('')
                setMaxWeeklyHours('40')
            }

            setSuccess('Employee preference deleted successfully.')
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Employee Preferences
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Configure employee-specific scheduling preferences.
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
                        {editingEmployeeId !== null
                            ? 'Edit Employee Preference'
                            : 'Add Employee Preference'}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Set the maximum number of hours an employee can be
                        scheduled per week.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    <div>
                        <label
                            htmlFor="employee-preference-employee"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Employee
                        </label>

                        <select
                            id="employee-preference-employee"
                            value={selectedEmployeeId}
                            onChange={(event) =>
                                setSelectedEmployeeId(event.target.value)
                            }
                            disabled={
                                editingEmployeeId !== null ||
                                saving
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">
                                Select employee
                            </option>

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
                        <label
                            htmlFor="max-weekly-hours"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Maximum Weekly Hours
                        </label>

                        <input
                            id="max-weekly-hours"
                            type="number"
                            min="1"
                            step="0.5"
                            value={maxWeeklyHours}
                            onChange={(event) =>
                                setMaxWeeklyHours(event.target.value)
                            }
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                            Enter a value greater than 0 hours.
                        </p>
                    </div>

                    <div className="flex flex-col justify-end gap-2 sm:flex-row">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : editingEmployeeId !== null
                                    ? 'Update Preference'
                                    : 'Add Preference'}
                        </button>

                        {editingEmployeeId !== null && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Employee Preferences
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredPreferences.length}{' '}
                            {filteredPreferences.length === 1
                                ? 'preference'
                                : 'preferences'}
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
                            Loading preferences...
                        </p>
                    </div>
                ) : filteredPreferences.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {preferences.length === 0
                                ? 'No employee preferences yet.'
                                : 'No preferences match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {preferences.length === 0
                                ? 'Add an employee preference above to get started.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[650px] w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Employee
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Maximum Weekly Hours
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredPreferences.map(
                                    (preference) => (
                                        <tr
                                            key={preference.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {
                                                    preference.employeeName
                                                }
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {
                                                    preference.maxWeeklyHours
                                                }{' '}
                                                hours
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                preference,
                                                            )
                                                        }
                                                        disabled={
                                                            saving ||
                                                            deletingId !==
                                                            null
                                                        }
                                                        className="font-medium text-blue-600 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                preference.employeeId,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId !==
                                                            null
                                                        }
                                                        className="font-medium text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingId ===
                                                            preference.employeeId
                                                            ? 'Deleting...'
                                                            : 'Delete'}
                                                    </button>
                                                </div>
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