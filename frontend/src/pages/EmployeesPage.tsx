import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type {
    Employee,
    CreateEmployeeRequest,
    UpdateEmployeeRequest,
} from '../types/employee'
import type { Department } from '../types/department'
import {
    getEmployees,
    createEmployee,
    updateEmployee,
} from '../services/employeeService'
import { getDepartments } from '../services/departmentService'

interface EmployeeFormData {
    firstName: string
    lastName: string
    email: string
    phone: string
    departmentId: number
    hireDate: string
    isActive: boolean
}

const getDefaultFormData = (): EmployeeFormData => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: 0,
    hireDate: new Date()
        .toISOString()
        .split('T')[0],
    isActive: true,
})

function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [departments, setDepartments] = useState<Department[]>([])

    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingEmployee, setEditingEmployee] =
        useState<Employee | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [error, setError] = useState('')
    const [formError, setFormError] = useState('')

    const [formData, setFormData] =
        useState<EmployeeFormData>(getDefaultFormData())

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                setError('')

                const [employeesData, departmentsData] =
                    await Promise.all([
                        getEmployees(),
                        getDepartments(),
                    ])

                setEmployees(employeesData)
                setDepartments(departmentsData)
            } catch {
                setError(
                    'Failed to load employees and departments.',
                )
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    const filteredEmployees = employees.filter((employee) => {
        const fullName =
            `${employee.firstName} ${employee.lastName}`.toLowerCase()

        const email = employee.email.toLowerCase()

        const search = searchTerm.toLowerCase().trim()

        return (
            fullName.includes(search) ||
            email.includes(search)
        )
    })

    const handleFormChange = (
        field: keyof EmployeeFormData,
        value: string,
    ) => {
        setFormData((current) => ({
            ...current,
            [field]:
                field === 'departmentId'
                    ? Number(value)
                    : field === 'isActive'
                        ? value === 'true'
                        : value,
        }))
    }

    const resetForm = () => {
        setFormData(getDefaultFormData())
        setEditingEmployee(null)
        setFormError('')
    }

    const handleCreateEmployee = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        try {
            setIsSubmitting(true)
            setFormError('')

            if (formData.departmentId === 0) {
                setFormError('Please select a department.')
                return
            }

            const request: CreateEmployeeRequest = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                departmentId: formData.departmentId,
                hireDate: formData.hireDate,
            }

            await createEmployee(request)

            const updatedEmployees = await getEmployees()
            setEmployees(updatedEmployees)

            resetForm()
            setShowForm(false)
        } catch {
            setFormError(
                'Failed to create employee. Please check the entered data.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateEmployee = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        if (!editingEmployee) {
            return
        }

        try {
            setIsSubmitting(true)
            setFormError('')

            if (formData.departmentId === 0) {
                setFormError('Please select a department.')
                return
            }

            const request: UpdateEmployeeRequest = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                departmentId: formData.departmentId,
                hireDate: formData.hireDate,
                isActive: formData.isActive,
            }

            await updateEmployee(
                editingEmployee.id,
                request,
            )

            const updatedEmployees = await getEmployees()
            setEmployees(updatedEmployees)

            resetForm()
            setShowForm(false)
        } catch {
            setFormError(
                'Failed to update employee. Please check the entered data.',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        if (editingEmployee) {
            await handleUpdateEmployee(event)
        } else {
            await handleCreateEmployee(event)
        }
    }

    const handleAddEmployee = () => {
        resetForm()
        setShowForm(true)
    }

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee)

        setFormData({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone ?? '',
            departmentId: employee.departmentId,
            hireDate: employee.hireDate.split('T')[0],
            isActive: employee.isActive,
        })

        setFormError('')
        setShowForm(true)
    }

    const handleCancel = () => {
        resetForm()
        setShowForm(false)
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
                        Employees
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Manage your company's employees.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleAddEmployee}
                    className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
                >
                    + Add Employee
                </button>
            </div>

            {showForm && (
                <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editingEmployee
                                ? 'Edit Employee'
                                : 'Add Employee'}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {editingEmployee
                                ? 'Update employee information.'
                                : 'Create a new employee in your company.'}
                        </p>
                    </div>

                    {formError && (
                        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {formError}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="grid gap-5 md:grid-cols-2"
                    >
                        <div>
                            <label
                                htmlFor="firstName"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                First Name
                            </label>

                            <input
                                id="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={(event) =>
                                    handleFormChange(
                                        'firstName',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="lastName"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Last Name
                            </label>

                            <input
                                id="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={(event) =>
                                    handleFormChange(
                                        'lastName',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(event) =>
                                    handleFormChange(
                                        'email',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Phone
                            </label>

                            <input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(event) =>
                                    handleFormChange(
                                        'phone',
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="departmentId"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Department
                            </label>

                            <select
                                id="departmentId"
                                value={formData.departmentId}
                                onChange={(event) =>
                                    handleFormChange(
                                        'departmentId',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                <option value={0}>
                                    Select department
                                </option>

                                {departments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="hireDate"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Hire Date
                            </label>

                            <input
                                id="hireDate"
                                type="date"
                                value={formData.hireDate}
                                onChange={(event) =>
                                    handleFormChange(
                                        'hireDate',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        {editingEmployee && (
                            <div>
                                <label
                                    htmlFor="isActive"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Status
                                </label>

                                <select
                                    id="isActive"
                                    value={
                                        formData.isActive
                                            ? 'true'
                                            : 'false'
                                    }
                                    onChange={(event) =>
                                        handleFormChange(
                                            'isActive',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                >
                                    <option value="true">
                                        Active
                                    </option>
                                    <option value="false">
                                        Inactive
                                    </option>
                                </select>
                            </div>
                        )}

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
                                    ? editingEmployee
                                        ? 'Saving...'
                                        : 'Creating...'
                                    : editingEmployee
                                        ? 'Save Changes'
                                        : 'Create Employee'}
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
                    placeholder="Search employees..."
                    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-sm text-gray-500">
                                <th className="pb-3 pr-6 font-medium">
                                    Name
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Email
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Phone
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Hire Date
                                </th>

                                <th className="pb-3 pr-6 font-medium">
                                    Status
                                </th>

                                <th className="pb-3 font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredEmployees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    className="border-b last:border-b-0"
                                >
                                    <td className="py-4 pr-6 text-sm font-medium text-gray-900">
                                        {employee.firstName}{' '}
                                        {employee.lastName}
                                    </td>

                                    <td className="py-4 pr-6 text-sm text-gray-700">
                                        {employee.email}
                                    </td>

                                    <td className="py-4 pr-6 text-sm text-gray-700">
                                        {employee.phone ?? '—'}
                                    </td>

                                    <td className="py-4 pr-6 text-sm text-gray-700">
                                        {new Date(
                                            employee.hireDate,
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </td>

                                    <td className="py-4 pr-6 text-sm">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${employee.isActive
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {employee.isActive
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </td>

                                    <td className="py-4 text-sm">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEditEmployee(
                                                    employee,
                                                )
                                            }
                                            className="font-medium text-gray-700 transition hover:text-gray-900"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredEmployees.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-sm text-gray-500">
                            No employees found.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default EmployeesPage