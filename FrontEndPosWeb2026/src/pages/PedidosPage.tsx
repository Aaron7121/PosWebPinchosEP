import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  Undo2,
} from 'lucide-react'
import {
  getDetallesPedido,
  getPedidos,
} from '../api/pedidos'
import {
  cancelarPedido,
  cambiarEstadoPedido,
  cambiarEstadoPago,
} from '../api/pedidos'
import type { Pedido } from '../types/pos'
import { ESTADOS_PEDIDO } from '../types/pos'
import { formatCurrency, formatFecha } from '../utils/format'
import { ConfirmModal } from '../components/ui/ConfirmModal'

const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-gray-200 text-gray-500',
}

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
}

const ETIQUETA_TIPO_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  COMBINADO: 'Combinado',
}

export function PedidosPage() {
  const queryClient = useQueryClient()
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [cancelarDe, setCancelarDe] = useState<Pedido | null>(null)

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: getPedidos,
  })

  const visibles = (pedidos ?? []).filter(
    (p) => filtroEstado === '' || p.estadoPedido === filtroEstado,
  )

  const estadoMutation = useMutation({
    mutationFn: ({ id, estadoPedido }: { id: number; estadoPedido: string }) =>
      cambiarEstadoPedido(id, estadoPedido),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos'] }),
  })

  const pagoMutation = useMutation({
    mutationFn: ({ id, estadoPago }: { id: number; estadoPago: string }) =>
      cambiarEstadoPago(id, estadoPago),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos'] }),
  })

  const cancelarMutation = useMutation({
    mutationFn: (id: number) => cancelarPedido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      setCancelarDe(null)
    },
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
        <h1 className="text-lg font-bold text-gray-900">Pedidos</h1>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtrar:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Todos</option>
            {ESTADOS_PEDIDO.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETA_ESTADO[estado]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
        ) : visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay pedidos para mostrar.
          </p>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {visibles.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onListo={() =>
                  estadoMutation.mutate({
                    id: pedido.id,
                    estadoPedido: 'ENTREGADO',
                  })
                }
                onDeshacer={() =>
                  estadoMutation.mutate({
                    id: pedido.id,
                    estadoPedido: 'PENDIENTE',
                  })
                }
                onPagado={() =>
                  pagoMutation.mutate({ id: pedido.id, estadoPago: 'PAGADO' })
                }
                onCancelar={() => setCancelarDe(pedido)}
                mutando={estadoMutation.isPending || pagoMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {cancelarDe && (
        <ConfirmModal
          open
          title="Cancelar pedido"
          message={`¿Cancelar el pedido #${cancelarDe.id}? Se revertirá el inventario consumido.`}
          confirmLabel="Cancelar pedido"
          isPending={cancelarMutation.isPending}
          onConfirm={() => cancelarMutation.mutate(cancelarDe.id)}
          onCancel={() => setCancelarDe(null)}
        />
      )}
    </div>
  )
}

function PedidoCard({
  pedido,
  onListo,
  onDeshacer,
  onPagado,
  onCancelar,
  mutando,
}: {
  pedido: Pedido
  onListo: () => void
  onDeshacer: () => void
  onPagado: () => void
  onCancelar: () => void
  mutando: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const serviciolbl =
    pedido.tipoServicio === 'LLEVAR'
      ? 'Para llevar'
      : pedido.tipoServicio === 'DELIVERY'
        ? 'Delivery'
        : pedido.tipoServicio === 'APLICACION'
          ? 'Aplicación'
          : pedido.numMesa != null
            ? `Mesa ${pedido.numMesa}`
            : 'Mesa'

  const pagado = pedido.estadoPago === 'PAGADO'
  const esPendiente = pedido.estadoPedido === 'PENDIENTE'
  const esEntregado = pedido.estadoPedido === 'ENTREGADO'
  const esCancelado = pedido.estadoPedido === 'CANCELADO'

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-bold text-gray-900">
            <ClipboardList className="h-4 w-4 text-orange-500" />
            Pedido #{pedido.id}
            <span className="text-sm font-medium text-gray-400">{serviciolbl}</span>
          </p>
          <p className="mt-0.5 text-sm text-gray-500">{formatFecha(pedido.fecha)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
            COLOR_ESTADO[pedido.estadoPedido] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {ETIQUETA_ESTADO[pedido.estadoPedido] ?? pedido.estadoPedido}
        </span>
      </div>

      {pedido.comentario && (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
          {pedido.comentario}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(pedido.total)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
              pagado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {pagado ? 'Pagado' : 'Pago pendiente'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-medium text-orange-500 transition-colors hover:bg-orange-50"
        >
          {expanded ? 'Ocultar' : 'Detalles'}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-2xl bg-gray-50 p-4">
          <DetalleList pedidoId={pedido.id} />
        </div>
      )}

      {!esCancelado && (
        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
          {esPendiente ? (
            <button
              type="button"
              disabled={mutando}
              onClick={onListo}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-3 text-base font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
              Pedido listo
            </button>
          ) : esEntregado ? (
            <button
              type="button"
              disabled={mutando}
              onClick={onDeshacer}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              Deshacer
            </button>
          ) : null}

          {!pagado && (
            <button
              type="button"
              disabled={mutando}
              onClick={onPagado}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
            >
              <CircleDollarSign className="h-4 w-4" />
              Registrar pago
            </button>
          )}
          {esPendiente && (
            <button
              type="button"
              disabled={mutando}
              onClick={onCancelar}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DetalleList({ pedidoId }: { pedidoId: number }) {
  const { data: detalles, isLoading } = useQuery({
    queryKey: ['pedidos', pedidoId, 'detalles'],
    queryFn: () => getDetallesPedido(pedidoId),
    enabled: pedidoId != null,
  })

  if (isLoading) {
    return <p className="py-4 text-center text-sm text-gray-400">Cargando...</p>
  }

  if (!detalles || detalles.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">Sin detalles.</p>
  }

  const tipoPago = detalles.find((d) => d.tipoPago)?.tipoPago ?? null

  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-gray-100">
        {detalles.map((detalle) => (
          <li key={detalle.id} className="flex items-center gap-3 py-2">
            <span className="w-10 shrink-0 rounded-md bg-white px-1.5 py-0.5 text-center text-sm font-bold text-gray-700 ring-1 ring-gray-200">
              {detalle.cantidad}×
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">
                {detalle.idPlato?.nombre ?? 'Plato'}
              </p>
              <p className="text-xs text-gray-400">
                {formatCurrency(detalle.precioUnitario)} c/u
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-gray-900">
              {formatCurrency(detalle.subtotal)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm">
        <span className="text-gray-500">Tipo de pago</span>
        <span className="font-semibold text-gray-900">
          {tipoPago ? (ETIQUETA_TIPO_PAGO[tipoPago] ?? tipoPago) : '—'}
        </span>
      </div>
    </div>
  )
}
