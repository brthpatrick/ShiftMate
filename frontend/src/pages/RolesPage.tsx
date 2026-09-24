import { useEffect, useMemo, useState } from 'react'
import {
    createRole,
    getRoles,
} from '../services/roleService'
import type {
    CreateRoleRequest,
    Role,
} from '../types/role'
import { getApiErrorMessage } from '../services/apiError'

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])

    const [roleName, setRoleName] = useState('')
    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadRoles = async () => {
        try {
            setLoading(true)
            setError('')

            const data = await getRoles()

            setRoles(data)
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadRoles()
    }, [])

    const filteredRoles = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return roles
        }

        return roles.filter((role) =>
            role.name.toLowerCase().includes(searchTerm),
        )
    }, [roles, search])

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault()

        setError('')
        setSuccess('')

        const trimmedName = roleName.trim()

        if (!trimmedName) {
            setError('Role name is required.')
            return
        }

        try {
            setSaving(true)

            const request: CreateRoleRequest = {
                name: trimmedName,
            }

            await createRole(request)

            setRoleName('')
            setSuccess('Role created successfully.')

            await loadRoles()
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
                    Roles
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage the roles used for employee scheduling.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Add Role
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Create a role that can be assigned to employees.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 sm:flex-row sm:items-end"
                >
                    <div className="flex-1">
                        <label
                            htmlFor="role-name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Role Name
                        </label>

                        <input
                            id="role-name"
                            type="text"
                            value={roleName}
                            onChange={(event) =>
                                setRoleName(event.target.value)
                            }
                            placeholder="e.g. Cashier"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        {saving
                            ? 'Saving...'
                            : 'Add Role'}
                    </button>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Roles
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredRoles.length}{' '}
                            {filteredRoles.length === 1
                                ? 'role'
                                : 'roles'}
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
                            placeholder="Search role..."
                            aria-label="Search roles"
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
                            Loading roles...
                        </p>
                    </div>
                ) : filteredRoles.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {roles.length === 0
                                ? 'No roles yet.'
                                : 'No roles match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {roles.length === 0
                                ? 'Add a role above to get started.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[500px] w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Role
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        ID
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredRoles.map((role) => (
                                    <tr
                                        key={role.id}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                            {role.name}
                                        </td>

                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                                            {role.id}
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