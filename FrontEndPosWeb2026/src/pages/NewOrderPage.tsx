import { useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Banknote,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { getCajaAbierta } from '../api/caja'
import {
  getCategoriasActivas,
  getPlatos,
  getPlatosByCategoria,
} from '../api/catalogo'
import { cambiarEstadoPago, createPedido } from '../api/pedidos'
import type { Plato } from '../types/catalogo'
import { formatCurrency } from '../utils/format'
import { uuid } from '../utils/uuid'

interface CartItem {
  plato: Plato
  cantidad: number
}

export function NewOrderPage() {
  const navigate = useNavigate()
  const { data: cajaAbierta, isLoading } = useQuery({
    queryKey: ['cajas', 'abierta'],
    queryFn: getCajaAbierta,
    retry: false,
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
  const [busqueda, setBusqueda] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [tipoServicio, setTipoServicio] = useState('MESA')
  const [numMesa, setNumMesa] = useState('')
  const [comentario, setComentario] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const idempotencyKeyRef = useRef<string | undefined>(undefined)

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategoriasActivas,
  })

  const { data: platos, isLoading } = useQuery({
    queryKey: ['platos', categoryId],
    queryFn: () =>
      categoryId == null ? getPlatos() : getPlatosByCategoria(categoryId),
  })

  const platosFiltrados = (platos ?? []).filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()),
  )

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
    mutationFn: async ({ pagar }: { pagar: boolean }) => {
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = uuid()
      }
      const pedido = await createPedido({
        tipoServicio,
        numMesa: numMesa === '' ? undefined : Number(numMesa),
        comentario: comentario || undefined,
        idempotencyKey: idempotencyKeyRef.current,
        detalles: cart.map((i) => ({ idPlato: i.plato.id, cantidad: i.cantidad })),
      })
      if (pagar) {
        await cambiarEstadoPago(pedido.id, 'PAGADO')
      }
      return pedido
    },
    onSuccess: () => {
      idempotencyKeyRef.current = undefined
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      setCart([])
      setNumMesa('')
      setComentario('')
      setCartOpen(false)
    },
  })

  function handleCobrar(e: SyntheticEvent, pagar: boolean) {
    e.preventDefault()
    if (cart.length === 0) return
    mutation.mutate({ pagar })
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
    onCobrar: (pagar: boolean) => mutation.mutate({ pagar }),
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

        <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 bg-white px-6 py-3">
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
          {categorias?.map((categoria) => (
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
          ) : platosFiltrados.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-gray-400">
              No hay platos para mostrar.
            </p>
          ) : (
            platosFiltrados.map((p) => (
              <div
                key={p.id}
                className="flex flex-col rounded-3xl border border-gray-100 bg-white transition-all hover:-translate-y-1 hover:shadow-md"
              >
                {p.img ? (
                  <img
                    src={p.img}
                    alt={p.nombre}
                    className="h-28 rounded-t-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-t-3xl bg-orange-100 text-3xl font-bold text-orange-300">
                    {p.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-bold text-gray-900">{p.nombre}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {p.descripcion ?? 'Sin descripción'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(p.precio)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addItem(p)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
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
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-gray-100 bg-white px-5 py-3 lg:hidden"
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
          <aside className="absolute inset-x-0 bottom-0 flex h-[85vh] flex-col rounded-t-3xl bg-white shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)]">
            <OrderPanel
              {...panelProps}
              onClose={() => setCartOpen(false)}
              onSubmit={handleCobrar}
            />
          </aside>
        </div>
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