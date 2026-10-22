import { useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Ban,
  Bike,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Pencil,
  Smartphone,
  ShoppingBag,
  Timer,
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
      return pedido.estadoPedido === 'COMPLETADO'
  }
}

function tabPara(pedido: Pedido): Tab {
  if (pedido.estadoPedido === 'CANCELADO') return 'CANCELADO'
  if (pedido.estadoPedido === 'PENDIENTE') return 'PENDIENTE'
  if (pedido.estadoPedido === 'COMPLETADO') return 'COMPLETADO'
  return 'ENTREGADO'
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
        ) : tabEfectiva === 'COMPLETADO' ? (
          <TablaPedidosCompletados pedidos={visibles} />
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

function TablaPedidosCompletados({
  pedidos,
}: {
  pedidos: Pedido[]
}) {
  const [expandidoId, setExpandidoId] = useState<number | null>(null)
  const hoyISO = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const pedidosOrdenados = useMemo(() => {
    return [...pedidos].sort((a, b) => {
      const timeA = a.fecha ? new Date(a.fecha).getTime() : 0
      const timeB = b.fecha ? new Date(b.fecha).getTime() : 0
      return timeB - timeA
    })
  }, [pedidos])

  // Métricas del día (con fallback a pedidos completados visibles si no hay registros hoy)
  const tieneHoy = useMemo(
    () => pedidos.some((p) => p.fecha && p.fecha.startsWith(hoyISO)),
    [pedidos, hoyISO]
  )

  const pedidosCalculo = useMemo(() => {
    if (tieneHoy) {
      return pedidos.filter((p) => p.fecha && p.fecha.startsWith(hoyISO))
    }
    return pedidos
  }, [pedidos, hoyISO, tieneHoy])

  const totalRecaudado = useMemo(() => {
    return pedidosCalculo.reduce((acc, p) => acc + (p.total ?? 0), 0)
  }, [pedidosCalculo])

  const ticketPromedio = useMemo(() => {
    if (pedidosCalculo.length === 0) return 0
    return totalRecaudado / pedidosCalculo.length
  }, [pedidosCalculo, totalRecaudado])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      {/* Tarjetas resumen de métricas del día */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total recaudado {tieneHoy ? '(Hoy)' : ''}
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {formatCurrency(totalRecaudado)}
          </p>
          <span className="mt-0.5 text-xs text-gray-500">
            {pedidosCalculo.length} {tieneHoy ? 'pedidos completados hoy' : 'pedidos completados'}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Ticket promedio {tieneHoy ? '(Hoy)' : ''}
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            {formatCurrency(ticketPromedio)}
          </p>
          <span className="mt-0.5 text-xs text-gray-500">Promedio por orden</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Histórico completados
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">{pedidos.length}</p>
          <span className="mt-0.5 text-xs text-gray-500">Total en este listado</span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Estado de cobro
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              100% Pagados
            </span>
          </div>
          <span className="mt-0.5 block text-xs text-gray-500">Todos conciliados</span>
        </div>
      </div>

      {/* Tabla limpia e intuitiva */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 pl-6 pr-3">Pedido</th>
                <th className="px-3 py-3.5">Hora / Fecha</th>
                <th className="px-3 py-3.5">Servicio</th>
                <th className="px-3 py-3.5">Platos / Ítems</th>
                <th className="px-3 py-3.5">Tipo de pago</th>
                <th className="px-3 py-3.5 text-right">Total</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidosOrdenados.map((pedido) => {
                const expandido = expandidoId === pedido.id
                return (
                  <FilaPedidoCompletado
                    key={pedido.id}
                    pedido={pedido}
                    expandido={expandido}
                    onToggleExpandir={() =>
                      setExpandidoId((curr) => (curr === pedido.id ? null : pedido.id))
                    }
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FilaPedidoCompletado({
  pedido,
  expandido,
  onToggleExpandir,
}: {
  pedido: Pedido
  expandido: boolean
  onToggleExpandir: () => void
}) {
  const { data: detalles = [] } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
  })

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos', pedido.id],
    queryFn: () => getPagosPedido(pedido.id),
  })

  const totalItems = useMemo(
    () => detalles.reduce((acc, d) => acc + (d.cantidad ?? 0), 0),
    [detalles],
  )

  const tipoPagoTexto = useMemo(() => {
    const tipos = Array.from(
      new Set(pagos.map((p) => p.tipo).filter((t): t is string => Boolean(t))),
    )
    if (tipos.length > 1) return 'COMBINADO'
    if (tipos.length === 1) return tipos[0]
    return detalles.find((d) => d.tipoPago)?.tipoPago ?? '—'
  }, [pagos, detalles])

  const servicioLabel = useMemo(() => {
    if (pedido.tipoServicio === 'MESA') {
      return pedido.numMesa != null ? `Mesa ${pedido.numMesa}` : 'En mesa'
    }
    if (pedido.tipoServicio === 'LLEVAR') return 'Para llevar'
    if (pedido.tipoServicio === 'DELIVERY') return 'Delivery'
    return pedido.tipoServicio ?? 'Mesa'
  }, [pedido.tipoServicio, pedido.numMesa])

  return (
    <>
      <tr
        onClick={onToggleExpandir}
        className="cursor-pointer transition-colors hover:bg-gray-50/70"
      >
        <td className="py-3.5 pl-6 pr-3 font-bold text-gray-900">
          <div className="flex items-center gap-2">
            <span>#{pedido.id}</span>
            {pedido.comentario && (
              <span
                title={pedido.comentario}
                className="inline-block h-2 w-2 rounded-full bg-amber-400"
              />
            )}
          </div>
        </td>

        <td className="whitespace-nowrap px-3 py-3.5 text-gray-600">
          <div className="font-semibold text-gray-800">{formatHora(pedido.fecha)}</div>
          <div className="text-xs text-gray-400">
            {pedido.fecha
              ? new Date(pedido.fecha).toLocaleDateString('es-EC', {
                  day: '2-digit',
                  month: 'short',
                })
              : '—'}
          </div>
        </td>

        <td className="whitespace-nowrap px-3 py-3.5">
          <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
            {servicioLabel}
          </span>
        </td>

        <td className="px-3 py-3.5 text-gray-600">
          <div className="flex items-center gap-1.5 font-medium">
            <span>
              {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
            </span>
            <span className="text-xs text-gray-400">
              ({detalles.length} {detalles.length === 1 ? 'plato' : 'platos'})
            </span>
          </div>
        </td>

        <td className="whitespace-nowrap px-3 py-3.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {ETIQUETA_TIPO_PAGO[tipoPagoTexto] ?? tipoPagoTexto}
          </span>
        </td>

        <td className="whitespace-nowrap px-3 py-3.5 text-right text-base font-black text-gray-900">
          {formatCurrency(pedido.total)}
        </td>

        <td className="whitespace-nowrap py-3.5 pl-3 pr-6 text-right">
          <span className="inline-flex items-center text-gray-400">
            {expandido ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </td>
      </tr>

      {expandido && (
        <tr className="bg-gray-50/50">
          <td colSpan={7} className="px-6 py-4">
            <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-2xs">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Detalle del pedido #{pedido.id}
              </p>
              <DetalleList pedido={pedido} pedidoId={pedido.id} />
            </div>
          </td>
        </tr>
      )}
    </>
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
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const temporizador = useRef<number | null>(null)
  const abrioPorToque = useRef(false)

  const { data: detalles } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
  })
  const cantidadProductos = (detalles ?? []).reduce(
    (acc, d) => acc + (d.cantidad ?? 0),
    0,
  )

  function cancelarPulsacion() {
    if (temporizador.current != null) {
      window.clearTimeout(temporizador.current)
      temporizador.current = null
    }
  }

  function iniciarPulsacion(e: TouchEvent) {
    cancelarPulsacion()
    abrioPorToque.current = false
    const { clientX, clientY } = e.touches[0]
    temporizador.current = window.setTimeout(() => {
      temporizador.current = null
      abrioPorToque.current = true
      setMenu({ x: clientX, y: clientY })
    }, 500)
  }

  function abrirMenu(e: MouseEvent) {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  useEffect(
    () => () => {
      if (temporizador.current != null) window.clearTimeout(temporizador.current)
    },
    [],
  )

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

  const prefijoPedido =
    pedido.tipoServicio === 'LLEVAR'
      ? 'Llevar'
      : pedido.tipoServicio === 'DELIVERY'
        ? 'Delivery'
        : 'Pedido'

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
  const mostrarMesa =
    pedido.numMesa != null &&
    pedido.tipoServicio !== 'LLEVAR' &&
    pedido.tipoServicio !== 'DELIVERY' &&
    pedido.tipoServicio !== 'APLICACION'
  const hayAcciones = !esCancelado && (esPendiente || esEntregado || !pagado)

  return (
    <>
      <div
        ref={ref}
        onContextMenu={abrirMenu}
        onTouchStart={iniciarPulsacion}
        onTouchMove={cancelarPulsacion}
        onTouchEnd={cancelarPulsacion}
        onTouchCancel={cancelarPulsacion}
        onClickCapture={(e) => {
          if (abrioPorToque.current) {
            abrioPorToque.current = false
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        className={`select-none rounded-2xl border border-gray-100 bg-white p-4 shadow-sm [-webkit-touch-callout:none] ${
          destacado ? 'ring-2 ring-orange-400' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            title={serviciolbl}
            aria-label={serviciolbl}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-800/80 text-white"
          >
            {mostrarMesa ? (
              <span className="text-2xl font-extrabold leading-none">{pedido.numMesa}</span>
            ) : (
              <IconoServicio className="h-7 w-7" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-700">
              {prefijoPedido} #{pedido.id}
            </span>
            {esPendiente && !pagado && (
              <button
                type="button"
                onClick={onEditar}
                aria-label="Editar pedido"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Cronometro fecha={pedido.fecha} activo={esPendiente} />
        </div>

        <button
          type="button"
          onClick={() => toggle(pedido.id)}
          aria-expanded={expanded}
          className="mt-3 flex w-full items-center justify-between border-t border-gray-100 pt-3 text-sm text-gray-500"
        >
          <span>
            {cantidadProductos} {cantidadProductos === 1 ? 'producto' : 'productos'}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-2 rounded-xl bg-gray-100 p-3">
            <DetalleList pedido={pedido} pedidoId={pedido.id} />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 px-1 py-1">
          <span className="text-base font-medium text-gray-600">Total</span>
          <span className="text-2xl font-extrabold text-gray-900">
            {formatCurrency(pedido.total)}
          </span>
        </div>

        {hayAcciones && (
          <div className="mt-3 flex justify-end gap-2">
            {esPendiente ? (
              <button
                type="button"
                disabled={mutando}
                onClick={onListo}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-100 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Listo
              </button>
            ) : esEntregado ? (
              <button
                type="button"
                disabled={mutando}
                onClick={onDeshacer}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
              >
                <CircleDollarSign className="h-4 w-4" />
                Cobrar
              </button>
            )}
          </div>
        )}
      </div>

      {menu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenu(null)
            }}
          />
          <div
            role="menu"
            style={{
              left: Math.max(8, Math.min(menu.x, window.innerWidth - 200)),
              top: Math.max(8, Math.min(menu.y, window.innerHeight - 110)),
            }}
            className="fixed z-50 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(null)
                onDividir()
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Users className="h-4 w-4" />
              Dividir
            </button>
            {esPendiente && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenu(null)
                  onCancelar()
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <Ban className="h-4 w-4" />
                Cancelar pedido
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

function Cronometro({ fecha, activo }: { fecha: string | null; activo: boolean }) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (!activo) return
    const id = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [activo])

  const inicio = fecha ? new Date(fecha).getTime() : Number.NaN

  if (!activo || Number.isNaN(inicio)) {
    return (
      <span className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-sm font-bold text-gray-600">
        {formatHora(fecha)}
      </span>
    )
  }

  const segundos = Math.max(0, Math.floor((ahora - inicio) / 1000))
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const dos = (n: number) => String(n).padStart(2, '0')
  const texto = h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`
  const demorado = segundos >= 15 * 60

  return (
    <span
      className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-base font-bold tabular-nums ${
        demorado ? 'border-red-300 text-red-600' : 'border-orange-300 text-orange-600'
      }`}
    >
      <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-medium leading-none text-gray-400">
        Tiempo
      </span>
      <Timer className="h-4 w-4" />
      {texto}
    </span>
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
    enabled: pedidoId != null && pedido.estadoPedido !== 'PENDIENTE',
  })

  const itemsMesa = useMemo(
    () => (detalles ?? []).filter((d) => !d.paraLlevar),
    [detalles],
  )
  const itemsLlevar = useMemo(
    () => (detalles ?? []).filter((d) => Boolean(d.paraLlevar)),
    [detalles],
  )

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
      {itemsMesa.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {itemsMesa.map((detalle) => (
            <li key={detalle.id} className="flex items-center gap-3 py-2.5 text-gray-900">
              <span className="w-10 shrink-0 text-lg font-semibold text-gray-500">
                {detalle.cantidad}x
              </span>
              <p className="min-w-0 flex-1 truncate text-lg font-semibold">
                {detalle.idPlato?.nombre ?? 'Plato'}
              </p>
              <span className="shrink-0 text-lg font-semibold">
                {formatCurrency(detalle.subtotal)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {itemsMesa.length > 0 && itemsLlevar.length > 0 && (
        <div className="relative my-2 flex items-center">
          <div className="flex-grow border-t border-gray-300" />
          <span className="mx-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Para llevar
          </span>
          <div className="flex-grow border-t border-gray-300" />
        </div>
      )}

      {itemsLlevar.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {itemsLlevar.map((detalle) => (
            <li key={detalle.id} className="flex items-center gap-3 py-2.5 text-gray-900">
              <span className="w-10 shrink-0 text-lg font-semibold text-gray-500">
                {detalle.cantidad}x
              </span>
              <p className="min-w-0 flex-1 truncate text-lg font-semibold">
                {detalle.idPlato?.nombre ?? 'Plato'}
              </p>
              <span className="shrink-0 text-lg font-semibold">
                {formatCurrency(detalle.subtotal)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {mostrarComentarioImportante ? (
        comentarioImportante && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
              Comentario
            </p>
            <p className="text-base font-semibold text-amber-900">{comentarioImportante}</p>
          </div>
        )
      ) : (
        <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base">
          <span className="text-gray-500">Tipo de pago</span>
          <span className="font-semibold text-gray-900">
            {tipoPago ? (ETIQUETA_TIPO_PAGO[tipoPago] ?? tipoPago) : '—'}
          </span>
        </div>
      )}
    </div>
  )
}
