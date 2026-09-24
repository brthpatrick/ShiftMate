import { useEffect, useMemo, useState } from 'react'
import {
    createDepartment,
    getDepartments,
} from '../services/departmentService'
import type {
    CreateDepartmentRequest,
    Department,
} from '../types/department'
import { getApiErrorMessage } from '../services/apiError'

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [departmentName, setDepartmentName] = useState('')
    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadDepartments = async () => {
        try {
            setLoading(true)
            setError('')

            const data = await getDepartments()
            setDepartments(data)
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadDepartments()
    }, [])

    const filteredDepartments = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return departments
        }

        return departments.filter((department) =>
            department.name
                .toLowerCase()
                .includes(searchTerm),
        )
    }, [departments, search])

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault()

        setError('')
        setSuccess('')

        const trimmedName = departmentName.trim()

        if (!trimmedName) {
            setError('Department name is required.')
            return
        }

        try {
            setSaving(true)

            const request: CreateDepartmentRequest = {
                name: trimmedName,
            }

            await createDepartment(request)

            setDepartmentName('')

            setSuccess(
                'Department created successfully.',
            )

            await loadDepartments()
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Departments
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage the departments used by your company.
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
                        Add Department
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Create a department for organizing employees.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 md:flex-row"
                >
                    <div className="flex-1">
                        <label
                            htmlFor="department-name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Department Name
                        </label>

                        <input
                            id="department-name"
                            type="text"
                            value={departmentName}
                            onChange={(event) =>
                                setDepartmentName(
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. Sales"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                        >
                            {saving
                                ? 'Saving...'
                                : 'Add Department'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Departments
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredDepartments.length}{' '}
                            {filteredDepartments.length === 1
                                ? 'department'
                                : 'departments'}
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
                            placeholder="Search department..."
                            aria-label="Search department"
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
                            Loading departments...
                        </p>
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {departments.length === 0
                                ? 'No departments yet.'
                                : 'No departments match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {departments.length === 0
                                ? 'Create a department above to get started.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[500px] w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Department
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        ID
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredDepartments.map(
                                    (department) => (
                                        <tr
                                            key={department.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {
                                                    department.name
                                                }
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                                                {
                                                    department.id
                                                }
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