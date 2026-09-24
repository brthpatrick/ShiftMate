import { useEffect, useMemo, useState } from 'react'
import {
    createEmployeeRole,
    deleteEmployeeRole,
    getEmployeeRoles,
} from '../services/employeeRoleService'
import { getEmployees } from '../services/employeeService'
import { getRoles } from '../services/roleService'
import type { Employee } from '../types/employee'
import type { Role } from '../types/role'
import type {
    CreateEmployeeRoleRequest,
    EmployeeRole,
} from '../types/employeeRole'
import { getApiErrorMessage } from '../services/apiError'

export default function EmployeeRolesPage() {
    const [employeeRoles, setEmployeeRoles] = useState<EmployeeRole[]>(
        [],
    )
    const [employees, setEmployees] = useState<Employee[]>([])
    const [roles, setRoles] = useState<Role[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
    const [selectedRoleId, setSelectedRoleId] = useState('')

    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingKey, setDeletingKey] = useState<string | null>(
        null,
    )

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [employeeRoleData, employeeData, roleData] =
                await Promise.all([
                    getEmployeeRoles(),
                    getEmployees(),
                    getRoles(),
                ])

            setEmployeeRoles(employeeRoleData)
            setEmployees(employeeData)
            setRoles(roleData)
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredEmployeeRoles = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return employeeRoles
        }

        return employeeRoles.filter(
            (employeeRole) =>
                employeeRole.employeeName
                    .toLowerCase()
                    .includes(searchTerm) ||
                employeeRole.roleName
                    .toLowerCase()
                    .includes(searchTerm),
        )
    }, [employeeRoles, search])

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault()

        if (!selectedEmployeeId) {
            setError('Please select an employee.')
            return
        }

        if (!selectedRoleId) {
            setError('Please select a role.')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const request: CreateEmployeeRoleRequest = {
                employeeId: Number(selectedEmployeeId),
                roleId: Number(selectedRoleId),
            }

            await createEmployeeRole(request)

            setSelectedEmployeeId('')
            setSelectedRoleId('')

            setSuccess(
                'Employee role assigned successfully.',
            )

            await loadData()
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (
        employeeId: number,
        roleId: number,
    ) => {
        const key = `${employeeId}-${roleId}`

        try {
            setDeletingKey(key)
            setError('')
            setSuccess('')

            await deleteEmployeeRole(employeeId, roleId)

            setEmployeeRoles((current) =>
                current.filter(
                    (employeeRole) =>
                        !(
                            employeeRole.employeeId === employeeId &&
                            employeeRole.roleId === roleId
                        ),
                ),
            )

            setSuccess(
                'Employee role removed successfully.',
            )
        } catch (error) {
            setError(getApiErrorMessage(error))
        } finally {
            setDeletingKey(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Employee Roles
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Assign roles to employees for shift scheduling.
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
                    Assign Role
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Employee
                        </label>

                        <select
                            value={selectedEmployeeId}
                            onChange={(event) =>
                                setSelectedEmployeeId(
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">
                                Select employee
                            </option>

                            {employees
                                .filter(
                                    (employee) =>
                                        employee.isActive,
                                )
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
                            Role
                        </label>

                        <select
                            value={selectedRoleId}
                            onChange={(event) =>
                                setSelectedRoleId(
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">
                                Select role
                            </option>

                            {roles.map((role) => (
                                <option
                                    key={role.id}
                                    value={role.id}
                                >
                                    {role.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : 'Assign Role'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Assigned Roles
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredEmployeeRoles.length} assignment
                            {filteredEmployeeRoles.length !== 1
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
                        placeholder="Search employee or role..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none md:w-72"
                    />
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-gray-500">
                        Loading employee roles...
                    </div>
                ) : filteredEmployeeRoles.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        No employee roles found.
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
                                        Role
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredEmployeeRoles.map(
                                    (employeeRole) => {
                                        const key = `${employeeRole.employeeId}-${employeeRole.roleId}`

                                        return (
                                            <tr key={key}>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {
                                                        employeeRole.employeeName
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                    {
                                                        employeeRole.roleName
                                                    }
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                employeeRole.employeeId,
                                                                employeeRole.roleId,
                                                            )
                                                        }
                                                        disabled={
                                                            deletingKey ===
                                                            key
                                                        }
                                                        className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingKey ===
                                                            key
                                                            ? 'Removing...'
                                                            : 'Remove'}
                                                    </button>
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