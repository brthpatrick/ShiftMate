export interface Location {
    id: number
    companyId: number
    name: string
    address: string | null
    city: string | null
}

export interface CreateLocationRequest {
    name: string
    address: string
    city: string
}