import { useRef, useState } from 'react'
import type { PointerEvent, SyntheticEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  ChevronDown,
  ChevronRight,
  Layers3,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { getCajaAbierta } from '../api/caja'
import {
  getCategoriasActivas,
  getPlatosActivos,
} from '../api/catalogo'
import { createPedido } from '../api/pedidos'
import type { Plato } from '../types/catalogo'
import type { Pedido } from '../types/pos'
import { formatCurrency } from '../utils/format'
import { uuid } from '../utils/uuid'
import { CobroModal } from '../components/ui/CobroModal'

interface CartItem {
  plato: Plato
  cantidad: number
}

function PlatoCard({
  plato,
  onAdd,
  destacado = false,
}: {
  plato: Plato
  onAdd: (plato: Plato) => void
  destacado?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-3xl border bg-white transition-all hover:-translate-y-1 hover:shadow-md ${
        destacado
          ? 'border-2 border-orange-400 shadow-[0_0_0_1px_rgba(251,146,60,0.15)]'
          : 'border-gray-100'
      }`}
    >
      {plato.img ? (
        <img
          src={plato.img}
          alt={plato.nombre}
          className="h-28 rounded-t-3xl object-cover"
        />
      ) : (
        <div className="flex h-28 items-center justify-center rounded-t-3xl bg-orange-100 text-3xl font-bold text-orange-300">
          {plato.nombre.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold text-gray-900">{plato.nombre}</h3>
        <p className="line-clamp-2 text-sm text-gray-500">
          {plato.descripcion ?? 'Sin descripción'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(plato.precio)}
          </span>
          <button
            type="button"
            onClick={() => onAdd(plato)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function NewOrderPage() {
  const navigate = useNavigate()
  const { data: cajaAbierta, isLoading } = useQuery({
    queryKey: ['cajas', 'abierta'],
    queryFn: getCajaAbierta,
    retry: false,
    refetchInterval: 15_000,
  })

  if (isLoading) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Cargando...
      </p>
    )
  }

  if (!cajaAbierta) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <Banknote className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">La caja está cerrada</h1>
          <p className="mt-2 text-sm text-gray-500">
            Para registrar pedidos primero debes abrir la caja. Si aún no registras
            el inventario del día, hazlo primero desde el módulo de inventario.
          </p>
          <button
            type="button"
            onClick={() => navigate('/inventario?tab=caja')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Ir a caja
          </button>
        </div>
      </div>
    )
  }

  return <OrderPOS />
}

function OrderPOS() {
  const queryClient = useQueryClient()
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(
    new Set(),
  )
  const [busqueda, setBusqueda] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [tipoServicio, setTipoServicio] = useState('MESA')
  const [numMesa, setNumMesa] = useState('')
  const [comentario, setComentario] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cartDragOffset, setCartDragOffset] = useState(0)
  const idempotencyKeyRef = useRef<string | undefined>(undefined)
  const cartBarStartYRef = useRef<number | null>(null)
  const cartSheetStartYRef = useRef<number | null>(null)
  const [pedidoACobrar, setPedidoACobrar] = useState<Pedido | null>(null)

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategoriasActivas,
  })

  const { data: platos, isLoading } = useQuery({
    queryKey: ['platos', categoryId],
    queryFn: getPlatosActivos,
  })

  const categoriasRaiz = (categorias ?? []).filter(
    (categoria) => categoria.categoriaPadre == null,
  )
  const subcategorias = (categorias ?? []).filter(
    (categoria) => categoria.categoriaPadre?.id === categoryId,
  )
  const platosDeCategoria = (id: number | null) =>
    (platos ?? []).filter((plato) => plato.idCategoria?.id === id)

  const coincideBusqueda = (p: Plato) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  const platosDirectos =
    categoryId == null
      ? (platos ?? []).filter(coincideBusqueda)
      : platosDeCategoria(categoryId).filter(coincideBusqueda)

  const total = cart.reduce(
    (suma, item) => suma + (item.plato.precio ?? 0) * item.cantidad,
    0,
  )

  function addItem(plato: Plato) {
    setCart((prev) => {
      const existente = prev.find((i) => i.plato.id === plato.id)
      if (existente) {
        return prev.map((i) =>
          i.plato.id === plato.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        )
      }
      return [...prev, { plato, cantidad: 1 }]
    })
  }

  function setCantidad(platoId: number, cantidad: number) {
    setCart((prev) =>
      cantidad <= 0
        ? prev.filter((i) => i.plato.id !== platoId)
        : prev.map((i) => (i.plato.id === platoId ? { ...i, cantidad } : i)),
    )
  }

  const mutation = useMutation({
    mutationFn: async (_variables: { cobrar: boolean }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuid()
      }
      return createPedido({
        tipoServicio,
        numMesa: numMesa === '' ? undefined : Number(numMesa),
        comentario: comentario || undefined,
        idempotencyKey: idempotencyKeyRef.current,
        detalles: cart.map((i) => ({ idPlato: i.plato.id, cantidad: i.cantidad })),
      })
    },
    onSuccess: (pedido, variables) => {
      idempotencyKeyRef.current = undefined
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      if (variables.cobrar) {
        setPedidoACobrar(pedido)
      } else {
        setCart([])
        setNumMesa('')
        setComentario('')
        setCartOpen(false)
      }
    },
  })

  function handleCobrar(e: SyntheticEvent, cobrar: boolean) {
    e.preventDefault()
    if (cart.length === 0) return
    mutation.mutate({ cobrar })
  }

  function cerrarCobro() {
    setCart([])
    setNumMesa('')
    setComentario('')
    setCartOpen(false)
    setPedidoACobrar(null)
  }

  function handleCartBarPointerDown(event: PointerEvent<HTMLButtonElement>) {
    cartBarStartYRef.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleCartBarPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const startY = cartBarStartYRef.current
    cartBarStartYRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (startY !== null && startY - event.clientY > 60) {
      setCartOpen(true)
    }
  }

  function handleCartSheetPointerDown(event: PointerEvent<HTMLDivElement>) {
    cartSheetStartYRef.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleCartSheetPointerMove(event: PointerEvent<HTMLDivElement>) {
    const startY = cartSheetStartYRef.current
    if (startY !== null) {
      setCartDragOffset(Math.max(0, event.clientY - startY))
    }
  }

  function handleCartSheetPointerUp(event: PointerEvent<HTMLDivElement>) {
    const startY = cartSheetStartYRef.current
    cartSheetStartYRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (startY !== null && event.clientY - startY > 100) {
      setCartOpen(false)
    }
    setCartDragOffset(0)
  }

  function cancelCartSheetDrag(event: PointerEvent<HTMLDivElement>) {
    cartSheetStartYRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setCartDragOffset(0)
  }

  const panelProps = {
    cart,
    total,
    tipoServicio,
    numMesa,
    comentario,
    isPending: mutation.isPending,
    error: mutation.error,
    onSetCantidad: setCantidad,
    onTipoServicioChange: setTipoServicio,
    onNumMesaChange: setNumMesa,
    onComentarioChange: setComentario,
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Área central: productos */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-gray-100 bg-white px-6">
          <h1 className="text-lg font-bold text-gray-900">Nuevo pedido</h1>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white px-6 py-3">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryId == null
                ? 'bg-orange-50 text-orange-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todo
          </button>
          {categoriasRaiz.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              onClick={() => setCategoryId(categoria.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryId === categoria.id
                  ? 'bg-orange-50 text-orange-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-4 overflow-y-auto px-6 pt-6 pb-24 md:grid-cols-3 lg:grid-cols-4 lg:pb-6">
          {isLoading ? (
            <p className="col-span-full py-8 text-center text-sm text-gray-400">
              Cargando...
            </p>
          ) : categoryId != null && subcategorias.length === 0 && platosDirectos.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-gray-400">
              No hay platos para mostrar.
            </p>
          ) : (
            <>
              {subcategorias.map((categoria) => {
                const expanded = expandedSubcategories.has(categoria.id)
                const platosSubcategoria = platosDeCategoria(categoria.id).filter(
                  coincideBusqueda,
                )

                return (
                  <div key={categoria.id} className="contents">
                    <div className="flex flex-col overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 text-left transition-all hover:border-orange-300 hover:bg-orange-100 hover:shadow-md">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSubcategories((prev) => {
                            const next = new Set(prev)
                            if (next.has(categoria.id)) next.delete(categoria.id)
                            else next.add(categoria.id)
                            return next
                          })
                        }
                        className="group relative flex min-h-40 flex-col items-start justify-between p-5 text-left"
                      >
                        <span className="absolute right-4 top-4 rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold tracking-wide text-orange-700">
                          Subcategoría
                        </span>
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm transition-transform group-hover:scale-105">
                          {expanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </span>
                        <span className="mt-6">
                          <span className="flex items-center gap-2 text-lg font-bold text-sky-950">
                            <Layers3 className="h-4 w-4 text-orange-600" />
                            {categoria.nombre}
                          </span>
                          <span className="mt-1 block text-sm text-orange-700/80">
                            {platosSubcategoria.length} plato
                            {platosSubcategoria.length === 1 ? '' : 's'}
                          </span>
                        </span>
                      </button>
                      {expanded && (
                        <div className="border-t border-orange-200/80 px-3 pb-3">
                          {platosSubcategoria.length === 0 ? (
                            <p className="px-2 pt-3 text-sm text-orange-700/70">
                              No hay platos disponibles.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2 pt-3">
                              {platosSubcategoria.map((plato) => (
                                <div
                                  key={plato.id}
                                  className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-2.5"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-900">
                                      {plato.nombre}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatCurrency(plato.precio)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => addItem(plato)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
                                    aria-label={`Agregar ${plato.nombre}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {platosDirectos.map((p) => (
                <PlatoCard key={p.id} plato={p} onAdd={addItem} />
              ))}
            </>
          )}
        </div>
      </section>

      {/* Carrito de escritorio */}
      <aside className="hidden w-80 shrink-0 flex-col border-l border-gray-100 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] lg:flex">
        <OrderPanel
          {...panelProps}
          onClose={undefined}
          onSubmit={handleCobrar}
        />
      </aside>

      {/* Barra inferior móvil */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        onPointerDown={handleCartBarPointerDown}
        onPointerUp={handleCartBarPointerUp}
        className="fixed inset-x-0 bottom-0 z-30 flex touch-none items-center justify-between border-t border-gray-100 bg-white px-5 py-3 lg:hidden"
      >
        <ShoppingCartTotal total={total} count={cart.length} />
        <span className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
          <ShoppingBag className="h-4 w-4" />
          Ver pedido
        </span>
      </button>

      {/* Hoja inferior móvil (bottom sheet) */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrito del pedido"
            className="absolute inset-x-0 bottom-0 flex h-[85vh] flex-col rounded-t-3xl bg-white shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] transition-transform duration-200 motion-reduce:transition-none"
            style={{ transform: `translateY(${cartDragOffset}px)` }}
          >
            <OrderPanel
              {...panelProps}
              onClose={() => setCartOpen(false)}
              onSubmit={handleCobrar}
              onDragStart={handleCartSheetPointerDown}
              onDragMove={handleCartSheetPointerMove}
              onDragEnd={handleCartSheetPointerUp}
              onDragCancel={cancelCartSheetDrag}
            />
          </aside>
        </div>
      )}

      {pedidoACobrar && (
        <CobroModal
          pedido={pedidoACobrar}
          onClose={() => setPedidoACobrar(null)}
          onPaid={cerrarCobro}
        />
      )}
    </div>
  )
}

function ShoppingCartTotal({ total, count }: { total: number; count: number }) {
  return (
    <div className="text-left">
      <p className="text-xs text-gray-500">
        {count > 0 ? `${count} ${count === 1 ? 'producto' : 'productos'}` : 'Total'}
      </p>
      <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
    </div>
  )
}

interface OrderPanelProps {
  cart: CartItem[]
  total: number
  tipoServicio: string
  numMesa: string
  comentario: string
  isPending: boolean
  error: unknown
  onClose?: () => void
  onDragStart?: (event: PointerEvent<HTMLDivElement>) => void
  onDragMove?: (event: PointerEvent<HTMLDivElement>) => void
  onDragEnd?: (event: PointerEvent<HTMLDivElement>) => void
  onDragCancel?: (event: PointerEvent<HTMLDivElement>) => void
  onSetCantidad: (platoId: number, cantidad: number) => void
  onTipoServicioChange: (v: string) => void
  onNumMesaChange: (v: string) => void
  onComentarioChange: (v: string) => void
  onSubmit: (e: SyntheticEvent, pagar: boolean) => void
}

function OrderPanel({
  cart,
  total,
  tipoServicio,
  numMesa,
  comentario,
  isPending,
  error,
  onClose,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
  onSetCantidad,
  onTipoServicioChange,
  onNumMesaChange,
  onComentarioChange,
  onSubmit,
}: OrderPanelProps) {
  const hayItems = cart.length > 0

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div
          className="flex min-w-0 flex-1 touch-none items-center gap-4"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragCancel}
        >
          {onClose && (
            <span
              className="h-1.5 w-12 shrink-0 rounded-full bg-gray-200 lg:hidden"
              aria-hidden="true"
            />
          )}
          <div className="flex gap-6">
          <div>
            <p className="text-sm text-gray-500">Productos</p>
            <p className="text-lg font-bold text-gray-900">{cart.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(total)}
            </p>
          </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            Agrega productos para comenzar el pedido
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map((item) => (
              <div
                key={item.plato.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {item.plato.nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(item.plato.precio)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSetCantidad(item.plato.id, item.cantidad - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-900">
                    {item.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSetCantidad(item.plato.id, item.cantidad + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-colors hover:bg-orange-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="w-16 text-right text-sm font-bold text-gray-900">
                  {formatCurrency((item.plato.precio ?? 0) * item.cantidad)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 px-6 py-4">
        <div className="mb-3 flex flex-col gap-3">
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Servicio</span>
              <select
                value={tipoServicio}
                onChange={(e) => onTipoServicioChange(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="MESA">Mesa</option>
                <option value="LLEVAR">Para llevar</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                N. mesa
              </span>
              <input
                type="number"
                min={1}
                value={numMesa}
                onChange={(e) => onNumMesaChange(e.target.value)}
                placeholder="—"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Comentario</span>
            <input
              type="text"
              value={comentario}
              onChange={(e) => onComentarioChange(e.target.value)}
              placeholder="Notas para la cocina..."
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>

        {error ? (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Error al crear el pedido'}
          </p>
        ) : null}

        <div className="mb-1 flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="mb-1 flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button
          type="button"
          disabled={!hayItems || isPending}
          onClick={(e) => onSubmit(e, true)}
          className="mt-2 w-full rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
        >
          {isPending ? 'Procesando...' : 'Cobrar'}
        </button>
        <button
          type="button"
          disabled={!hayItems || isPending}
          onClick={(e) => onSubmit(e, false)}
          className="mt-2 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          Crear pedido (pago pendiente)
        </button>
      </footer>
    </div>
  )
}