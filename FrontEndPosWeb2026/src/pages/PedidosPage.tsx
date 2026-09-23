import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  Bike,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  Pencil,
  Smartphone,
  ShoppingBag,
  Utensils,
  Undo2,
  Users,
} from 'lucide-react'
import {
  getDetallesPedido,
  getPedidos,
} from '../api/pedidos'
import { getPagosPedido } from '../api/pagos'
import {
  cancelarPedido,
  cambiarEstadoPedido,
} from '../api/pedidos'
import type { Pedido } from '../types/pos'
import { formatCurrency, formatHora } from '../utils/format'
import { usePedidosUI } from '../store/pedidosUI'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { CobroModal } from '../components/ui/CobroModal'
import { DividirModal } from '../components/ui/DividirModal'

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

type Tab = 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO' | 'COMPLETADO'

const TABS: { key: Tab; label: string }[] = [
  { key: 'PENDIENTE', label: 'Pendiente' },
  { key: 'ENTREGADO', label: 'Entregado' },
  { key: 'COMPLETADO', label: 'Completado' },
  { key: 'CANCELADO', label: 'Cancelado' },
]

function cumpleTab(pedido: Pedido, tab: Tab): boolean {
  switch (tab) {
    case 'PENDIENTE':
      return pedido.estadoPedido === 'PENDIENTE'
    case 'ENTREGADO':
      return pedido.estadoPedido === 'ENTREGADO' && pedido.estadoPago !== 'PAGADO'
    case 'CANCELADO':
      return pedido.estadoPedido === 'CANCELADO'
    case 'COMPLETADO':
      return pedido.estadoPedido === 'ENTREGADO' && pedido.estadoPago === 'PAGADO'
  }
}

function tabPara(pedido: Pedido): Tab {
  if (pedido.estadoPedido === 'CANCELADO') return 'CANCELADO'
  if (pedido.estadoPedido === 'PENDIENTE') return 'PENDIENTE'
  return pedido.estadoPago === 'PAGADO' ? 'COMPLETADO' : 'ENTREGADO'
}

export function PedidosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const colapsar = usePedidosUI((s) => s.colapsar)
  const [tabActiva, setTabActiva] = useState<Tab>('PENDIENTE')
  const [cancelarDe, setCancelarDe] = useState<Pedido | null>(null)
  const [cobrarDe, setCobrarDe] = useState<Pedido | null>(null)
  const [dividirDe, setDividirDe] = useState<Pedido | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos'],
    queryFn: getPedidos,
  })

  const rawPedido = searchParams.get('pedido')
  const destacadoId =
    rawPedido != null && Number.isFinite(Number(rawPedido))
      ? Number(rawPedido)
      : null

  const pedidoDestacado =
    destacadoId != null
      ? (pedidos ?? []).find((p) => p.id === destacadoId)
      : undefined

  const tabEfectiva = pedidoDestacado ? tabPara(pedidoDestacado) : tabActiva

  const visibles = (pedidos ?? []).filter((p) => cumpleTab(p, tabEfectiva))

  const estadoMutation = useMutation({
    mutationFn: ({ id, estadoPedido }: { id: number; estadoPedido: string }) =>
      cambiarEstadoPedido(id, estadoPedido),
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
      </header>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-gray-100 bg-white px-6 py-3">
        {TABS.map((tab) => {
          const activa = tabEfectiva === tab.key
          const cantidad = (pedidos ?? []).filter((p) => cumpleTab(p, tab.key)).length
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTabActiva(tab.key)
                if (destacadoId != null) setSearchParams({}, { replace: true })
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activa
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs font-bold ${
                  activa ? 'bg-white/25 text-white' : 'bg-white text-gray-500'
                }`}
              >
                {cantidad}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
        ) : visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No hay pedidos para mostrar.
          </p>
        ) : (
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-3 lg:grid-cols-3">
            {visibles.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                onListo={() => {
                  colapsar(pedido.id)
                  estadoMutation.mutate({
                    id: pedido.id,
                    estadoPedido: 'ENTREGADO',
                  })
                }}
                onDeshacer={() =>
                  estadoMutation.mutate({
                    id: pedido.id,
                    estadoPedido: 'PENDIENTE',
                  })
                }
                onPagado={() => setCobrarDe(pedido)}
                onCancelar={() => setCancelarDe(pedido)}
                onDividir={() => setDividirDe(pedido)}
                onEditar={() => navigate(`/?mode=edit&pedidoId=${pedido.id}`)}
                mutando={estadoMutation.isPending}
                destacado={pedido.id === destacadoId}
              />
            ))}
          </div>
        )}
      </div>

      {cobrarDe && (
        <CobroModal pedido={cobrarDe} onClose={() => setCobrarDe(null)} />
      )}

      {dividirDe && (
        <DividirModal pedido={dividirDe} onClose={() => setDividirDe(null)} />
      )}

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
  onDividir,
  onEditar,
  mutando,
  destacado,
}: {
  pedido: Pedido
  onListo: () => void
  onDeshacer: () => void
  onPagado: () => void
  onCancelar: () => void
  onDividir: () => void
  onEditar: () => void
  mutando: boolean
  destacado: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const expandidos = usePedidosUI((s) => s.expandidos)
  const toggle = usePedidosUI((s) => s.toggle)
  const expandir = usePedidosUI((s) => s.expandir)
  const expanded = expandidos[pedido.id] ?? true

  useEffect(() => {
    if (!destacado) return
    expandir(pedido.id)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [destacado, expandir, pedido.id])

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

  const IconoServicio =
    pedido.tipoServicio === 'LLEVAR'
      ? ShoppingBag
      : pedido.tipoServicio === 'DELIVERY'
      ? Bike
        : pedido.tipoServicio === 'APLICACION'
          ? Smartphone
          : Utensils

  const pagado = pedido.estadoPago === 'PAGADO'
  const esPendiente = pedido.estadoPedido === 'PENDIENTE'
  const esEntregado = pedido.estadoPedido === 'ENTREGADO'
  const esCancelado = pedido.estadoPedido === 'CANCELADO'

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${
        destacado ? 'ring-2 ring-orange-400' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <ClipboardList className="h-3.5 w-3.5" />
            Pedido #{pedido.id}
            <span aria-hidden="true">·</span>
            <span>{formatHora(pedido.fecha)}</span>
          </p>
          <span className="inline-flex max-w-full items-center gap-2 text-base font-bold text-gray-900">
            <IconoServicio className="h-5 w-5 shrink-0 text-orange-500" />
            {serviciolbl}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            COLOR_ESTADO[pedido.estadoPedido] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {ETIQUETA_ESTADO[pedido.estadoPedido] ?? pedido.estadoPedido}
        </span>
      </div>

      {pedido.comentario && (
        <p className="mt-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
          {pedido.comentario}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(pedido.total)}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
              pagado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {pagado ? 'Pagado' : 'Pago pendiente'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {esPendiente && (
            <button
              type="button"
              onClick={onEditar}
              aria-label="Editar pedido"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDividir}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Users className="h-4 w-4" />
            Dividir
          </button>
          <button
            type="button"
            onClick={() => toggle(pedido.id)}
            aria-expanded={expanded}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-orange-500 transition-colors hover:bg-orange-50"
          >
            {expanded ? 'Ocultar' : 'Detalles'}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 rounded-xl bg-gray-50 p-3">
          <DetalleList pedido={pedido} pedidoId={pedido.id} />
        </div>
      )}

      {!esCancelado && (
        <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
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

function DetalleList({ pedido, pedidoId }: { pedido: Pedido; pedidoId: number }) {
  const { data: detalles, isLoading: cargandoDetalles } = useQuery({
    queryKey: ['pedidos', pedidoId, 'detalles'],
    queryFn: () => getDetallesPedido(pedidoId),
    enabled: pedidoId != null,
  })

  const { data: pagos, isLoading: cargandoPagos } = useQuery({
    queryKey: ['pagos', pedidoId],
    queryFn: () => getPagosPedido(pedidoId),
    enabled: pedidoId != null,
  })

  if (cargandoDetalles || cargandoPagos) {
    return <p className="py-4 text-center text-sm text-gray-400">Cargando...</p>
  }

  if (!detalles || detalles.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">Sin detalles.</p>
  }

  const tiposPago = Array.from(
    new Set((pagos ?? []).map((p) => p.tipo).filter((tipo): tipo is string => Boolean(tipo))),
  )
  const tipoPago =
    tiposPago.length > 1
      ? 'COMBINADO'
      : tiposPago[0] ?? detalles.find((d) => d.tipoPago)?.tipoPago ?? null

  const mostrarComentarioImportante = pedido.estadoPedido === 'PENDIENTE'
  const comentarioImportante = pedido.comentario?.trim()

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

      {mostrarComentarioImportante && comentarioImportante ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
            Comentario
          </p>
          <p className="text-sm font-medium text-amber-900">{comentarioImportante}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm">
          <span className="text-gray-500">Tipo de pago</span>
          <span className="font-semibold text-gray-900">
            {tipoPago ? (ETIQUETA_TIPO_PAGO[tipoPago] ?? tipoPago) : '—'}
          </span>
        </div>
      )}
    </div>
  )
}
