import { useEffect, useState } from 'react'
import type { Employee } from '../types/employee'
import type { Shift } from '../types/shift'
import type { LeaveRequest } from '../types/leaveRequest'
import type { ShiftAssignment } from '../types/shiftAssignment'
import {
    getEmployees,
    getShifts,
    getLeaveRequests,
    getShiftAssignments,
} from '../services/dashboardService'

function DashboardPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [shifts, setShifts] = useState<Shift[]>([])
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setIsLoading(true)
                setError('')

                const [
                    employeesData,
                    shiftsData,
                    leaveRequestsData,
                    assignmentsData,
                ] = await Promise.all([
                    getEmployees(),
                    getShifts(),
                    getLeaveRequests(),
                    getShiftAssignments(),
                ])

                setEmployees(employeesData)
                setShifts(shiftsData)
                setLeaveRequests(leaveRequestsData)
                setAssignments(assignmentsData)
            } catch {
                setError('Failed to load dashboard data.')
            } finally {
                setIsLoading(false)
            }
        }

        loadDashboard()
    }, [])

    const activeEmployees = employees.filter(
        (employee) => employee.isActive,
    ).length

    const pendingLeaveRequests = leaveRequests.filter(
        (request) => request.status === 'Pending',
    ).length

    const openShifts = shifts.filter((shift) => {
        const assignedCount = assignments.filter(
            (assignment) => assignment.shiftId === shift.id,
        ).length

        return assignedCount < shift.requiredEmployees
    }).length

    const upcomingShifts = shifts
        .filter((shift) => new Date(shift.startTime) >= new Date())
        .sort(
            (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime(),
        )
        .slice(0, 5)

    const today = new Date()

    const todaysAssignments = assignments
        .filter((assignment) => {
            const shiftDate = new Date(assignment.shiftStartTime)

            return (
                shiftDate.getFullYear() === today.getFullYear() &&
                shiftDate.getMonth() === today.getMonth() &&
                shiftDate.getDate() === today.getDate()
            )
        })
        .sort(
            (a, b) =>
                new Date(a.shiftStartTime).getTime() -
                new Date(b.shiftStartTime).getTime(),
        )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-500">
                    Loading dashboard...
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                </h1>

                <p className="mt-2 text-gray-500">
                    Overview of your workforce and schedule.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Active Employees
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {activeEmployees}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Total Shifts
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {shifts.length}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Pending Leave Requests
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {pendingLeaveRequests}
                    </p>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-500">
                        Open Shifts
                    </p>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {openShifts}
                    </p>
                </div>
            </div>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Upcoming Shifts
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Upcoming shifts and their current staffing status.
                    </p>
                </div>

                {upcomingShifts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
                        <p className="text-sm text-gray-500">
                            No upcoming shifts.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b text-sm text-gray-500">
                                    <th className="pb-3 pr-6 font-medium">
                                        Date
                                    </th>

                                    <th className="pb-3 pr-6 font-medium">
                                        Time
                                    </th>

                                    <th className="pb-3 pr-6 font-medium">
                                        Location
                                    </th>

                                    <th className="pb-3 pr-6 font-medium">
                                        Required
                                    </th>

                                    <th className="pb-3 font-medium">
                                        Assigned
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {upcomingShifts.map((shift) => {
                                    const assignedCount = assignments.filter(
                                        (assignment) =>
                                            assignment.shiftId === shift.id,
                                    ).length

                                    return (
                                        <tr
                                            key={shift.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="py-4 pr-6 text-sm text-gray-900">
                                                {new Date(
                                                    shift.startTime,
                                                ).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </td>

                                            <td className="py-4 pr-6 text-sm text-gray-700">
                                                {new Date(
                                                    shift.startTime,
                                                ).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}{' '}
                                                –{' '}
                                                {new Date(
                                                    shift.endTime,
                                                ).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>

                                            <td className="py-4 pr-6 text-sm text-gray-700">
                                                {shift.locationName}
                                            </td>

                                            <td className="py-4 pr-6 text-sm text-gray-700">
                                                {shift.requiredEmployees}
                                            </td>

                                            <td className="py-4 text-sm text-gray-700">
                                                {assignedCount}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Today's Schedule
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Employees assigned to today's shifts.
                    </p>
                </div>

                {todaysAssignments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 px-6 py-10 text-center">
                        <p className="text-sm text-gray-500">
                            No employees are scheduled for today.
                        </p>
                    </div>
                ) : (
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
                                        Time
                                    </th>

                                    <th className="pb-3 font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {todaysAssignments.map((assignment) => (
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

                                        <td className="py-4 pr-6 text-sm text-gray-700">
                                            {new Date(
                                                assignment.shiftStartTime,
                                            ).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}{' '}
                                            –{' '}
                                            {new Date(
                                                assignment.shiftEndTime,
                                            ).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>

                                        <td className="py-4 text-sm">
                                            <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                                                {assignment.status}
                                            </span>
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

export default DashboardPage