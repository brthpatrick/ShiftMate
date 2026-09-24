import { useEffect, useState } from 'react'
import { getEmployees } from '../services/employeeService'
import { getEmployeeWorkload } from '../services/employeeWorkloadService'
import type { Employee } from '../types/employee'
import type { EmployeeWorkload } from '../types/employeeWorkload'
import { getApiErrorMessage } from '../services/apiError'

function EmployeeWorkloadPage() {
    const [employees, setEmployees] = useState<Employee[]>([])

    const [selectedEmployeeId, setSelectedEmployeeId] =
        useState<number | ''>('')

    const [workload, setWorkload] =
        useState<EmployeeWorkload | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingWorkload, setIsLoadingWorkload] =
        useState(false)

    const [error, setError] = useState('')

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                setIsLoading(true)
                setError('')

                const data = await getEmployees()
                setEmployees(data)
            } catch (err) {
                setError(getApiErrorMessage(err))
            } finally {
                setIsLoading(false)
            }
        }

        loadEmployees()
    }, [])

    const handleEmployeeChange = async (
        employeeId: number | '',
    ) => {
        setSelectedEmployeeId(employeeId)
        setWorkload(null)
        setError('')

        if (employeeId === '') {
            return
        }

        try {
            setIsLoadingWorkload(true)

            const data = await getEmployeeWorkload(employeeId)
            setWorkload(data)
        } catch (err) {
            setError(getApiErrorMessage(err))
        } finally {
            setIsLoadingWorkload(false)
        }
    }

    const activeEmployees = employees.filter(
        (employee) => employee.isActive,
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-gray-500">
                    Loading employees...
                </p>
            </div>
        )
    }

    if (error && employees.length === 0) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Employee Workload
                </h1>

                <p className="mt-2 text-gray-500">
                    View the current shift workload of an employee.
                </p>
            </div>

            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Select Employee
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Choose an active employee to view their current
                        workload.
                    </p>
                </div>

                {activeEmployees.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
                        <p className="text-sm font-medium text-gray-700">
                            No active employees available.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Add or activate an employee to view workload
                            information.
                        </p>
                    </div>
                ) : (
                    <select
                        id="employee"
                        value={selectedEmployeeId}
                        onChange={(event) =>
                            handleEmployeeChange(
                                event.target.value === ''
                                    ? ''
                                    : Number(event.target.value),
                            )
                        }
                        disabled={isLoadingWorkload}
                        aria-label="Select employee"
                        className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                        <option value="">
                            Select employee
                        </option>

                        {activeEmployees.map((employee) => (
                            <option
                                key={employee.id}
                                value={employee.id}
                            >
                                {employee.firstName}{' '}
                                {employee.lastName}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {isLoadingWorkload && (
                <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                    <p className="text-sm text-gray-500">
                        Loading workload...
                    </p>
                </div>
            )}

            {!isLoadingWorkload && workload && (
                <>
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {workload.employeeName}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Current workload
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                            <p className="text-sm font-medium text-gray-500">
                                Assigned Shifts
                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {workload.assignedShiftCount}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                assigned shift
                                {workload.assignedShiftCount === 1
                                    ? ''
                                    : 's'}
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                            <p className="text-sm font-medium text-gray-500">
                                Scheduled Hours
                            </p>

                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {workload.scheduledHours}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                scheduled hour
                                {workload.scheduledHours === 1
                                    ? ''
                                    : 's'}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {!isLoadingWorkload &&
                workload === null &&
                selectedEmployeeId === '' &&
                activeEmployees.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                        <p className="text-sm font-medium text-gray-700">
                            Select an employee to view their workload.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            The assigned shift count and scheduled hours
                            will appear here.
                        </p>
                    </div>
                )}
        </div>
    )
}

export default EmployeeWorkloadPage