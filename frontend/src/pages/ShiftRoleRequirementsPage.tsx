import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getShifts } from '../services/shiftService'
import { getRoles } from '../services/roleService'
import {
    getShiftRoleRequirements,
    createShiftRoleRequirement,
    deleteShiftRoleRequirement,
} from '../services/shiftRoleRequirementService'
import type { Shift } from '../types/shift'
import type { Role } from '../types/role'
import type { ShiftRoleRequirement } from '../types/shiftRoleRequirement'
import { getApiErrorMessage } from '../services/apiError'

const formatDateTime = (value: string): string => {
    return new Date(value).toLocaleString()
}

function ShiftRoleRequirementsPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [requirements, setRequirements] = useState<
        ShiftRoleRequirement[]
    >([])

    const [shiftId, setShiftId] = useState<number | ''>('')
    const [roleId, setRoleId] = useState<number | ''>('')
    const [requiredEmployees, setRequiredEmployees] = useState(1)

    const [searchTerm, setSearchTerm] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const [error, setError] = useState('')
    const [formError, setFormError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                setError('')

                const [
                    shiftsData,
                    rolesData,
                    requirementsData,
                ] = await Promise.all([
                    getShifts(),
                    getRoles(),
                    getShiftRoleRequirements(),
                ])

                setShifts(shiftsData)
                setRoles(rolesData)
                setRequirements(requirementsData)
            } catch (err) {
                setError(getApiErrorMessage(err))
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    const resetForm = () => {
        setShiftId('')
        setRoleId('')
        setRequiredEmployees(1)
        setFormError('')
        setSuccess('')
    }

    const handleCreate = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        setFormError('')
        setError('')
        setSuccess('')

        if (shiftId === '') {
            setFormError('Please select a shift.')
            return
        }

        if (roleId === '') {
            setFormError('Please select a role.')
            return
        }

        if (requiredEmployees < 1) {
            setFormError(
                'Required employees must be at least 1.',
            )
            return
        }

        try {
            setIsSubmitting(true)

            const created =
                await createShiftRoleRequirement({
                    shiftId,
                    roleId,
                    requiredEmployees,
                })

            setRequirements((current) => [
                ...current,
                created,
            ])

            setShiftId('')
            setRoleId('')
            setRequiredEmployees(1)

            setSuccess(
                'Shift role requirement created successfully.',
            )
        } catch (err) {
            setFormError(getApiErrorMessage(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id)
            setError('')
            setSuccess('')

            await deleteShiftRoleRequirement(id)

            setRequirements((current) =>
                current.filter(
                    (requirement) => requirement.id !== id,
                ),
            )

            setSuccess(
                'Shift role requirement deleted successfully.',
            )
        } catch (err) {
            setError(getApiErrorMessage(err))
        } finally {
            setDeletingId(null)
        }
    }

    const handleClearSearch = () => {
        setSearchTerm('')
    }

    const filteredRequirements = requirements.filter(
        (requirement) => {
            const shift = shifts.find(
                (item) => item.id === requirement.shiftId,
            )

            const search = searchTerm
                .toLowerCase()
                .trim()

            if (!search) {
                return true
            }

            const roleName =
                requirement.roleName.toLowerCase()

            const shiftText = shift
                ? `shift ${shift.id} ${formatDateTime(
                    shift.startTime,
                )}`.toLowerCase()
                : `shift ${requirement.shiftId}`

            return (
                roleName.includes(search) ||
                shiftText.includes(search)
            )
        },
    )

    const isDeleting = deletingId !== null

    if (isLoading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-gray-500">
                    Loading shift role requirements...
                </p>
            </div>
        )
    }

    if (error && requirements.length === 0) {
        return (
            <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
                {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Shift Role Requirements
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Define which roles and how many employees are
                    required for each shift.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Add Requirement
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Example: assign one Waiter requirement to
                        Shift #17.
                    </p>
                </div>

                {formError && (
                    <div
                        role="alert"
                        aria-live="polite"
                        className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {formError}
                    </div>
                )}

                <form
                    onSubmit={handleCreate}
                    className="grid gap-5 md:grid-cols-3"
                >
                    <div>
                        <label
                            htmlFor="shiftId"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Shift
                        </label>

                        <select
                            id="shiftId"
                            value={shiftId}
                            onChange={(event) =>
                                setShiftId(
                                    event.target.value === ''
                                        ? ''
                                        : Number(
                                            event.target
                                                .value,
                                        ),
                                )
                            }
                            disabled={
                                isSubmitting ||
                                isDeleting ||
                                shifts.length === 0
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">
                                {shifts.length === 0
                                    ? 'No shifts available'
                                    : 'Select shift'}
                            </option>

                            {shifts.map((shift) => (
                                <option
                                    key={shift.id}
                                    value={shift.id}
                                >
                                    #{shift.id} —{' '}
                                    {formatDateTime(
                                        shift.startTime,
                                    )}
                                </option>
                            ))}
                        </select>

                        {shifts.length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                Create a shift before adding a role
                                requirement.
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="roleId"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Role
                        </label>

                        <select
                            id="roleId"
                            value={roleId}
                            onChange={(event) =>
                                setRoleId(
                                    event.target.value === ''
                                        ? ''
                                        : Number(
                                            event.target
                                                .value,
                                        ),
                                )
                            }
                            disabled={
                                isSubmitting ||
                                isDeleting ||
                                roles.length === 0
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        >
                            <option value="">
                                {roles.length === 0
                                    ? 'No roles available'
                                    : 'Select role'}
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

                        {roles.length === 0 && (
                            <p className="mt-2 text-xs text-gray-500">
                                Create a role before adding a role
                                requirement.
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="requiredEmployees"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Required Employees
                        </label>

                        <input
                            id="requiredEmployees"
                            type="number"
                            min="1"
                            value={requiredEmployees}
                            onChange={(event) =>
                                setRequiredEmployees(
                                    Number(
                                        event.target.value,
                                    ),
                                )
                            }
                            required
                            disabled={
                                isSubmitting || isDeleting
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row md:col-span-3">
                        <button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                isDeleting ||
                                shifts.length === 0 ||
                                roles.length === 0
                            }
                            className="w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {isSubmitting
                                ? 'Creating...'
                                : 'Add Requirement'}
                        </button>

                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={
                                isSubmitting || isDeleting
                            }
                            className="w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Requirements
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredRequirements.length}{' '}
                            {filteredRequirements.length === 1
                                ? 'requirement'
                                : 'requirements'}
                            {searchTerm.trim()
                                ? ' matching your search'
                                : ''}
                        </p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value,
                                )
                            }
                            placeholder="Search by shift or role..."
                            aria-label="Search shift role requirements"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400 transition hover:text-gray-700"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {filteredRequirements.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {requirements.length === 0
                                ? 'No shift role requirements yet.'
                                : 'No requirements match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {requirements.length === 0
                                ? 'Add a requirement above to define the staffing needs of a shift.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[850px] w-full text-left">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200 text-sm text-gray-500">
                                    <th className="px-6 py-3 font-medium">
                                        Shift
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Role
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Required Employees
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {filteredRequirements.map(
                                    (requirement) => {
                                        const shift = shifts.find(
                                            (item) =>
                                                item.id ===
                                                requirement.shiftId,
                                        )

                                        return (
                                            <tr
                                                key={
                                                    requirement.id
                                                }
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        Shift #
                                                        {
                                                            requirement.shiftId
                                                        }
                                                    </div>

                                                    {shift && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            {
                                                                shift.locationName
                                                            }{' '}
                                                            ·{' '}
                                                            {formatDateTime(
                                                                shift.startTime,
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                        {
                                                            requirement.roleName
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {
                                                        requirement.requiredEmployees
                                                    }
                                                </td>

                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                requirement.id,
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting ||
                                                            isSubmitting
                                                        }
                                                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingId ===
                                                            requirement.id
                                                            ? 'Deleting...'
                                                            : 'Delete'}
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

export default ShiftRoleRequirementsPage