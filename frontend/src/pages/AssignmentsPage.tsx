import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ShiftAssignment, AssignEmployeeToShiftRequest } from '../types/shiftAssignment'
import type { Employee } from '../types/employee'
import type { Shift } from '../types/shift'
import { getShiftAssignments, assignEmployeeToShift } from '../services/shiftAssignmentService'
import { getEmployees } from '../services/employeeService'
import { getShifts } from '../services/shiftService'
import { getApiErrorMessage } from '../services/apiError'


interface AssignmentFormData {
    shiftId: number
    employeeId: number
}

const getDefaultFormData = (): AssignmentFormData => ({
    shiftId: 0,
    employeeId: 0,
})

function getStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
        case 'assigned':
            return 'bg-blue-50 text-blue-700'
        case 'cancelled':
            return 'bg-red-50 text-red-700'
        case 'completed':
            return 'bg-green-50 text-green-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function AssignmentsPage() {
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])

    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [error, setError] = useState('')
    const [formError, setFormError] = useState('')

    const [formData, setFormData] =
        useState<AssignmentFormData>(getDefaultFormData())

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                setError('')

                const [
                    assignmentsData,
                    employeesData,
                    shiftsData,
                ] = await Promise.all([
                    getShiftAssignments(),
                    getEmployees(),
                    getShifts(),
                ])

                setAssignments(assignmentsData)
                setEmployees(employeesData)
                setShifts(shiftsData)
            } catch (error) {
                setError(getApiErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    const filteredAssignments = assignments.filter((assignment) => {
        const employeeName =
            assignment.employeeName.toLowerCase()

        const locationName =
            assignment.locationName.toLowerCase()

        const search =
            searchTerm.toLowerCase().trim()

        return (
            employeeName.includes(search) ||
            locationName.includes(search)
        )
    })

    const handleFormChange = (
        field: keyof AssignmentFormData,
        value: string,
    ) => {
        setFormData((current) => ({
            ...current,
            [field]: Number(value),
        }))
    }

    const handleAssignEmployee = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        setFormError('')

        if (formData.shiftId === 0) {
            setFormError('Please select a shift.')
            return
        }

        if (formData.employeeId === 0) {
            setFormError('Please select an employee.')
            return
        }

        try {
            setIsSubmitting(true)

            const request: AssignEmployeeToShiftRequest = {
                shiftId: formData.shiftId,
                employeeId: formData.employeeId,
            }

            await assignEmployeeToShift(request)

            const updatedAssignments =
                await getShiftAssignments()

            setAssignments(updatedAssignments)

            setFormData(getDefaultFormData())
            setShowForm(false)
        } catch (error) {
            setFormError(getApiErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        setFormData(getDefaultFormData())
        setFormError('')
        setShowForm(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-500">
                    Loading assignments...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-red-600">
                {error}
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Assignments
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Manage employee shift assignments.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setFormData(getDefaultFormData())
                        setFormError('')
                        setShowForm(true)
                    }}
                    className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                    + Assign Employee
                </button>
            </div>

            {showForm && (
                <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Assign Employee
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Assign an eligible employee to a shift.
                        </p>
                    </div>

                    {formError && (
                        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {formError}
                        </div>
                    )}

                    <form
                        onSubmit={handleAssignEmployee}
                        className="grid gap-5 md:grid-cols-2"
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
                                value={formData.shiftId}
                                onChange={(event) =>
                                    handleFormChange(
                                        'shiftId',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                <option value={0}>
                                    Select shift
                                </option>

                                {shifts.map((shift) => (
                                    <option
                                        key={shift.id}
                                        value={shift.id}
                                    >
                                        {new Date(
                                            shift.startTime,
                                        ).toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            },
                                        )}{' '}
                                        —{' '}
                                        {shift.locationName}{' '}
                                        (
                                        {new Date(
                                            shift.startTime,
                                        ).toLocaleTimeString(
                                            'en-US',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        )}{' '}
                                        -
                                        {' '}
                                        {new Date(
                                            shift.endTime,
                                        ).toLocaleTimeString(
                                            'en-US',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        )}
                                        )
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="employeeId"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Employee
                            </label>

                            <select
                                id="employeeId"
                                value={formData.employeeId}
                                onChange={(event) =>
                                    handleFormChange(
                                        'employeeId',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                <option value={0}>
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

                        <div className="flex gap-3 md:col-span-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? 'Assigning...'
                                    : 'Assign Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                    placeholder="Search by employee or location..."
                    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-sm text-gray-500">
                                <th className="pb-3 pr-6 font-medium">
                                    Employee
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Location
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Date
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Time
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Assigned At
                                </th>

                                <th className="pb-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAssignments.map(
                                (assignment) => (
                                    <tr
                                        key={assignment.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="py-4 pr-6 text-sm font-medium text-gray-900">
                                            {assignment.employeeName}
                                        </td>

                                        <td className="py-4 pr-6 text-sm text-gray-700">
                                            {assignment.locationName}
                                        </td>

                                        <td className="py-4 pr-6 text-sm text-gray-900">
                                            {new Date(
                                                assignment.shiftStartTime,
                                            ).toLocaleDateString(
                                                'en-US',
                                                {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                },
                                            )}
                                        </td>

                                        <td className="py-4 pr-6 text-sm text-gray-700">
                                            {new Date(
                                                assignment.shiftStartTime,
                                            ).toLocaleTimeString(
                                                'en-US',
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                },
                                            )}{' '}
                                            –{' '}
                                            {new Date(
                                                assignment.shiftEndTime,
                                            ).toLocaleTimeString(
                                                'en-US',
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                },
                                            )}
                                        </td>

                                        <td className="py-4 pr-6 text-sm text-gray-700">
                                            {new Date(
                                                assignment.assignedAt,
                                            ).toLocaleString(
                                                'en-US',
                                                {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                },
                                            )}
                                        </td>

                                        <td className="py-4 text-sm">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                    assignment.status,
                                                )}`}
                                            >
                                                {
                                                    assignment.status
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredAssignments.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-sm text-gray-500">
                            No assignments found.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AssignmentsPage