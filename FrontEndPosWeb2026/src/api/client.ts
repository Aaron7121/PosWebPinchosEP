import { useAuthStore } from '../store/auth'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number
  error?: string

  constructor(status: number, message: string, error?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.error = error
  }
}

async function parseApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null)
  if (isApiErrorBody(body)) {
    return new ApiError(response.status, body.message, body.error)
  }
  return new ApiError(
    response.status,
    'No se pudo completar la solicitud. Intenta nuevamente más tarde',
  )
}

function isApiErrorBody(
  body: unknown,
): body is { message: string; error?: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string' &&
    body.message.length > 0
  )
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
    throw await parseApiError(response)
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
    throw await parseApiError(response)
  }

  return response.json() as Promise<{ path: string }>
}
