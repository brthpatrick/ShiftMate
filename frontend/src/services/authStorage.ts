const TOKEN_KEY = 'shiftmate_token'
const REFRESH_TOKEN_KEY = 'shiftmate_refresh_token'

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
}

export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setRefreshToken = (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY)
}

export const removeRefreshToken = (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const clearAuthStorage = (): void => {
    removeToken()
    removeRefreshToken()
}