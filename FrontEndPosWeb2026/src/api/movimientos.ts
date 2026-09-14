import { request } from './client'
import type { MovInventario } from '../types/pos'

export function getMovimientos(producto?: number, pedido?: number) {
  const params = new URLSearchParams()
  if (producto != null) params.set('producto', String(producto))
  if (pedido != null) params.set('pedido', String(pedido))
  const q = params.toString()
  return request<MovInventario[]>(`/movs-inventario${q ? `?${q}` : ''}`)
}