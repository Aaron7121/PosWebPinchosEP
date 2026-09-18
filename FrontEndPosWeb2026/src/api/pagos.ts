import { request } from './client'
import type { DetallePago, PagoRequest, ResumenPago } from '../types/pos'

export function getPagosPedido(idPedido: number) {
  return request<DetallePago[]>(`/pagos/pedido/${idPedido}`)
}

export function getResumenPagos(fecha?: string) {
  const params = new URLSearchParams()
  if (fecha) params.set('fecha', fecha)
  const q = params.toString()
  return request<ResumenPago[]>(`/pagos/resumen${q ? `?${q}` : ''}`)
}

export function createPago(payload: PagoRequest) {
  return request<DetallePago[]>('/pagos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function anularPago(id: number) {
  return request<void>(`/pagos/${id}`, {
    method: 'DELETE',
  })
}
