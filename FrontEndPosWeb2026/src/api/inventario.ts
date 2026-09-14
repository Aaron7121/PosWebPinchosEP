import { request } from './client'
import type {
  InventarioDiario,
  InventarioItemRequest,
} from '../types/pos'

export function getInventario(fecha?: string) {
  const q = fecha ? `?fecha=${fecha}` : ''
  return request<InventarioDiario[]>(`/inventarios-diario${q}`)
}

export function getUltimoInventario() {
  return request<InventarioDiario[]>('/inventarios-diario/ultimo')
}

export function registrarInventarioLote(
  items: InventarioItemRequest[],
  fecha?: string,
) {
  const q = fecha ? `?fecha=${fecha}` : ''
  return request<InventarioDiario[]>(`/inventarios-diario/lote${q}`, {
    method: 'POST',
    body: JSON.stringify(items),
  })
}

export function registrarEntrada(idProducto: number, cantidad: number, fecha?: string) {
  const q = fecha ? `?fecha=${fecha}` : ''
  return request<InventarioDiario>(`/inventarios-diario/entrada${q}`, {
    method: 'POST',
    body: JSON.stringify({ idProducto, cantidad }),
  })
}

export function registrarSalida(idProducto: number, cantidad: number, fecha?: string) {
  const q = fecha ? `?fecha=${fecha}` : ''
  return request<InventarioDiario>(`/inventarios-diario/salida${q}`, {
    method: 'POST',
    body: JSON.stringify({ idProducto, cantidad }),
  })
}

export function registrarEntradaLote(
  items: { idProducto: number; cantidad: number }[],
  fecha?: string,
) {
  const q = fecha ? `?fecha=${fecha}` : ''
  return request<InventarioDiario[]>(`/inventarios-diario/entrada/lote${q}`, {
    method: 'POST',
    body: JSON.stringify(items),
  })
}

export function registrarSalidaLote(
  items: { idProducto: number; cantidad: number }[],
  fecha?: string,
) {
  const q = fecha ? `?fecha=${fecha}` : ''
  return request<InventarioDiario[]>(`/inventarios-diario/salida/lote${q}`, {
    method: 'POST',
    body: JSON.stringify(items),
  })
}

export function updateInventario(id: number, payload: Partial<InventarioDiario>) {
  return request<InventarioDiario>(`/inventarios-diario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteInventario(id: number) {
  return request<void>(`/inventarios-diario/${id}`, { method: 'DELETE' })
}