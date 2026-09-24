import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Shift, CreateShiftRequest } from '../types/shift'
import type { Location } from '../types/location'
import { getShifts, createShift, updateShiftStatus } from '../services/shiftService'
import { getLocations } from '../services/locationService'
import { getApiErrorMessage } from '../services/apiError'


interface ShiftFormData {
    locationId: number
    startTime: string
    endTime: string
    requiredEmployees: number
    notes: string
}

const getDefaultFormData = (): ShiftFormData => ({
    locationId: 0,
    startTime: '',
    endTime: '',
    requiredEmployees: 1,
    notes: '',
})

function getStatusLabel(status: number): string {
    switch (status) {
        case 0:
            return 'Draft'
        case 1:
            return 'Open'
        case 2:
            return 'Scheduled'
        case 3:
            return 'In Progress'
        case 4:
            return 'Completed'
        case 5:
            return 'Cancelled'
        default:
            return 'Unknown'
    }
}

function getStatusClasses(status: number): string {
    switch (status) {
        case 0:
            return 'bg-gray-100 text-gray-700'
        case 1:
            return 'bg-blue-50 text-blue-700'
        case 2:
            return 'bg-purple-50 text-purple-700'
        case 3:
            return 'bg-yellow-50 text-yellow-700'
        case 4:
            return 'bg-green-50 text-green-700'
        case 5:
            return 'bg-red-50 text-red-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

function getAvailableStatuses(status: number): number[] {
    switch (status) {
        case 0:
            return [1, 5]
        case 1:
            return [2, 5]
        case 2:
            return [3, 5]
        case 3:
            return [4]
        default:
            return []
    }
}

function ShiftsPage() {
    const [shifts, setShifts] = useState<Shift[]>([])
    const [locations, setLocations] = useState<Location[]>([])

    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [error, setError] = useState('')
    const [formError, setFormError] = useState('')

    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)
    const [statusUpdateError, setStatusUpdateError] = useState('')

    const [formData, setFormData] =
        useState<ShiftFormData>(getDefaultFormData())

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true)
                setError('')

                const [shiftsData, locationsData] =
                    await Promise.all([
                        getShifts(),
                        getLocations(),
                    ])

                setShifts(shiftsData)
                setLocations(locationsData)
            } catch (error) {
                setError(getApiErrorMessage(error))
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    const filteredShifts = shifts
        .filter((shift) => {
            const locationName =
                shift.locationName.toLowerCase()

            const notes =
                shift.notes?.toLowerCase() ?? ''

            const search =
                searchTerm.toLowerCase().trim()

            return (
                locationName.includes(search) ||
                notes.includes(search)
            )
        })
        .sort(
            (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime(),
        )

    const handleFormChange = (
        field: keyof ShiftFormData,
        value: string,
    ) => {
        setFormData((current) => ({
            ...current,
            [field]:
                field === 'locationId' ||
                    field === 'requiredEmployees'
                    ? Number(value)
                    : value,
        }))
    }

    const handleCreateShift = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault()

        try {
            setIsSubmitting(true)
            setFormError('')

            if (formData.locationId === 0) {
                setFormError('Please select a location.')
                return
            }

            if (formData.requiredEmployees < 1) {
                setFormError(
                    'Required employees must be at least 1.',
                )
                return
            }

            if (!formData.startTime || !formData.endTime) {
                setFormError(
                    'Start time and end time are required.',
                )
                return
            }

            if (
                new Date(formData.endTime) <=
                new Date(formData.startTime)
            ) {
                setFormError(
                    'End time must be after start time.',
                )
                return
            }

            const request: CreateShiftRequest = {
                locationId: formData.locationId,
                startTime: `${formData.startTime}:00`,
                endTime: `${formData.endTime}:00`,
                requiredEmployees: formData.requiredEmployees,
                notes: formData.notes.trim(),
            }

            await createShift(request)

            const updatedShifts = await getShifts()
            setShifts(updatedShifts)

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

    const handleStatusChange = async (
        shiftId: number,
        newStatus: number,
    ) => {
        try {
            setStatusUpdatingId(shiftId)
            setStatusUpdateError('')

            const updatedShift = await updateShiftStatus(
                shiftId,
                { status: newStatus },
            )

            setShifts((current) =>
                current.map((shift) =>
                    shift.id === updatedShift.id ? updatedShift : shift,
                ),
            )
        } catch (error) {
            setStatusUpdateError(getApiErrorMessage(error))
        } finally {
            setStatusUpdatingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-gray-500">
                    Loading shifts...
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
                        Shifts
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Manage your company's shifts and schedule.
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
                    + Add Shift
                </button>
            </div>

            {showForm && (
                <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Add Shift
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Create a new shift for your company.
                        </p>
                    </div>

                    {formError && (
                        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {formError}
                        </div>
                    )}

                    <form
                        onSubmit={handleCreateShift}
                        className="grid gap-5 md:grid-cols-2"
                    >
                        <div>
                            <label
                                htmlFor="locationId"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Location
                            </label>

                            <select
                                id="locationId"
                                value={formData.locationId}
                                onChange={(event) =>
                                    handleFormChange(
                                        'locationId',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            >
                                <option value={0}>
                                    Select location
                                </option>

                                {locations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.id}
                                    >
                                        {location.name}
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
                                value={
                                    formData.requiredEmployees
                                }
                                onChange={(event) =>
                                    handleFormChange(
                                        'requiredEmployees',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="startTime"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Start Time
                            </label>

                            <input
                                id="startTime"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(event) =>
                                    handleFormChange(
                                        'startTime',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="endTime"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                End Time
                            </label>

                            <input
                                id="endTime"
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(event) =>
                                    handleFormChange(
                                        'endTime',
                                        event.target.value,
                                    )
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label
                                htmlFor="notes"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Notes
                            </label>

                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(event) =>
                                    handleFormChange(
                                        'notes',
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                maxLength={1000}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                                placeholder="Optional notes..."
                            />
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
                                    ? 'Creating...'
                                    : 'Create Shift'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {statusUpdateError && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {statusUpdateError}
                </div>
            )}

            <div className="mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(event.target.value)
                    }
                    placeholder="Search by location or notes..."
                    className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
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

                                <th className="pb-3 pr-6 font-medium">
                                    Status
                                </th>

                                <th className="pb-3 font-medium">
                                    Notes
                                </th>

                                <th className="pb-3 font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredShifts.map((shift) => (
                                <tr
                                    key={shift.id}
                                    className="border-b last:border-b-0"
                                >
                                    <td className="py-4 pr-6 text-sm text-gray-900">
                                        {new Date(
                                            shift.startTime,
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
                                            shift.startTime,
                                        ).toLocaleTimeString(
                                            'en-US',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        )}{' '}
                                        –{' '}
                                        {new Date(
                                            shift.endTime,
                                        ).toLocaleTimeString(
                                            'en-US',
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        )}
                                    </td>

                                    <td className="py-4 pr-6 text-sm font-medium text-gray-900">
                                        {shift.locationName}
                                    </td>

                                    <td className="py-4 pr-6 text-sm text-gray-700">
                                        {shift.requiredEmployees}
                                    </td>

                                    <td className="py-4 pr-6 text-sm">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                shift.status,
                                            )}`}
                                        >
                                            {getStatusLabel(
                                                shift.status,
                                            )}
                                        </span>
                                    </td>

                                    <td className="py-4 text-sm text-gray-700">
                                        {shift.notes ?? '—'}
                                    </td>

                                    <td className="py-4 text-sm">
                                        {getAvailableStatuses(shift.status).length > 0 ? (
                                            <select
                                                value=""
                                                disabled={statusUpdatingId === shift.id}
                                                onChange={(event) => {
                                                    const newStatus = Number(event.target.value)

                                                    if (newStatus) {
                                                        handleStatusChange(
                                                            shift.id,
                                                            newStatus,
                                                        )
                                                    }
                                                }}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    {statusUpdatingId === shift.id
                                                        ? 'Updating...'
                                                        : 'Change status'}
                                                </option>

                                                {getAvailableStatuses(shift.status).map(
                                                    (status) => (
                                                        <option
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {getStatusLabel(status)}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        ) : (
                                            <span className="text-gray-400">
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredShifts.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-sm text-gray-500">
                            No shifts found.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ShiftsPage