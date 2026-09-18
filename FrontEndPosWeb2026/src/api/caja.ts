import { request } from './client'
import type {
  Caja,
  CajaAbrirRequest,
  CajaCerrarRequest,
  ResumenCierreCaja,
} from '../types/pos'

export function getCajas() {
  return request<Caja[]>('/cajas')
}

export function getCajaAbierta() {
  return request<Caja | undefined>('/cajas/abierta')
}

export function getResumenCierre(id: number) {
  return request<ResumenCierreCaja>(`/cajas/${id}/resumen-cierre`)
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