import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import {
    createDepartment,
    getDepartments,
} from '../services/departmentService'
import type {
    CreateDepartmentRequest,
    Department,
} from '../types/department'

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
            setError(getErrorMessage(error))
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

        const trimmedName = departmentName.trim()

        if (!trimmedName) {
            setError('Department name is required.')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

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
            setError(getErrorMessage(error))
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
                <h2 className="text-lg font-semibold text-gray-900">
                    Add Department
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-5 flex flex-col gap-4 md:flex-row"
                >
                    <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Department Name
                        </label>

                        <input
                            type="text"
                            value={departmentName}
                            onChange={(event) =>
                                setDepartmentName(
                                    event.target.value,
                                )
                            }
                            placeholder="e.g. Sales"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                            department
                            {filteredDepartments.length !== 1
                                ? 's'
                                : ''}
                        </p>
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search department..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none md:w-64"
                    />
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-gray-500">
                        Loading departments...
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        No departments found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
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
                                            key={
                                                department.id
                                            }
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