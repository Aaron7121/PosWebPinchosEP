import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Delete, Plus, Trash2, UserRound } from 'lucide-react'
import { createPago, getPagosPedido } from '../../api/pagos'
import type { ClientePagoRequest, DetallePedido, PagoItemRequest, Pedido } from '../../types/pos'
import { formatCurrency, formatFecha, todayISO } from '../../utils/format'

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
] as const

const BILLETES = [5, 10, 20, 50, 100] as const

const KEYPAD_KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', 'BACKSPACE',
] as const

interface Linea {
  key: number
  tipo: string
  monto: string
}

export function CobroForm({
  pedido,
  onSuccess,
  detalles,
  isLoadingDetalles = false,
  onCobrar,
}: {
  pedido: Pedido
  onSuccess?: () => void
  detalles?: DetallePedido[]
  isLoadingDetalles?: boolean
  onCobrar?: (data: {
    cliente?: ClientePagoRequest
    pagos: PagoItemRequest[]
  }) => Promise<void>
}) {
  const queryClient = useQueryClient()
  const isDraft = !pedido.id || pedido.id === 0
  const totalInicial = pedido.total ?? 0
  const [lineas, setLineas] = useState<Linea[]>([
    { key: 1, tipo: 'EFECTIVO', monto: totalInicial > 0 ? totalInicial.toFixed(2) : '' },
  ])
  const [nextKey, setNextKey] = useState(2)
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const montoInicializadoRef = useRef(totalInicial > 0)

  const clienteInicial =
    pedido.idCliente && typeof pedido.idCliente === 'object'
      ? (pedido.idCliente as {
          cedula?: string
          nombre?: string
          telefono?: string
          correo?: string
        })
      : null

  const [conCliente, setConCliente] = useState(
    Boolean(clienteInicial?.nombre || clienteInicial?.cedula),
  )
  const [cedula, setCedula] = useState(clienteInicial?.cedula ?? '')
  const [nombre, setNombre] = useState(clienteInicial?.nombre ?? '')
  const [telefono, setTelefono] = useState(clienteInicial?.telefono ?? '')
  const [correo, setCorreo] = useState(clienteInicial?.correo ?? '')

  const { data: pagos } = useQuery({
    queryKey: ['pagos', pedido.id],
    queryFn: () => getPagosPedido(pedido.id),
    enabled: !isDraft,
  })

  const pagado = useMemo(
    () => (pagos ?? []).reduce((acc, p) => acc + (p.total ?? 0), 0),
    [pagos],
  )
  const total = pedido.total ?? 0
  const restante = Math.max(0, total - pagado)

  const subtotal = useMemo(
    () => (detalles ?? []).reduce((acc, d) => acc + (d.subtotal ?? 0), 0),
    [detalles],
  )
  const totalItems = useMemo(
    () => (detalles ?? []).reduce((acc, d) => acc + (d.cantidad ?? 1), 0),
    [detalles],
  )

  const parseMonto = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  const montos = lineas.map((l) => Number(l.monto))
  const todoValido = montos.every((m) => Number.isFinite(m) && m > 0)

  const transferenciaCents = Math.round(
    lineas
      .filter((l) => l.tipo === 'TRANSFERENCIA')
      .reduce((acc, l) => acc + parseMonto(l.monto), 0) * 100,
  )
  const efectivoCents = Math.round(
    lineas
      .filter((l) => l.tipo === 'EFECTIVO')
      .reduce((acc, l) => acc + parseMonto(l.monto), 0) * 100,
  )
  const restanteCents = Math.round(restante * 100)

  const aplicadoEfectivoCents = Math.max(0, restanteCents - transferenciaCents)
  const cambioCents = efectivoCents - aplicadoEfectivoCents
  const faltanteCents = restanteCents - transferenciaCents - efectivoCents
  const excesoTransferencia = transferenciaCents > restanteCents

  const puedeCobrar = todoValido && !excesoTransferencia && faltanteCents <= 0

  const safeActiveIndex = Math.min(
    Math.max(0, activeLineIndex),
    Math.max(0, lineas.length - 1),
  )
  const activeLinea = lineas[safeActiveIndex] ?? lineas[0]

  const mutation = useMutation({
    mutationFn: async () => {
      const clienteData =
        conCliente && (cedula || nombre || telefono || correo)
          ? {
              cedula: cedula.trim() || undefined,
              nombre: nombre.trim() || undefined,
              telefono: telefono.trim() || undefined,
              correo: correo.trim() || undefined,
            }
          : undefined

      const pagosData: PagoItemRequest[] = [
        ...lineas
          .filter((l) => l.tipo === 'TRANSFERENCIA')
          .map((l) => ({ tipo: 'TRANSFERENCIA', monto: Number(l.monto) })),
        ...(aplicadoEfectivoCents > 0
          ? [{ tipo: 'EFECTIVO', monto: aplicadoEfectivoCents / 100 }]
          : []),
      ]

      if (onCobrar) {
        await onCobrar({
          cliente: clienteData,
          pagos: pagosData,
        })
        return
      }

      return createPago({
        idPedido: pedido.id,
        cliente: clienteData,
        pagos: pagosData,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
      if (!isDraft) {
        queryClient.invalidateQueries({ queryKey: ['pagos', pedido.id] })
      }
      onSuccess?.()
    },
  })

  useEffect(() => {
    if (!montoInicializadoRef.current && restante > 0) {
      setLineas((prev) => {
        if (prev.length === 1 && (prev[0].monto === '' || Number(prev[0].monto) === 0)) {
          return [{ ...prev[0], monto: restante.toFixed(2) }]
        }
        return prev
      })
      montoInicializadoRef.current = true
    }
  }, [restante])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLTextAreaElement) return
        if (puedeCobrar && !mutation.isPending) {
          e.preventDefault()
          mutation.mutate()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [puedeCobrar, mutation])

  function actualizar(index: number, cambios: Partial<Linea>) {
    setLineas((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l
        const updated = { ...l, ...cambios }
        // Validación 1: Al seleccionar Transferencia, se asigna automáticamente el monto exacto pendiente
        if (cambios.tipo === 'TRANSFERENCIA') {
          const otrasLineasCents = prev
            .filter((_, idx) => idx !== index)
            .reduce((acc, item) => acc + Math.round(parseMonto(item.monto) * 100), 0)
          const pendienteCents = Math.max(0, restanteCents - otrasLineasCents)
          updated.monto = (pendienteCents / 100).toFixed(2)
        }
        return updated
      }),
    )
  }

  function agregarLinea() {
    setLineas((prev) => [
      ...prev,
      { key: nextKey, tipo: 'EFECTIVO', monto: '' },
    ])
    setActiveLineIndex(lineas.length)
    setNextKey((k) => k + 1)
  }

  function quitarLinea(index: number) {
    setLineas((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [{ key: 1, tipo: 'EFECTIVO', monto: '' }]
    })
    setActiveLineIndex((prev) => Math.max(0, prev - 1))
  }

  function handleAmountChange(val: string) {
    // Si la línea activa es transferencia, se bloquea la edición manual (solo permite el monto exacto)
    if (activeLinea?.tipo === 'TRANSFERENCIA') {
      return
    }
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      actualizar(safeActiveIndex, { monto: val })
    }
  }

  function handleSetMonto(val: string) {
    if (activeLinea?.tipo === 'TRANSFERENCIA') {
      return
    }
    actualizar(safeActiveIndex, { monto: val })
  }

  function handleExacto() {
    const otrasLineasCents = lineas
      .filter((_, i) => i !== safeActiveIndex)
      .reduce((acc, l) => acc + Math.round(parseMonto(l.monto) * 100), 0)
    const pendienteLinea = Math.max(0, restanteCents - otrasLineasCents) / 100
    actualizar(safeActiveIndex, {
      monto: pendienteLinea > 0 ? pendienteLinea.toFixed(2) : restante.toFixed(2),
    })
  }

  function handleKeypadPress(key: string) {
    if (activeLinea?.tipo === 'TRANSFERENCIA') {
      return
    }
    const current = activeLinea?.monto ?? ''
    if (key === 'BACKSPACE') {
      actualizar(safeActiveIndex, { monto: current.slice(0, -1) })
      return
    }
    if (key === '.') {
      if (current.includes('.')) return
      actualizar(safeActiveIndex, { monto: current ? current + '.' : '0.' })
      return
    }
    // Números 0-9
    if (current === '0') {
      actualizar(safeActiveIndex, { monto: key })
      return
    }
    if (current.includes('.')) {
      const [, dec] = current.split('.')
      if (dec && dec.length >= 2) return
    }
    actualizar(safeActiveIndex, { monto: current + key })
  }

  const tipoServicioLabel = useMemo(() => {
    if (pedido.tipoServicio === 'MESA') {
      return pedido.numMesa ? `Mesa ${pedido.numMesa}` : 'En mesa'
    }
    if (pedido.tipoServicio === 'LLEVAR') return 'Para llevar'
    if (pedido.tipoServicio === 'DELIVERY') return 'A domicilio'
    return pedido.tipoServicio ?? 'Consumo en local'
  }, [pedido.tipoServicio, pedido.numMesa])

  const mesaBadgeText = useMemo(() => {
    if (pedido.numMesa) return `M${pedido.numMesa}`
    if (pedido.tipoServicio === 'LLEVAR') return 'Llev.'
    if (pedido.tipoServicio === 'DELIVERY') return 'Deliv.'
    return isDraft ? 'Nuevo' : `#${pedido.id}`
  }, [pedido.numMesa, pedido.tipoServicio, pedido.id, isDraft])

  const itemsMesa = useMemo(
    () => (detalles ?? []).filter((d) => !d.paraLlevar),
    [detalles],
  )
  const itemsLlevar = useMemo(
    () => (detalles ?? []).filter((d) => Boolean(d.paraLlevar)),
    [detalles],
  )

  // Columna Izquierda: Información del cliente y Detalle del pedido
  const resumenIzquierda = (
    <div className="flex flex-col gap-3.5">
      {/* Tarjeta de Información del Cliente */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-sm font-extrabold text-gray-900 shadow-sm">
              {mesaBadgeText}
            </div>
            <div>
              <h4 className="text-sm font-bold leading-tight text-gray-900">
                {conCliente && nombre.trim() ? nombre : 'Consumidor Final'}
              </h4>
              <p className="mt-0.5 text-xs text-gray-500">
                {isDraft ? tipoServicioLabel : `#${pedido.id} · ${tipoServicioLabel}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-[11px] font-medium text-gray-400">
              {formatFecha(pedido.fecha ?? todayISO())}
            </span>
            <button
              type="button"
              onClick={() => setConCliente((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100/60"
            >
              <UserRound className="h-3 w-3" />
              {conCliente ? 'Quitar datos' : '+ Datos cliente'}
            </button>
          </div>
        </div>

        {conCliente && (
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200/70 pt-3">
            <input
              type="text"
              inputMode="numeric"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Cédula / RUC"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre cliente"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Correo electrónico"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        )}
      </div>

      {/* Tarjeta de Resumen del Pedido */}
      <div className="flex flex-1 flex-col rounded-2xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200/70 pb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Detalle del pedido
          </h4>
          <span className="text-xs font-semibold text-gray-500">
            {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        <div className="my-2.5 max-h-[220px] min-h-[120px] flex-1 space-y-2.5 overflow-y-auto pr-1 md:max-h-[280px]">
          {isLoadingDetalles ? (
            <p className="py-8 text-center text-xs text-gray-400">
              Cargando ítems del pedido...
            </p>
          ) : !detalles || detalles.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">
              Sin detalles registrados
            </p>
          ) : (
            <div className="space-y-2">
              {itemsMesa.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start justify-between gap-2 border-b border-gray-100/90 pb-2 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold leading-snug text-gray-800">
                      {d.idPlato?.nombre ?? 'Plato'}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-gray-600">
                      {formatCurrency(d.subtotal)}
                      {d.cantidad && d.cantidad > 1 && d.precioUnitario ? (
                        <span className="ml-1 font-normal text-gray-400">
                          ({formatCurrency(d.precioUnitario)} c/u)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-gray-200/70 px-2 py-0.5 text-xs font-bold text-gray-700">
                    {d.cantidad}x
                  </span>
                </div>
              ))}

              {itemsMesa.length > 0 && itemsLlevar.length > 0 && (
                <div className="relative my-2.5 flex items-center">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="mx-2 shrink-0 text-[11px] font-medium text-gray-400">
                    Para llevar
                  </span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>
              )}

              {itemsLlevar.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start justify-between gap-2 border-b border-gray-100/90 pb-2 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold leading-snug text-gray-800">
                      {d.idPlato?.nombre ?? 'Plato'}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-gray-600">
                      {formatCurrency(d.subtotal)}
                      {d.cantidad && d.cantidad > 1 && d.precioUnitario ? (
                        <span className="ml-1 font-normal text-gray-400">
                          ({formatCurrency(d.precioUnitario)} c/u)
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-gray-200/70 px-2 py-0.5 text-xs font-bold text-gray-700">
                    {d.cantidad}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 border-t border-gray-200/70 pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-2 border-t border-gray-200/80">
            <span className="text-base font-extrabold text-gray-800">Total</span>
            <span className="text-3xl font-black tracking-tight text-orange-600 sm:text-4xl lg:text-5xl">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  // Columna Derecha: Método, Monto, Billetes, Teclado Numérico y Botón de Cobro
  const cobroDerecha = (
    <div className="flex flex-col gap-3">
      {/* Selector de Método de Pago */}
      {lineas.length === 1 ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Método de pago
            </label>
            <button
              type="button"
              onClick={agregarLinea}
              className="flex items-center gap-1 text-xs font-semibold text-orange-500 transition-colors hover:text-orange-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Dividir método
            </button>
          </div>
          <div className="relative">
            <select
              value={lineas[0].tipo}
              onChange={(e) => actualizar(0, { tipo: e.target.value })}
              className="w-full cursor-pointer appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base font-extrabold text-gray-900 tracking-wide outline-none transition-colors hover:bg-gray-100/70 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
            >
              {METODOS.map((m) => (
                <option key={m.value} value={m.value} className="text-base font-bold py-1">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Métodos de pago divididos ({lineas.length})
            </span>
            <button
              type="button"
              onClick={agregarLinea}
              className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar otro
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {lineas.map((linea, index) => (
              <div
                key={linea.key}
                onClick={() => setActiveLineIndex(index)}
                className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-2 transition-all ${
                  safeActiveIndex === index
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-100'
                    : 'border-gray-200 bg-gray-50/70 hover:bg-gray-100/50'
                }`}
              >
                <select
                  value={linea.tipo}
                  onChange={(e) => actualizar(index, { tipo: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-extrabold text-gray-800 tracking-wide outline-none"
                >
                  {METODOS.map((m) => (
                    <option key={m.value} value={m.value} className="text-sm font-bold">
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="flex-1 pr-2 text-right font-mono text-sm font-bold text-gray-900">
                  {linea.monto ? (
                    formatCurrency(Number(linea.monto))
                  ) : (
                    <span className="text-gray-400">$0.00</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    quitarLinea(index)
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Eliminar método"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pantalla grande de Monto Recibido / Dinero Faltante */}
      <div
        className={`relative rounded-2xl border p-3.5 shadow-inner transition-all focus-within:bg-white focus-within:ring-2 ${
          faltanteCents > 0
            ? 'border-red-200 bg-red-50/25 focus-within:border-red-500 focus-within:ring-red-100'
            : cambioCents > 0
              ? 'border-green-200 bg-green-50/25 focus-within:border-green-500 focus-within:ring-green-100'
              : 'border-gray-200 bg-gray-50/80 focus-within:border-orange-500 focus-within:ring-orange-100'
        }`}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">
            {activeLinea?.tipo === 'EFECTIVO'
              ? 'Efectivo recibido'
              : 'Monto a transferir'}
          </span>
          {faltanteCents > 0 ? (
            <div className="flex items-baseline gap-1.5 rounded-lg border border-red-200/90 bg-red-50 px-2.5 py-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                Falta:
              </span>
              <span className="text-base font-black tracking-tight text-red-600 sm:text-lg">
                {formatCurrency(faltanteCents / 100)}
              </span>
            </div>
          ) : cambioCents > 0 ? (
            <div className="flex items-baseline gap-1.5 rounded-lg border border-green-200/90 bg-green-50 px-2.5 py-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                Cambio:
              </span>
              <span className="text-base font-black tracking-tight text-green-600 sm:text-lg">
                {formatCurrency(cambioCents / 100)}
              </span>
            </div>
          ) : excesoTransferencia ? (
            <div className="flex items-baseline gap-1.5 rounded-lg border border-red-200/90 bg-red-50 px-2.5 py-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                Excede:
              </span>
              <span className="text-base font-black tracking-tight text-red-600 sm:text-lg">
                {formatCurrency((transferenciaCents - restanteCents) / 100)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1 rounded-lg border border-green-200/90 bg-green-50 px-2.5 py-0.5 text-xs font-black text-green-600 sm:text-sm">
              ✓ Completo
            </div>
          )}
        </div>
        <div className="flex items-center justify-center py-0.5">
          <span className="mr-1 select-none text-3xl font-extrabold text-gray-400 sm:text-4xl">
            $
          </span>
          <input
            type="text"
            inputMode="none"
            autoFocus
            readOnly={activeLinea?.tipo === 'TRANSFERENCIA'}
            value={activeLinea?.monto ?? ''}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className={`w-full bg-transparent text-center text-4xl font-black tracking-tight text-gray-900 outline-none placeholder:text-gray-300 sm:text-5xl ${
              activeLinea?.tipo === 'TRANSFERENCIA' ? 'cursor-not-allowed select-none text-orange-600' : ''
            }`}
          />
        </div>
        {activeLinea?.tipo === 'TRANSFERENCIA' && (
          <p className="mt-1 text-center text-[11px] font-semibold text-gray-400">
            Transferencia se fija al valor exacto pendiente
          </p>
        )}
      </div>

      {/* Botones de Billetes y Pago Exacto */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={handleExacto}
          className={`flex items-center justify-center rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
            Number(activeLinea?.monto) === restante && restante > 0
              ? 'border-amber-500 bg-amber-400 font-extrabold text-gray-950 shadow-sm ring-2 ring-amber-300'
              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
          title="Cobro exacto del valor por cobrar"
        >
          Exacto
        </button>
        {BILLETES.map((billete) => {
          const isActive = Number(activeLinea?.monto) === billete
          return (
            <button
              key={billete}
              type="button"
              onClick={() => handleSetMonto(billete.toString())}
              className={`flex items-center justify-center rounded-xl border py-2.5 text-center text-sm font-bold transition-all ${
                isActive
                  ? 'border-amber-500 bg-amber-400 font-extrabold text-gray-950 shadow-sm ring-2 ring-amber-300'
                  : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100'
              }`}
            >
              ${billete}
            </button>
          )
        })}
      </div>

      {/* Teclado Numérico */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {KEYPAD_KEYS.map((key) => {
          if (key === 'BACKSPACE') {
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress('BACKSPACE')}
                className="flex cursor-pointer select-none items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-3 text-gray-700 shadow-sm transition-all hover:bg-gray-100 active:scale-95 active:bg-gray-200 sm:py-3.5"
                title="Borrar dígito"
              >
                <Delete className="h-6 w-6 text-gray-700" />
              </button>
            )
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKeypadPress(key)}
              className="flex cursor-pointer select-none items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-3 text-xl font-bold text-gray-800 shadow-sm transition-all hover:bg-gray-100 active:scale-95 active:bg-gray-200 sm:py-3.5 sm:text-2xl"
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* Alertas de Estado / Cálculos en tiempo real */}
      {excesoTransferencia && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700">
          La transferencia excede lo por cobrar en{' '}
          {formatCurrency((transferenciaCents - restanteCents) / 100)}
        </div>
      )}

      {!excesoTransferencia && cambioCents > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-center text-xs font-bold text-green-700">
          Cambio a devolver: {formatCurrency(cambioCents / 100)}
        </div>
      )}

      {/* Mensaje de error al procesar */}
      {mutation.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-600">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'Error al procesar el cobro. Intenta nuevamente.'}
        </div>
      )}

      {/* Botón Principal de Cobro */}
      <button
        type="button"
        disabled={!puedeCobrar || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-green-600 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        {mutation.isPending
          ? 'Procesando...'
          : todoValido
            ? `Cobrar ${formatCurrency(restante)}`
            : 'Cobrar'}
      </button>
    </div>
  )

  // Si se proveen detalles (como en CobroModal), mostramos la estructura de dos columnas en Desktop y Tablet
  if (detalles !== undefined) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-5">{resumenIzquierda}</div>
        <div className="md:col-span-7">{cobroDerecha}</div>
      </div>
    )
  }

  // Si no se proveen detalles (como en DividirModal), se muestra directamente la interfaz de cobro
  return cobroDerecha
}
