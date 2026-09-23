import { request } from './client'
import type { DetallePedido, Pedido, PedidoRequest } from '../types/pos'

export function getPedidos() {
  return request<Pedido[]>('/pedidos')
}

export function getPedido(id: number) {
  return request<Pedido>(`/pedidos/${id}`)
}

export function getDetallesPedido(id: number) {
  return request<DetallePedido[]>(`/pedidos/${id}/detalles`)
}

export function createPedido(payload: PedidoRequest) {
  return request<Pedido>('/pedidos', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePedido(id: number, payload: PedidoRequest) {
  return request<Pedido>(`/pedidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function cambiarEstadoPedido(id: number, estadoPedido: string) {
  return request<Pedido>(`/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoPedido }),
  })
}

export function cambiarEstadoPago(id: number, estadoPago: string) {
  return request<Pedido>(`/pedidos/${id}/pago`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoPago }),
  })
}

export function cancelarPedido(id: number) {
  return request<Pedido>(`/pedidos/${id}/cancelar`, {
    method: 'PATCH',
  })
}