import { useEffect, useState } from 'react'
import { getEmployees } from '../services/employeeService'
import { getEmployeeWorkload } from '../services/employeeWorkloadService'
import type { Employee } from '../types/employee'
import type { EmployeeWorkload } from '../types/employeeWorkload'

const getErrorMessage = (error: any): string => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.response?.data?.errors?.[0] ||
        'An unexpected error occurred.'
    )
}

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
                setError(getErrorMessage(err))
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
            setError(getErrorMessage(err))
        } finally {
            setIsLoadingWorkload(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-500">
                    Loading employees...
                </p>
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

            <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                <label
                    htmlFor="employee"
                    className="mb-2 block text-sm font-medium text-gray-700"
                >
                    Select Employee
                </label>

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
                    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                >
                    <option value="">
                        Select employee
                    </option>

                    {employees
                        .filter((employee) => employee.isActive)
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

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

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

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <p className="text-sm text-gray-500">
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

                        <div className="rounded-xl bg-white p-6 shadow-sm">
                            <p className="text-sm text-gray-500">
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
                selectedEmployeeId === '' && (
                    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                        <p className="text-sm text-gray-500">
                            Select an employee to view their workload.
                        </p>
                    </div>
                )}
        </div>
    )
}

export default EmployeeWorkloadPage