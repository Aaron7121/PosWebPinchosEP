import type { Plato, Producto } from './catalogo'

export interface Empleado {
  id: number
  nombre: string
  correo: string
  usuario: string
}

export interface Caja {
  id: number
  fechaApertura: string
  fechaCierre: string | null
  idEmpleado: Empleado | null
  observaciones: string | null
  montoEsperado: number | null
  montoReal: number | null
}

export interface Pedido {
  id: number
  fecha: string | null
  idCliente: unknown | null
  idEmpleado: Empleado | null
  total: number | null
  tipoServicio: string | null
  numMesa: number | null
  comentario: string | null
  estadoPedido: string
  estadoPago: string
}

export interface DetallePedido {
  id: number
  idPedido: unknown | null
  idPlato: Plato | null
  cantidad: number | null
  subtotal: number | null
  precioUnitario: number | null
  tipoPago: string | null
}

export interface DetallePago {
  id: number
  idPedido: unknown | null
  tipo: string | null
  total: number | null
  fecha: string | null
}

export interface InventarioDiario {
  id: number
  fecha: string
  idProducto: Producto | null
  cantidadInicial: number
  cantidadActual: number
}

export interface MovInventario {
  id: number
  idProducto: Producto | null
  fecha: string
  tipoMovimiento: string
  cantidad: number
  idPedido: { id: number } | null
}

export interface CajaAbrirRequest {
  montoEsperado: number
  observaciones?: string
}

export interface CajaCerrarRequest {
  montoReal: number
}

export interface ResumenCierreCaja {
  montoInicial: number
  totalEfectivo: number
  totalTransferencia: number
  efectivoEsperado: number
  transferenciaEsperada: number
  totalEsperado: number
}

export interface DetalleRequest {
  idPlato: number
  cantidad: number
}

export interface PedidoRequest {
  idCliente?: number
  tipoServicio?: string
  numMesa?: number
  comentario?: string
  idempotencyKey?: string
  detalles: DetalleRequest[]
}

export interface InventarioItemRequest {
  idProducto: number
  cantidadInicial: number
}

export interface MovInventarioRequest {
  idProducto: { id: number }
  tipoMovimiento: string
  cantidad: number
}

export interface PagoItemRequest {
  tipo: string
  monto: number
}

export interface ClientePagoRequest {
  cedula?: string
  nombre?: string
  telefono?: string
  correo?: string
}

export interface PagoRequest {
  idPedido: number
  cliente?: ClientePagoRequest | null
  pagos: PagoItemRequest[]
}

export interface ResumenPago {
  tipo: string
  total: number
}

export interface Cliente {
  id: number
  nombre: string | null
  telefono: string | null
  correo: string | null
  idDireccion: unknown | null
  cedula: string | null
  activo: boolean | null
}

export interface ClienteRequest {
  nombre?: string
  telefono?: string
  correo?: string
  cedula?: string
  activo?: boolean
}

export const ESTADOS_PEDIDO = [
  'PENDIENTE',
  'ENTREGADO',
  'CANCELADO',
] as const

export const ESTADOS_PAGO = ['PENDIENTE', 'PAGADO'] as const

export const TIPOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'COMBINADO'] as const

export const TIPOS_MOVIMIENTO = ['ENTRADA', 'SALIDA', 'AJUSTE'] as const

export const TIPOS_SERVICIO = ['MESA', 'LLEVAR', 'DELIVERY', 'APLICACION'] as const