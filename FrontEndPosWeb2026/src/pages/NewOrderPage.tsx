import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, SyntheticEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  getTodasLasRecetas,
} from '../api/catalogo'
import { getUltimoInventario } from '../api/inventario'
import { createPedido, getDetallesPedido, getPedido, updatePedido } from '../api/pedidos'
import type { Plato } from '../types/catalogo'
import type { Pedido } from '../types/pos'
import { formatCurrency } from '../utils/format'
import { miniatura } from '../utils/miniatura'
import { getInventoryCheck } from '../utils/inventario'
import type { InventoryIssue } from '../utils/inventario'
import { playSound } from '../utils/sound'
import { volarAlCarrito } from '../utils/volarAlCarrito'
import { useNotificationsStore } from '../store/notifications'
import { uuid } from '../utils/uuid'
import { CobroModal } from '../components/ui/CobroModal'
import type { CartItem } from '../store/cart'
import { getPrecioUnitarioItem } from '../store/cart'

function PlatoCard({
  plato,
  onAdd,
  destacado = false,
}: {
  plato: Plato
  onAdd: (plato: Plato, card: HTMLElement) => void
  destacado?: boolean
}) {
  return (
    <button
      type="button"
      data-plato-card
      onClick={(e) => onAdd(plato, e.currentTarget)}
      className={`group flex flex-col overflow-hidden rounded-3xl border bg-white text-left transition-all hover:-translate-y-1 hover:shadow-md active:scale-[0.98] cursor-pointer ${
        destacado
          ? 'border-2 border-orange-400 shadow-[0_0_0_1px_rgba(251,146,60,0.15)]'
          : 'border-gray-100 hover:border-orange-200'
      }`}
    >
      {plato.img ? (
        <img
          src={miniatura(plato.img)}
          alt={plato.nombre}
          loading="lazy"
          decoding="async"
          className="h-28 w-full rounded-t-3xl object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-t-3xl bg-orange-100 text-3xl font-bold text-orange-300">
          {plato.nombre.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4 w-full">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
          {plato.nombre}
        </h3>
        <p className="line-clamp-2 text-sm text-gray-500">
          {plato.descripcion ?? 'Sin descripción'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(plato.precio)}
          </span>
        </div>
      </div>
    </button>
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const editPedidoIdParam = searchParams.get('pedidoId')
  const editPedidoId =
    editPedidoIdParam != null && editPedidoIdParam !== '' ? Number(editPedidoIdParam) : null
  const isEditMode = searchParams.get('mode') === 'edit' && editPedidoId != null && !Number.isNaN(editPedidoId)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(
    new Set(),
  )
  const [busqueda, setBusqueda] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [tipoServicio, setTipoServicio] = useState('MESA')
  const [numMesa, setNumMesa] = useState('')
  const [comentario, setComentario] = useState('')
  const [costoEnvio, setCostoEnvio] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [cartDragOffset, setCartDragOffset] = useState(0)
  const [inventoryWarning, setInventoryWarning] = useState('')
  const [stockToast, setStockToast] = useState<{ text: string; key: number } | null>(null)
  const silenciado = useNotificationsStore((s) => s.silenciado)
  const idempotencyKeyRef = useRef<string | undefined>(undefined)
  const cartBarStartYRef = useRef<number | null>(null)
  const cartSheetStartYRef = useRef<number | null>(null)
  const [pedidoACobrar, setPedidoACobrar] = useState<Pedido | null>(null)
  const [modoLlevar, setModoLlevar] = useState(false)

  const { data: pedidoEditar } = useQuery({
    queryKey: ['pedidos', editPedidoId],
    queryFn: () => getPedido(Number(editPedidoId)),
    enabled: isEditMode && editPedidoId != null,
  })

  const { data: detallesPedidoEditar = [] } = useQuery({
    queryKey: ['pedidos', editPedidoId, 'detalles'],
    queryFn: () => getDetallesPedido(Number(editPedidoId)),
    enabled: isEditMode && editPedidoId != null,
  })

  useEffect(() => {
    if (!isEditMode || detallesPedidoEditar.length === 0) return

    const nextCart = detallesPedidoEditar
      .filter((detalle) => detalle.idPlato != null)
      .map((detalle) => ({
        plato: detalle.idPlato as Plato,
        cantidad: detalle.cantidad ?? 0,
        paraLlevar: Boolean(detalle.paraLlevar),
      }))
      .filter((item) => item.cantidad > 0)

    setCart(nextCart)
    setTipoServicio(pedidoEditar?.tipoServicio ?? 'MESA')
    setNumMesa(pedidoEditar?.numMesa != null ? String(pedidoEditar.numMesa) : '')
    setComentario(pedidoEditar?.comentario ?? '')

    if (pedidoEditar?.tipoServicio === 'DELIVERY') {
      const base = nextCart.reduce(
        (suma, item) => suma + getPrecioUnitarioItem(item) * item.cantidad,
        0,
      )
      const envio = (pedidoEditar.total ?? 0) - base
      setCostoEnvio(envio > 0.005 ? envio.toFixed(2) : '')
    }
  }, [detallesPedidoEditar, isEditMode, pedidoEditar])

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategoriasActivas,
  })

  const { data: platos, isLoading } = useQuery({
    queryKey: ['platos', 'activos'],
    queryFn: getPlatosActivos,
    staleTime: 10 * 60 * 1000,
  })

  const { data: inventarioReal = [] } = useQuery({
    queryKey: ['inventario', 'ultimo'],
    queryFn: getUltimoInventario,
  })

  const { data: recetasPorPlato = {} } = useQuery({
    // Prefijo 'platos' para que catalogo:modificado (SSE) la invalide
    queryKey: ['platos', 'recetas'],
    queryFn: async () => {
      const recetas = await getTodasLasRecetas()
      const porPlato: Record<number, typeof recetas> = {}
      for (const receta of recetas) {
        const idPlato = receta.idPlato?.id
        if (idPlato == null) continue
        ;(porPlato[idPlato] ??= []).push(receta)
      }
      return porPlato
    },
    staleTime: 10 * 60 * 1000,
  })

  // Al editar, el stock del pedido original cuenta como disponible (solo para validar, sin movimientos).
  const inventarioActual = useMemo(() => {
    if (!isEditMode) return inventarioReal
    const devuelto = new Map<number, number>()
    for (const detalle of detallesPedidoEditar) {
      if (!detalle.idPlato || !detalle.cantidad) continue
      for (const receta of recetasPorPlato[detalle.idPlato.id] ?? []) {
        const productoId = receta.idProducto?.id
        if (productoId == null) continue
        devuelto.set(
          productoId,
          (devuelto.get(productoId) ?? 0) + (receta.cantidad ?? 0) * detalle.cantidad,
        )
      }
    }
    if (devuelto.size === 0) return inventarioReal
    return inventarioReal.map((registro) => {
      const extra = registro.idProducto ? devuelto.get(registro.idProducto.id) : undefined
      return extra ? { ...registro, cantidadActual: registro.cantidadActual + extra } : registro
    })
  }, [isEditMode, inventarioReal, detallesPedidoEditar, recetasPorPlato])

  const inventoryStatus = getInventoryCheck(cart, inventarioActual, recetasPorPlato)
  const inventorySummary = inventoryStatus.message
  const activeInventoryWarning = inventoryWarning || inventorySummary

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

  const subtotal = cart.reduce(
    (suma, item) => suma + getPrecioUnitarioItem(item) * item.cantidad,
    0,
  )
  const esDelivery = tipoServicio === 'DELIVERY'
  const envio = esDelivery ? Math.max(Number(costoEnvio) || 0, 0) : 0
  const total = subtotal + envio

  useEffect(() => {
    if (!stockToast) return
    const timer = setTimeout(() => setStockToast(null), 2200)
    return () => clearTimeout(timer)
  }, [stockToast])

  function avisarFaltante(issues: InventoryIssue[]) {
    const nombres = issues.slice(0, 3).map((i) => i.productName).join(', ')
    const resto = issues.length > 3 ? ` +${issues.length - 3}` : ''
    setStockToast({ text: `Falta: ${nombres}${resto}`, key: Date.now() })
  }

  function addItem(plato: Plato, paraLlevar = false, origen?: HTMLElement) {
    const existente = cart.find(
      (i) => i.plato.id === plato.id && i.paraLlevar === paraLlevar,
    )
    const nextCart = existente
      ? cart.map((i) =>
          i.plato.id === plato.id && i.paraLlevar === paraLlevar
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        )
      : [...cart, { plato, cantidad: 1, paraLlevar }]

    const validation = getInventoryCheck(nextCart, inventarioActual, recetasPorPlato)
    if (!validation.canContinue) {
      avisarFaltante(validation.issues)
      return
    }

    setInventoryWarning('')
    setCart(nextCart)
    if (!silenciado) playSound('agregar')
    if (origen) volarAlCarrito(origen, plato)
  }

  function handleCardClick(plato: Plato, card: HTMLElement) {
    const esParaLlevar =
      tipoServicio === 'LLEVAR' ||
      tipoServicio === 'DELIVERY' ||
      (tipoServicio === 'MESA' && modoLlevar)
    addItem(plato, esParaLlevar, card)
  }

  function setCantidad(platoId: number, paraLlevar: boolean, cantidad: number) {
    const nextCart =
      cantidad <= 0
        ? cart.filter((i) => !(i.plato.id === platoId && i.paraLlevar === paraLlevar))
        : cart.map((i) =>
            i.plato.id === platoId && i.paraLlevar === paraLlevar
              ? { ...i, cantidad }
              : i,
          )

    if (cantidad > 0) {
      const validation = getInventoryCheck(nextCart, inventarioActual, recetasPorPlato)
      if (!validation.canContinue) {
        avisarFaltante(validation.issues)
        return
      }
    }

    setInventoryWarning('')
    setCart(nextCart)
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
        costoEnvio: esDelivery ? envio : undefined,
        detalles: cart.map((i) => ({
          idPlato: i.plato.id,
          cantidad: i.cantidad,
          paraLlevar: i.paraLlevar,
        })),
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
        setCostoEnvio('')
        setCartOpen(false)
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePedido(Number(editPedidoId), {
        tipoServicio,
        numMesa: numMesa === '' ? undefined : Number(numMesa),
        comentario: comentario || undefined,
        costoEnvio: esDelivery ? envio : undefined,
        detalles: cart.map((i) => ({
          idPlato: i.plato.id,
          cantidad: i.cantidad,
          paraLlevar: i.paraLlevar,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', editPedidoId, 'detalles'] })
      navigate('/pedidos')
    },
  })

  function handleCobrar(e: SyntheticEvent, cobrar = false) {
    e.preventDefault()
    if (cart.length === 0) return

    if (tipoServicio === 'MESA' && (!numMesa || numMesa.trim() === '')) {
      setInventoryWarning('Debes seleccionar el número de mesa para continuar.')
      return
    }

    const validation = getInventoryCheck(cart, inventarioActual, recetasPorPlato)
    if (!validation.canContinue) {
      setInventoryWarning(validation.message)
      return
    }

    mutation.mutate({ cobrar })
  }

  function handleGuardarPedido(e: SyntheticEvent) {
    e.preventDefault()

    if (!isEditMode || editPedidoId == null) return
    if (cart.length === 0) {
      setInventoryWarning('Debes dejar al menos un plato en el pedido.')
      return
    }

    if (tipoServicio === 'MESA' && (!numMesa || numMesa.trim() === '')) {
      setInventoryWarning('Debes seleccionar el número de mesa para continuar.')
      return
    }

    const validation = getInventoryCheck(cart, inventarioActual, recetasPorPlato)
    if (!validation.canContinue) {
      setInventoryWarning(validation.message)
      return
    }

    updateMutation.mutate()
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

  const pageTitle = isEditMode ? `Editar pedido${pedidoEditar?.id ? ` #${pedidoEditar.id}` : ''}` : 'Nuevo pedido'
  const closeOrder = () => {
    if (isEditMode) {
      navigate('/pedidos')
      return
    }
    setCartOpen(false)
  }

  function handleTipoServicioChange(nuevoTipo: string) {
    setTipoServicio(nuevoTipo)
    if (nuevoTipo === 'DELIVERY' || nuevoTipo === 'LLEVAR') {
      setCart((prev) => prev.map((item) => ({ ...item, paraLlevar: true })))
    } else if (nuevoTipo === 'MESA') {
      // Si cambia a mesa, si no estaba en modo llevar, reasigna a mesa
      if (!modoLlevar) {
        setCart((prev) => prev.map((item) => ({ ...item, paraLlevar: false })))
      }
    }
  }

  const panelProps: OrderPanelProps = {
    cart,
    subtotal,
    total,
    tipoServicio,
    numMesa,
    comentario,
    costoEnvio,
    mode: isEditMode ? 'edit' : 'create',
    isPending: isEditMode ? updateMutation.isPending : mutation.isPending,
    error: isEditMode ? updateMutation.error : mutation.error,
    inventoryWarning: activeInventoryWarning,
    onSetCantidad: setCantidad,
    onTipoServicioChange: handleTipoServicioChange,
    onNumMesaChange: setNumMesa,
    onComentarioChange: setComentario,
    onCostoEnvioChange: setCostoEnvio,
    onClose: closeOrder,
    onSubmit: isEditMode ? handleGuardarPedido : handleCobrar,
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Área central: productos */}
      <section className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b border-gray-100 bg-white px-4 sm:px-6">
          <h1 className="text-lg font-bold text-gray-900 shrink-0">{pageTitle}</h1>

          {/* Toggle de modo para pedidos en Mesa */}
          {tipoServicio === 'MESA' && (
            <div className="flex items-center rounded-2xl bg-gray-100 p-1 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setModoLlevar(false)}
                className={`rounded-xl px-2.5 sm:px-3 py-1.5 transition-all cursor-pointer ${
                  !modoLlevar
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                En mesa
              </button>
              <button
                type="button"
                onClick={() => setModoLlevar(true)}
                className={`rounded-xl px-2.5 sm:px-3 py-1.5 transition-all cursor-pointer ${
                  modoLlevar
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Para llevar
              </button>
            </div>
          )}

          <div className="relative ml-auto min-w-0 max-w-[160px] sm:max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full rounded-full border border-gray-200 py-1.5 sm:py-2 pl-9 pr-3 text-xs sm:text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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
                      className="group relative flex min-h-40 flex-col items-start justify-between overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 p-5 text-left transition-all hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-100 hover:shadow-md"
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
                    {expanded &&
                      platosSubcategoria.map((p) => (
                        <PlatoCard
                          key={p.id}
                          plato={p}
                          onAdd={handleCardClick}
                          destacado
                        />
                      ))}
                  </div>
                )
              })}
              {platosDirectos.map((p) => (
                <PlatoCard key={p.id} plato={p} onAdd={handleCardClick} />
              ))}
            </>
          )}
        </div>
      </section>

      {/* Carrito de escritorio */}
      <aside
        data-cart-target
        className="hidden w-80 lg:w-[340px] shrink-0 flex-col border-l border-gray-100 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] lg:flex"
      >
        <OrderPanel {...panelProps} />
      </aside>

      {/* Barra inferior móvil */}
      <button
        type="button"
        data-cart-target
        onClick={() => setCartOpen(true)}
        onPointerDown={handleCartBarPointerDown}
        onPointerUp={handleCartBarPointerUp}
        className="fixed inset-x-0 bottom-0 z-30 flex touch-none items-center justify-between border-t border-gray-100 bg-white px-5 py-3 lg:hidden"
      >
        <ShoppingCartTotal
          total={total}
          count={cart.reduce((sum, item) => sum + item.cantidad, 0)}
        />
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
            className="absolute inset-x-0 bottom-0 flex h-[90vh] sm:h-[85vh] flex-col rounded-t-3xl bg-white shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] transition-transform duration-200 motion-reduce:transition-none"
            style={{ transform: `translateY(${cartDragOffset}px)` }}
          >
            <OrderPanel
              {...panelProps}
              onDragStart={handleCartSheetPointerDown}
              onDragMove={handleCartSheetPointerMove}
              onDragEnd={handleCartSheetPointerUp}
              onDragCancel={cancelCartSheetDrag}
            />
          </aside>
        </div>
      )}

      {stockToast && (
        <div
          key={stockToast.key}
          role="status"
          aria-live="polite"
          className="toast-in pointer-events-none fixed bottom-24 left-1/2 z-50 max-w-[80vw] -translate-x-1/2 truncate rounded-full bg-gray-900/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg lg:bottom-6"
        >
          {stockToast.text}
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
  subtotal: number
  total: number
  tipoServicio: string
  numMesa: string
  comentario: string
  costoEnvio: string
  inventoryWarning?: string
  mode?: 'create' | 'edit'
  isPending: boolean
  error: unknown
  onClose?: () => void
  onDragStart?: (event: PointerEvent<HTMLDivElement>) => void
  onDragMove?: (event: PointerEvent<HTMLDivElement>) => void
  onDragEnd?: (event: PointerEvent<HTMLDivElement>) => void
  onDragCancel?: (event: PointerEvent<HTMLDivElement>) => void
  onSetCantidad: (platoId: number, paraLlevar: boolean, cantidad: number) => void
  onTipoServicioChange: (v: string) => void
  onNumMesaChange: (v: string) => void
  onComentarioChange: (v: string) => void
  onCostoEnvioChange: (v: string) => void
  onSubmit: (e: SyntheticEvent, pagar?: boolean) => void
}

function CantidadInput({
  value,
  label,
  onCommit,
}: {
  value: number
  label: string
  onCommit: (cantidad: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  // Si la validación rechaza el valor, el campo vuelve a la cantidad vigente.
  function confirmar() {
    const n = Math.min(Number(draft), 999)
    setDraft(String(value))
    if (draft === '' || !Number.isInteger(n) || n < 1 || n === value) return
    onCommit(n)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      className="w-8 sm:w-9 rounded-lg border border-gray-200 bg-white py-0.5 text-center text-xs font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-100 sm:text-sm"
    />
  )
}

function OrderPanel({
  cart,
  subtotal,
  total,
  tipoServicio,
  numMesa,
  comentario,
  costoEnvio,
  inventoryWarning,
  mode = 'create',
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
  onCostoEnvioChange,
  onSubmit,
}: OrderPanelProps) {
  const hayItems = cart.length > 0
  const isEditMode = mode === 'edit'
  const totalUnidades = cart.reduce((acc, item) => acc + item.cantidad, 0)
  const faltaMesa = tipoServicio === 'MESA' && (!numMesa || numMesa.trim() === '')

  const cartOrdenado = useMemo(() => {
    return [...cart].sort((a, b) => {
      const aLlevar = Boolean(a.paraLlevar)
      const bLlevar = Boolean(b.paraLlevar)
      if (aLlevar === bLlevar) return 0
      return aLlevar ? 1 : -1
    })
  }, [cart])

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-2.5 sm:px-6 sm:py-3">
        <div
          className="flex min-w-0 flex-1 touch-none items-center gap-3"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragCancel}
        >
          {onClose && (
            <span
              className="h-1.5 w-10 shrink-0 rounded-full bg-gray-300 lg:hidden"
              aria-hidden="true"
            />
          )}
          <span className="text-base font-bold text-gray-900 sm:text-lg">
            Productos #{totalUnidades}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-2 sm:px-6 sm:py-3">
        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Agrega productos para comenzar el pedido
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2.5">
            {cartOrdenado.map((item, index) => {
              const precioUnitario = getPrecioUnitarioItem(item)
              const subtotalItem = precioUnitario * item.cantidad
              const itemKey = `${item.plato.id}-${item.paraLlevar ? 'llevar' : 'mesa'}`
              const isFirstLlevar =
                item.paraLlevar && (index === 0 || !cartOrdenado[index - 1]?.paraLlevar)
              const hasMixed =
                cartOrdenado.some((x) => !x.paraLlevar) && cartOrdenado.some((x) => x.paraLlevar)

              return (
                <div key={itemKey}>
                  {isFirstLlevar && hasMixed && (
                    <div className="relative my-2.5 flex items-center">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="mx-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Para llevar
                      </span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>
                  )}

                  {/* Formato vertical / móvil (< lg): fila ultra-compacta para ver muchos productos */}
                  <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-xs lg:hidden">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-900">
                        {item.plato.nombre}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {formatCurrency(precioUnitario)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSetCantidad(item.plato.id, item.paraLlevar, item.cantidad - 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:scale-95"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <CantidadInput
                        key={`mob-${itemKey}-${item.cantidad}`}
                        value={item.cantidad}
                        label={`Cantidad de ${item.plato.nombre} (${item.paraLlevar ? 'llevar' : 'mesa'})`}
                        onCommit={(n) => onSetCantidad(item.plato.id, item.paraLlevar, n)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onSetCantidad(item.plato.id, item.paraLlevar, item.cantidad + 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500 text-white transition-colors hover:bg-orange-600 active:scale-95"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-14 text-right text-xs font-bold text-gray-900">
                      {formatCurrency(subtotalItem)}
                    </span>
                  </div>

                  {/* Formato horizontal / Desktop y Tablets (>= lg): nombre completo arriba para leer todo */}
                  <div className="hidden lg:flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug text-gray-900 break-words flex-1 min-w-0">
                        {item.plato.nombre}
                      </h4>
                      <span className="shrink-0 text-sm font-black text-gray-900">
                        {formatCurrency(subtotalItem)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        {formatCurrency(precioUnitario)} c/u
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onSetCantidad(item.plato.id, item.paraLlevar, item.cantidad - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:scale-95"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <CantidadInput
                          key={`desk-${itemKey}-${item.cantidad}`}
                          value={item.cantidad}
                          label={`Cantidad de ${item.plato.nombre} (${item.paraLlevar ? 'llevar' : 'mesa'})`}
                          onCommit={(n) => onSetCantidad(item.plato.id, item.paraLlevar, n)}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onSetCantidad(item.plato.id, item.paraLlevar, item.cantidad + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white transition-colors hover:bg-orange-600 active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {inventoryWarning ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                {inventoryWarning}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-gray-100 bg-white px-3 py-2.5 sm:px-6 sm:py-3.5">
        <div className="mb-2 flex flex-col gap-1.5 sm:gap-2">
          {tipoServicio === 'MESA' ? (
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-gray-500">Servicio</span>
                <select
                  value={tipoServicio}
                  onChange={(e) => {
                    onTipoServicioChange(e.target.value)
                    if (e.target.value !== 'MESA') onNumMesaChange('')
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-orange-500 sm:text-sm"
                >
                  <option value="MESA">Mesa</option>
                  <option value="LLEVAR">Para llevar</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                  Mesa <span className="text-red-500 font-bold">*</span>
                </span>
                <select
                  value={numMesa}
                  onChange={(e) => onNumMesaChange(e.target.value)}
                  className={`rounded-xl border bg-gray-50 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-orange-500 sm:text-sm ${
                    !numMesa ? 'border-amber-300 text-amber-900' : 'border-gray-200 text-gray-800'
                  }`}
                >
                  <option value="">Selecciona mesa...</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Mesa {m}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-gray-500">Servicio</span>
                <select
                  value={tipoServicio}
                  onChange={(e) => onTipoServicioChange(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-800 outline-none focus:border-orange-500 sm:text-sm"
                >
                  <option value="MESA">Mesa</option>
                  <option value="LLEVAR">Para llevar</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </label>
              {tipoServicio === 'DELIVERY' && (
                <label className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-gray-500">Costo envío</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costoEnvio}
                    onChange={(e) => onCostoEnvioChange(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs outline-none focus:border-orange-500 sm:text-sm"
                  />
                </label>
              )}
            </div>
          )}

          <input
            type="text"
            value={comentario}
            onChange={(e) => onComentarioChange(e.target.value)}
            placeholder="Comentario o notas de cocina..."
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-orange-500"
          />
        </div>

        {error ? (
          <p className="mb-1.5 rounded-xl bg-red-50 px-3 py-1 text-xs text-red-600">
            {error instanceof Error ? error.message : 'Error al crear el pedido'}
          </p>
        ) : null}

        <div className="flex items-baseline justify-between border-t border-gray-100 pt-1.5 pb-1 text-gray-900">
          <span className="text-xs text-gray-500">
            Subtotal: {formatCurrency(subtotal)}
            {tipoServicio === 'DELIVERY' && Number(costoEnvio) > 0 && (
              <span className="ml-1 text-[11px]">
                (+{formatCurrency(Number(costoEnvio))} envío)
              </span>
            )}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-semibold text-gray-500">Total:</span>
            <span className="text-base font-black text-gray-900 sm:text-lg">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {isEditMode ? (
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:py-2.5 sm:text-sm"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={!hayItems || isPending || faltaMesa}
              title={faltaMesa ? 'Debes seleccionar una mesa' : undefined}
              onClick={(e) => onSubmit(e, false)}
              className="flex-1 rounded-xl bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 sm:py-2.5 sm:text-sm"
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        ) : (
          <div className="mt-1.5 flex gap-2">
            <button
              type="button"
              disabled={!hayItems || isPending || faltaMesa}
              title={faltaMesa ? 'Debes seleccionar una mesa' : undefined}
              onClick={(e) => onSubmit(e, true)}
              className="flex-1 rounded-xl bg-green-500 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-600 active:scale-[0.99] disabled:opacity-50 sm:py-2.5 sm:text-sm"
            >
              {isPending ? '...' : 'Cobrar'}
            </button>
            <button
              type="button"
              disabled={!hayItems || isPending || faltaMesa}
              title={faltaMesa ? 'Debes seleccionar una mesa' : undefined}
              onClick={(e) => onSubmit(e, false)}
              className="flex-1 rounded-xl bg-orange-500 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50 sm:py-2.5 sm:text-sm"
            >
              Crear pedido
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}