import { useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import {
    createLocation,
    getLocations,
} from '../services/locationService'
import type {
    CreateLocationRequest,
    Location,
} from '../types/location'

function getErrorMessage(error: unknown): string {
    const axiosError = error as AxiosError<
        | string
        | {
            message?: string
            title?: string
            errors?: Record<string, string[]>
        }
    >

    const data = axiosError.response?.data

    if (typeof data === 'string' && data.trim()) {
        return data
    }

    if (data && typeof data === 'object') {
        if ('message' in data && data.message) {
            return data.message
        }

        if ('title' in data && data.title) {
            return data.title
        }

        if ('errors' in data && data.errors) {
            const firstError = Object.values(data.errors)
                .flat()
                .find((message) => message)

            if (firstError) {
                return firstError
            }
        }
    }

    return 'An unexpected error occurred.'
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])

    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')

    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const loadLocations = async () => {
        try {
            setLoading(true)
            setError('')

            const data = await getLocations()

            setLocations(data)
        } catch (error) {
            setError(getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLocations()
    }, [])

    const filteredLocations = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        if (!searchTerm) {
            return locations
        }

        return locations.filter((location) =>
            [
                location.name,
                location.address,
                location.city,
            ]
                .filter(Boolean)
                .some((value) =>
                    value!.toLowerCase().includes(searchTerm),
                ),
        )
    }, [locations, search])

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault()

        const trimmedName = name.trim()
        const trimmedAddress = address.trim()
        const trimmedCity = city.trim()

        if (!trimmedName) {
            setError('Location name is required.')
            return
        }

        if (!trimmedAddress) {
            setError('Address is required.')
            return
        }

        if (!trimmedCity) {
            setError('City is required.')
            return
        }

        try {
            setSaving(true)
            setError('')
            setSuccess('')

            const request: CreateLocationRequest = {
                name: trimmedName,
                address: trimmedAddress,
                city: trimmedCity,
            }

            await createLocation(request)

            setName('')
            setAddress('')
            setCity('')

            setSuccess(
                'Location created successfully.',
            )

            await loadLocations()
        } catch (error) {
            setError(getErrorMessage(error))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Locations
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage the locations where shifts take place.
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
                    Add Location
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Location Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="e.g. Main Store"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Address
                        </label>

                        <input
                            type="text"
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            placeholder="e.g. Main Street 10"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            City
                        </label>

                        <input
                            type="text"
                            value={city}
                            onChange={(event) =>
                                setCity(event.target.value)
                            }
                            placeholder="e.g. Târgu Mureș"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : 'Add Location'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Locations
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {filteredLocations.length}{' '}
                            location
                            {filteredLocations.length !== 1
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
                        placeholder="Search location..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none md:w-64"
                    />
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-gray-500">
                        Loading locations...
                    </div>
                ) : filteredLocations.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        No locations found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Name
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Address
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        City
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        ID
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredLocations.map(
                                    (location) => (
                                        <tr
                                            key={location.id}
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {location.name}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {location.address ??
                                                    '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {location.city ??
                                                    '-'}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                                                {location.id}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}