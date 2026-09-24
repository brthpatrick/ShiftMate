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

const getErrorMessage = (error: any): string => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.response?.data?.errors?.[0] ||
        'An unexpected error occurred.'
    )
}

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
                setError(getErrorMessage(err))
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
    }

    const handleCreate = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

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
            setFormError('')
            setError('')
            setSuccess('')

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

            resetForm()
            setSuccess(
                'Shift role requirement created successfully.',
            )
        } catch (err) {
            setFormError(getErrorMessage(err))
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
            setError(getErrorMessage(err))
        } finally {
            setDeletingId(null)
        }
    }

    const filteredRequirements = requirements.filter(
        (requirement) => {
            const shift = shifts.find(
                (item) => item.id === requirement.shiftId,
            )

            const search = searchTerm
                .toLowerCase()
                .trim()

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-500">
                    Loading shift role requirements...
                </p>
            </div>
        )
    }

    if (error && requirements.length === 0) {
        return (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-red-600">
                {error}
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Shift Role Requirements
                </h1>

                <p className="mt-2 text-gray-500">
                    Define which roles and how many employees are
                    required for each shift.
                </p>
            </div>

            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
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
                    <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                        {formError}
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                        {success}
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
                                            event.target.value,
                                        ),
                                )
                            }
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                        >
                            <option value="">
                                Select shift
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
                                            event.target.value,
                                        ),
                                )
                            }
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
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
                                    Number(event.target.value),
                                )
                            }
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                        />
                    </div>

                    <div className="flex gap-3 md:col-span-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? 'Creating...'
                                : 'Add Requirement'}
                        </button>

                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                    placeholder="Search by shift or role..."
                    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-sm text-gray-500">
                                <th className="pb-3 pr-6 font-medium">
                                    Shift
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Role
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Required Employees
                                </th>

                                <th className="pb-3 font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRequirements.map(
                                (requirement) => {
                                    const shift = shifts.find(
                                        (item) =>
                                            item.id ===
                                            requirement.shiftId,
                                    )

                                    return (
                                        <tr
                                            key={requirement.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="py-4 pr-6">
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

                                            <td className="py-4 pr-6">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                                    {
                                                        requirement.roleName
                                                    }
                                                </span>
                                            </td>

                                            <td className="py-4 pr-6 text-sm text-gray-700">
                                                {
                                                    requirement.requiredEmployees
                                                }
                                            </td>

                                            <td className="py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            requirement.id,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        requirement.id
                                                    }
                                                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                {filteredRequirements.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-sm text-gray-500">
                            No shift role requirements found.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ShiftRoleRequirementsPage