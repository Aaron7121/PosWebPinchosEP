import { request } from './client'
import type {
  Caja,
  CajaAbrirRequest,
  CajaCerrarRequest,
} from '../types/pos'

export function getCajas() {
  return request<Caja[]>('/cajas')
}

export function getCajaAbierta() {
  return request<Caja | undefined>('/cajas/abierta')
}

export function abrirCaja(payload: CajaAbrirRequest) {
  return request<Caja>('/cajas/abrir', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function cerrarCaja(id: number, payload: CajaCerrarRequest) {
  return request<Caja>(`/cajas/${id}/cerrar`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}