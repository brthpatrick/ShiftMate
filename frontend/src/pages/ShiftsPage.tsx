import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Shift, CreateShiftRequest } from '../types/shift'
import type { Location } from '../types/location'
import {
    getShifts,
    createShift,
    updateShiftStatus,
} from '../services/shiftService'
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
    const [success, setSuccess] = useState('')

    const [statusUpdatingId, setStatusUpdatingId] =
        useState<number | null>(null)
    const [statusUpdateError, setStatusUpdateError] =
        useState('')

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

        setFormError('')
        setStatusUpdateError('')
        setSuccess('')

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

        try {
            setIsSubmitting(true)

            const request: CreateShiftRequest = {
                locationId: formData.locationId,
                startTime: `${formData.startTime}:00`,
                endTime: `${formData.endTime}:00`,
                requiredEmployees:
                    formData.requiredEmployees,
                notes: formData.notes.trim(),
            }

            await createShift(request)

            const updatedShifts = await getShifts()

            setShifts(updatedShifts)
            setFormData(getDefaultFormData())
            setShowForm(false)

            setSuccess('Shift created successfully.')
        } catch (error) {
            setFormError(getApiErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOpenForm = () => {
        setFormData(getDefaultFormData())
        setFormError('')
        setStatusUpdateError('')
        setSuccess('')
        setShowForm(true)
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
            setSuccess('')

            const updatedShift = await updateShiftStatus(
                shiftId,
                { status: newStatus },
            )

            setShifts((current) =>
                current.map((shift) =>
                    shift.id === updatedShift.id
                        ? updatedShift
                        : shift,
                ),
            )

            setSuccess(
                `Shift #${shiftId} status updated to ${getStatusLabel(
                    newStatus,
                )}.`,
            )
        } catch (error) {
            setStatusUpdateError(
                getApiErrorMessage(error),
            )
        } finally {
            setStatusUpdatingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-gray-500">
                    Loading shifts...
                </p>
            </div>
        )
    }

    if (error) {
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Shifts
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Manage your company's shifts and schedule.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenForm}
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    + Add Shift
                </button>
            </div>

            {success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                    {success}
                </div>
            )}

            {showForm && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Add Shift
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Create a new shift for your company.
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
                                disabled={
                                    isSubmitting ||
                                    locations.length === 0
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                <option value={0}>
                                    {locations.length === 0
                                        ? 'No locations available'
                                        : 'Select location'}
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

                            {locations.length === 0 && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Create a location before adding
                                    a shift.
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
                                disabled={isSubmitting}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                                disabled={isSubmitting}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                                min={
                                    formData.startTime ||
                                    undefined
                                }
                                onChange={(event) =>
                                    handleFormChange(
                                        'endTime',
                                        event.target.value,
                                    )
                                }
                                required
                                disabled={isSubmitting}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                            />

                            <p className="mt-1 text-xs text-gray-500">
                                End time must be later than start time.
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="notes"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Notes
                                </label>

                                <span className="text-xs text-gray-400">
                                    {formData.notes.length}/1000
                                </span>
                            </div>

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
                                disabled={isSubmitting}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="Optional notes..."
                            />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row md:col-span-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="w-full rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    locations.length === 0
                                }
                                className="w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {statusUpdateError}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Shift List
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredShifts.length}{' '}
                            {filteredShifts.length === 1
                                ? 'shift'
                                : 'shifts'}
                            {searchTerm.trim()
                                ? ' matching your search'
                                : ''}
                        </p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value,
                                )
                            }
                            placeholder="Search by location or notes..."
                            aria-label="Search shifts"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearchTerm('')
                                }
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400 transition hover:text-gray-700"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {filteredShifts.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {shifts.length === 0
                                ? 'No shifts yet.'
                                : 'No shifts match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {shifts.length === 0
                                ? 'Create a shift above to get started.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1100px] w-full text-left">
                            <thead className="bg-gray-50">
                                <tr className="border-b border-gray-200 text-sm text-gray-500">
                                    <th className="px-6 py-3 font-medium">
                                        Date
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Time
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Location
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Required
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Status
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Notes
                                    </th>

                                    <th className="px-6 py-3 font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {filteredShifts.map((shift) => {
                                    const availableStatuses =
                                        getAvailableStatuses(
                                            shift.status,
                                        )

                                    return (
                                        <tr
                                            key={shift.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
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

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
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

                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {
                                                    shift.locationName
                                                }
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {
                                                    shift.requiredEmployees
                                                }
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
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

                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-700">
                                                <span
                                                    className="block max-w-xs truncate"
                                                    title={
                                                        shift.notes ||
                                                        undefined
                                                    }
                                                >
                                                    {shift.notes ??
                                                        '—'}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                {availableStatuses.length >
                                                    0 ? (
                                                    <select
                                                        value=""
                                                        aria-label={`Change status for shift #${shift.id}`}
                                                        disabled={
                                                            statusUpdatingId ===
                                                            shift.id
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            const newStatus =
                                                                Number(
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )

                                                            if (
                                                                newStatus
                                                            ) {
                                                                handleStatusChange(
                                                                    shift.id,
                                                                    newStatus,
                                                                )
                                                            }
                                                        }}
                                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60"
                                                    >
                                                        <option value="">
                                                            {statusUpdatingId ===
                                                                shift.id
                                                                ? 'Updating...'
                                                                : 'Change status'}
                                                        </option>

                                                        {availableStatuses.map(
                                                            (
                                                                status,
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        status
                                                                    }
                                                                    value={
                                                                        status
                                                                    }
                                                                >
                                                                    {getStatusLabel(
                                                                        status,
                                                                    )}
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
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ShiftsPage