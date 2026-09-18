import { request } from './client'
import type { Cliente, ClienteRequest } from '../types/pos'

export function getClientes() {
  return request<Cliente[]>('/clientes')
}

export function getCliente(id: number) {
  return request<Cliente>(`/clientes/${id}`)
}

export function createCliente(payload: ClienteRequest) {
  return request<Cliente>('/clientes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCliente(id: number, payload: ClienteRequest) {
  return request<Cliente>(`/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCliente(id: number) {
  return request<void>(`/clientes/${id}`, { method: 'DELETE' })
}
