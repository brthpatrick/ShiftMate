export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    token: string
    expiresAt: string
    refreshToken: string
    refreshTokenExpiresAt: string
    userId: number
    companyId: number
    employeeId: number | null
    email: string
    role: string
}