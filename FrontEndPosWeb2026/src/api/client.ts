import { useAuthStore } from '../store/auth'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { token } = useAuthStore.getState()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (response.status === 401) {
    useAuthStore.getState().logout()
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.message ?? response.statusText)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export async function uploadImage(
  file: File,
  tipo: 'platos' | 'categorias',
): Promise<{ path: string }> {
  const { token } = useAuthStore.getState()

  const formData = new FormData()
  formData.append('file', file)
  formData.append('tipo', tipo)

  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (response.status === 401) {
    useAuthStore.getState().logout()
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.message ?? response.statusText)
  }

  return response.json() as Promise<{ path: string }>
}
