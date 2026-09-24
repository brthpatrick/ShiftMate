import axios from 'axios'

interface ApiErrorResponse {
    message?: string
    errors?: Record<string, string[]>
}

export const getApiErrorMessage = (
    error: unknown,
): string => {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
        return 'An unexpected error occurred.'
    }

    if (!error.response) {
        return 'Unable to connect to the server.'
    }

    const { status, data } = error.response

    if (data?.message) {
        return data.message
    }

    if (data?.errors) {
        const messages = Object.values(data.errors).flat()

        if (messages.length > 0) {
            return messages.join(' ')
        }
    }

    switch (status) {
        case 400:
            return 'The request is invalid.'

        case 401:
            return 'Your session has expired. Please sign in again.'

        case 403:
            return 'You do not have permission to perform this action.'

        case 404:
            return 'The requested resource was not found.'

        case 409:
            return 'The request conflicts with existing data.'

        case 500:
            return 'An unexpected server error occurred.'

        default:
            return 'An unexpected error occurred.'
    }
}