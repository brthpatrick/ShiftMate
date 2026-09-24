import { useEffect, useMemo, useState } from 'react'
import {
    createLocation,
    getLocations,
} from '../services/locationService'
import type {
    CreateLocationRequest,
    Location,
} from '../types/location'
import { getApiErrorMessage } from '../services/apiError'

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
            setError(getApiErrorMessage(error))
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

        setError('')
        setSuccess('')

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
            setError(getApiErrorMessage(error))
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
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Add Location
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Add a location where employees can be scheduled.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                    <div>
                        <label
                            htmlFor="location-name"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Location Name
                        </label>

                        <input
                            id="location-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="e.g. Main Store"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="location-address"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            Address
                        </label>

                        <input
                            id="location-address"
                            type="text"
                            value={address}
                            onChange={(event) =>
                                setAddress(event.target.value)
                            }
                            placeholder="e.g. Main Street 10"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="location-city"
                            className="mb-1 block text-sm font-medium text-gray-700"
                        >
                            City
                        </label>

                        <input
                            id="location-city"
                            type="text"
                            value={city}
                            onChange={(event) =>
                                setCity(event.target.value)
                            }
                            placeholder="e.g. Târgu Mureș"
                            disabled={saving}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                            {filteredLocations.length === 1
                                ? 'location'
                                : 'locations'}
                            {search.trim()
                                ? ' matching your search'
                                : ''}
                        </p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search location..."
                            aria-label="Search locations"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400 transition hover:text-gray-700"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-10">
                        <p className="text-sm text-gray-500">
                            Loading locations...
                        </p>
                    </div>
                ) : filteredLocations.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {locations.length === 0
                                ? 'No locations yet.'
                                : 'No locations match your search.'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            {locations.length === 0
                                ? 'Add a location above to get started.'
                                : 'Try adjusting your search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full divide-y divide-gray-200">
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
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {location.name}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {location.address ??
                                                    '—'}
                                            </td>

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {location.city ??
                                                    '—'}
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