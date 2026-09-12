import { request } from './client'
import type {
  EstadoRequest,
  PasswordRequest,
  Usuario,
  UsuarioRequest,
} from '../types/user'

export function getUsuarios() {
  return request<Usuario[]>('/usuarios')
}

export function getUsuario(id: number) {
  return request<Usuario>(`/usuarios/${id}`)
}

export function createUsuario(payload: UsuarioRequest) {
  return request<Usuario>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUsuario(id: number, payload: UsuarioRequest) {
  return request<Usuario>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateUsuarioEstado(id: number, payload: EstadoRequest) {
  return request<Usuario>(`/usuarios/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateUsuarioPassword(id: number, payload: PasswordRequest) {
  return request<void>(`/usuarios/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteUsuario(id: number) {
  return request<void>(`/usuarios/${id}`, { method: 'DELETE' })
}
