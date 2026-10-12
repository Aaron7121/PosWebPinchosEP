import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, ChevronDown, Delete, Lock, Minus, Plus, Trash2, Users, X } from 'lucide-react'
import { createPago, getPagosPedido } from '../../api/pagos'
import { getDetallesPedido } from '../../api/pedidos'
import type { Pedido } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

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

interface LineaMetodo {
  id: number
  tipo: string
  monto: string
}

export function DividirModal({
  pedido,
  onClose,
}: {
  pedido: Pedido
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [numPersonas, setNumPersonas] = useState(2)
  const [personaActiva, setPersonaActiva] = useState(0)
  const [asignaciones, setAsignaciones] = useState<Record<number, number[]>>({})

  // Registro de personas que ya pagaron completamente su cuenta
  const [personasPagadas, setPersonasPagadas] = useState<number[]>([])

  // Estado de cobro individual por cada persona
  const [lineasPorPersona, setLineasPorPersona] = useState<Record<number, LineaMetodo[]>>({})
  const [activeLineIdxPorPersona, setActiveLineIdxPorPersona] = useState<Record<number, number>>({})
  const [nextKeyId, setNextKeyId] = useState(10)

  const { data: detalles, isLoading: isLoadingDetalles } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
  })

  const { data: pagosExistentes } = useQuery({
    queryKey: ['pagos', pedido.id],
    queryFn: () => getPagosPedido(pedido.id),
  })

  const totalPagadoExistente = useMemo(
    () => (pagosExistentes ?? []).reduce((acc, p) => acc + (p.total ?? 0), 0),
    [pagosExistentes],
  )
  const totalPedido = pedido.total ?? 0
  const restantePedido = Math.max(0, totalPedido - totalPagadoExistente)

  const dets = useMemo(() => {
    return [...(detalles ?? [])].sort((a, b) => {
      const aLlevar = Boolean(a.paraLlevar)
      const bLlevar = Boolean(b.paraLlevar)
      if (aLlevar === bLlevar) return 0
      return aLlevar ? 1 : -1
    })
  }, [detalles])

  const fila = (id: number): number[] =>
    asignaciones[id] ?? Array(numPersonas).fill(0)

  function agregarUnidad(detalleId: number) {
    if (personasPagadas.includes(personaActiva)) return

    setAsignaciones((prev) => {
      const detalle = dets.find((d) => d.id === detalleId)
      const cantidad = detalle?.cantidad ?? 0
      const f = [...(prev[detalleId] ?? Array(numPersonas).fill(0))]
      const actual = f[personaActiva] ?? 0
      const sumaOtros = f.reduce((a, b) => a + b, 0) - actual
      const siguiente = Math.min(actual + 1, cantidad - sumaOtros)
      f[personaActiva] = siguiente
      return { ...prev, [detalleId]: f }
    })
  }

  function quitarUnidad(detalleId: number, idx: number) {
    if (personasPagadas.includes(idx)) return

    setAsignaciones((prev) => {
      const f = [...(prev[detalleId] ?? Array(numPersonas).fill(0))]
      const actual = f[idx] ?? 0
      f[idx] = Math.max(0, actual - 1)
      return { ...prev, [detalleId]: f }
    })
  }

  function agregarPersona() {
    setNumPersonas((n) => n + 1)
  }

  function quitarPersona() {
    if (numPersonas <= 2) return
    const eliminada = numPersonas - 1
    if (personasPagadas.includes(eliminada)) return

    setAsignaciones((prev) => {
      const next: Record<number, number[]> = {}
      for (const [key, valor] of Object.entries(prev)) {
        next[Number(key)] = valor.slice(0, -1)
      }
      return next
    })
    setPersonaActiva((prev) => (prev >= eliminada ? Math.max(0, prev - 1) : prev))
    setNumPersonas((n) => n - 1)
  }

  function resumenPersona(i: number) {
    return dets
      .map((d) => {
        const unidades = fila(d.id)[i] ?? 0
        return unidades > 0
          ? {
              nombre: d.idPlato?.nombre ?? 'Plato',
              paraLlevar: Boolean(d.paraLlevar),
              unidades,
              subtotal: unidades * (d.precioUnitario ?? 0),
            }
          : null
      })
      .filter(
        (x): x is { nombre: string; paraLlevar: boolean; unidades: number; subtotal: number } =>
          x !== null,
      )
  }

  function totalPersona(i: number) {
    return resumenPersona(i).reduce((sum, r) => sum + r.subtotal, 0)
  }

  const parseMonto = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  // Persona activa y sus montos
  const targetPersona = personaActiva
  const targetTotal = totalPersona(targetPersona)
  const isPersonaYaPagada = personasPagadas.includes(targetPersona)

  const currentLineas = useMemo(() => {
    return (
      lineasPorPersona[targetPersona] ?? [
        {
          id: targetPersona * 10 + 1,
          tipo: 'EFECTIVO',
          monto: targetTotal > 0 ? targetTotal.toFixed(2) : '',
        },
      ]
    )
  }, [lineasPorPersona, targetPersona, targetTotal])

  // Inicializar o ajustar monto si cambia el total asignado a la persona
  useEffect(() => {
    if (isPersonaYaPagada) return

    setLineasPorPersona((prev) => {
      const existing = prev[targetPersona]
      if (!existing) {
        return {
          ...prev,
          [targetPersona]: [
            {
              id: targetPersona * 10 + 1,
              tipo: 'EFECTIVO',
              monto: targetTotal > 0 ? targetTotal.toFixed(2) : '',
            },
          ],
        }
      }
      if (existing.length === 1 && (existing[0].monto === '' || Number(existing[0].monto) === 0)) {
        return {
          ...prev,
          [targetPersona]: [
            {
              ...existing[0],
              monto: targetTotal > 0 ? targetTotal.toFixed(2) : '',
            },
          ],
        }
      }
      return prev
    })
  }, [targetPersona, targetTotal, isPersonaYaPagada])

  const safeActiveLineIdx = Math.min(
    Math.max(0, activeLineIdxPorPersona[targetPersona] ?? 0),
    Math.max(0, currentLineas.length - 1),
  )
  const activeLinea = currentLineas[safeActiveLineIdx] ?? currentLineas[0]

  // Cálculos de saldo de la persona activa
  const targetCents = Math.round(targetTotal * 100)
  const transfCents = Math.round(
    currentLineas
      .filter((l) => l.tipo === 'TRANSFERENCIA')
      .reduce((acc, l) => acc + parseMonto(l.monto), 0) * 100,
  )
  const efectCents = Math.round(
    currentLineas
      .filter((l) => l.tipo === 'EFECTIVO')
      .reduce((acc, l) => acc + parseMonto(l.monto), 0) * 100,
  )

  const montosValidos = currentLineas.every((l) => Number(l.monto) > 0)
  const aplicadoEfectivoCents = Math.max(0, targetCents - transfCents)
  const cambioCents = efectCents - aplicadoEfectivoCents
  const faltanteCents = targetCents - transfCents - efectCents
  const excesoTransferencia = transfCents > targetCents

  const puedeCobrarPersona =
    !isPersonaYaPagada &&
    targetTotal > 0 &&
    montosValidos &&
    !excesoTransferencia &&
    faltanteCents <= 0

  // Gestión de líneas de pago
  function actualizarLineaPersona(index: number, cambios: Partial<LineaMetodo>) {
    if (isPersonaYaPagada) return
    setLineasPorPersona((prev) => {
      const lineas = [...(prev[targetPersona] ?? currentLineas)]
      const current = lineas[index]
      if (!current) return prev

      const updated = { ...current, ...cambios }
      if (cambios.tipo === 'TRANSFERENCIA') {
        const otrasLineasCents = lineas
          .filter((_, idx) => idx !== index)
          .reduce((acc, item) => acc + Math.round(parseMonto(item.monto) * 100), 0)
        const pendienteCents = Math.max(0, targetCents - otrasLineasCents)
        updated.monto = (pendienteCents / 100).toFixed(2)
      }
      lineas[index] = updated
      return { ...prev, [targetPersona]: lineas }
    })
  }

  function agregarLineaMetodo() {
    if (isPersonaYaPagada) return
    setLineasPorPersona((prev) => {
      const lineas = [...(prev[targetPersona] ?? currentLineas)]
      lineas.push({ id: nextKeyId, tipo: 'EFECTIVO', monto: '' })
      return { ...prev, [targetPersona]: lineas }
    })
    setActiveLineIdxPorPersona((prev) => ({
      ...prev,
      [targetPersona]: currentLineas.length,
    }))
    setNextKeyId((k) => k + 1)
  }

  function quitarLineaMetodo(index: number) {
    if (isPersonaYaPagada) return
    setLineasPorPersona((prev) => {
      const lineas = (prev[targetPersona] ?? currentLineas).filter((_, i) => i !== index)
      return {
        ...prev,
        [targetPersona]:
          lineas.length > 0
            ? lineas
            : [{ id: nextKeyId, tipo: 'EFECTIVO', monto: '' }],
      }
    })
    setActiveLineIdxPorPersona((prev) => ({
      ...prev,
      [targetPersona]: Math.max(0, (prev[targetPersona] ?? 0) - 1),
    }))
  }

  function handleAmountChange(val: string) {
    if (isPersonaYaPagada || activeLinea?.tipo === 'TRANSFERENCIA') return
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      actualizarLineaPersona(safeActiveLineIdx, { monto: val })
    }
  }

  function handleSetMonto(val: string) {
    if (isPersonaYaPagada || activeLinea?.tipo === 'TRANSFERENCIA') return
    actualizarLineaPersona(safeActiveLineIdx, { monto: val })
  }

  function handleExacto() {
    if (isPersonaYaPagada) return
    const otrasLineasCents = currentLineas
      .filter((_, i) => i !== safeActiveLineIdx)
      .reduce((acc, l) => acc + Math.round(parseMonto(l.monto) * 100), 0)
    const pendiente = Math.max(0, targetCents - otrasLineasCents) / 100
    actualizarLineaPersona(safeActiveLineIdx, {
      monto: pendiente > 0 ? pendiente.toFixed(2) : targetTotal.toFixed(2),
    })
  }

  function handleKeypadPress(key: string) {
    if (isPersonaYaPagada || activeLinea?.tipo === 'TRANSFERENCIA') return
    const current = activeLinea?.monto ?? ''
    if (key === 'BACKSPACE') {
      actualizarLineaPersona(safeActiveLineIdx, { monto: current.slice(0, -1) })
      return
    }
    if (key === '.') {
      if (current.includes('.')) return
      actualizarLineaPersona(safeActiveLineIdx, {
        monto: current ? current + '.' : '0.',
      })
      return
    }
    if (current === '0') {
      actualizarLineaPersona(safeActiveLineIdx, { monto: key })
      return
    }
    if (current.includes('.')) {
      const [, dec] = current.split('.')
      if (dec && dec.length >= 2) return
    }
    actualizarLineaPersona(safeActiveLineIdx, { monto: current + key })
  }

  // Mutación para cobrar la persona activa
  const cobrarMutation = useMutation({
    mutationFn: () => {
      const itemsPago = [
        ...currentLineas
          .filter((l) => l.tipo === 'TRANSFERENCIA')
          .map((l) => ({ tipo: 'TRANSFERENCIA', monto: Number(l.monto) })),
        ...(aplicadoEfectivoCents > 0
          ? [{ tipo: 'EFECTIVO', monto: aplicadoEfectivoCents / 100 }]
          : []),
      ]
      return createPago({
        idPedido: pedido.id,
        pagos: itemsPago,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pagos', pedido.id] })

      const nuevaListaPagadas = [...personasPagadas, targetPersona]
      setPersonasPagadas(nuevaListaPagadas)

      // Verificar si ya se pagaron todas las personas
      const todasPagadas = Array.from({ length: numPersonas }, (_, i) => i).every((idx) =>
        nuevaListaPagadas.includes(idx),
      )

      if (todasPagadas) {
        // Flujo completado: cerrar modal automáticamente
        onClose()
      } else {
        // Cambiar automáticamente a la siguiente persona pendiente
        const siguientePendiente = Array.from({ length: numPersonas }, (_, i) => i).find(
          (idx) => !nuevaListaPagadas.includes(idx),
        )
        if (siguientePendiente !== undefined) {
          setPersonaActiva(siguientePendiente)
        }
      }
    },
  })

  // Listener para Enter al cobrar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
        if (puedeCobrarPersona && !cobrarMutation.isPending) {
          e.preventDefault()
          cobrarMutation.mutate()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [puedeCobrarPersona, cobrarMutation])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col rounded-3xl border border-gray-100 bg-white shadow-2xl">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Dividir Pedido #{pedido.id}
              </h3>
              <p className="text-xs text-gray-500">
                Selecciona la persona y asigna sus platos a la izquierda; cobra su monto a la derecha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoadingDetalles ? (
          <p className="py-16 text-center text-sm text-gray-400">Cargando detalles...</p>
        ) : (
          /* Cuerpo con 2 columnas: Izquierda (Personas + Platos) y Derecha (Cobro) */
          <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-4 md:grid-cols-12 md:p-6">
            
            {/* ================= COLUMNA IZQUIERDA (5 columnas md) ================= */}
            <div className="flex flex-col gap-4 md:col-span-5 md:pr-1">
              
              {/* Sección Personas */}
              <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Personas ({numPersonas})
                  </span>
                  <div className="flex items-center gap-2">
                    {numPersonas > 2 && (
                      <button
                        type="button"
                        onClick={quitarPersona}
                        disabled={personasPagadas.includes(numPersonas - 1)}
                        className="rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        Quitar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={agregarPersona}
                      className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Persona
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {Array.from({ length: numPersonas }, (_, i) => {
                    const items = resumenPersona(i)
                    const totalP = totalPersona(i)
                    const isSelected = personaActiva === i
                    const isPagada = personasPagadas.includes(i)

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPersonaActiva(i)}
                        className={`flex flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition-all ${
                          isPagada
                            ? 'border-emerald-300 bg-emerald-50/90 shadow-2xs ring-1 ring-emerald-200 cursor-pointer'
                            : isSelected
                              ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-200'
                              : 'border-gray-200 bg-white hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Header del Card de Persona con separación limpia y precio a la derecha más grande */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${
                                isPagada
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                  : isSelected
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isPagada ? <Check className="h-4 w-4 stroke-[3]" /> : `P${i + 1}`}
                            </span>
                            <div className="flex flex-col">
                              <span
                                className={`text-sm font-black tracking-tight ${
                                  isPagada ? 'text-emerald-950' : 'text-gray-900'
                                }`}
                              >
                                Persona {i + 1}
                              </span>
                              {isPagada ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" /> Pagado
                                </span>
                              ) : isSelected ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                  Activa para cobrar
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Precio a la derecha más grande */}
                          <div className="text-right shrink-0">
                            <span
                              className={`text-xl font-black tracking-tight sm:text-2xl ${
                                isPagada
                                  ? 'text-emerald-700'
                                  : totalP > 0
                                    ? 'text-gray-900'
                                    : 'text-gray-400'
                              }`}
                            >
                              {formatCurrency(totalP)}
                            </span>
                          </div>
                        </div>

                        {/* Desglose de Platos */}
                        {items.length > 0 ? (
                          <ul
                            className={`flex flex-col gap-0.5 pt-2 mt-1 border-t ${
                              isPagada ? 'border-emerald-200/80' : 'border-gray-100'
                            }`}
                          >
                            {items.map((r, idx) => (
                              <li
                                key={idx}
                                className={`flex items-center justify-between text-xs ${
                                  isPagada ? 'text-emerald-900 font-medium' : 'text-gray-600'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-medium truncate">
                                    {r.unidades}× {r.nombre}
                                  </span>
                                  {r.paraLlevar && (
                                    <span
                                      className={`shrink-0 text-[10px] ${
                                        isPagada ? 'text-emerald-700' : 'text-gray-400'
                                      }`}
                                    >
                                      (llevar)
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    isPagada ? 'text-emerald-800' : 'text-gray-800'
                                  }`}
                                >
                                  {formatCurrency(r.subtotal)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">
                            Sin platos asignados aún.
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Lista de Platos del Pedido */}
              <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Platos a Asignar a Persona {personaActiva + 1}
                  </span>
                  {isPersonaYaPagada ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <Lock className="h-3 w-3" /> Persona ya pagada
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-gray-400">
                      Toca para sumar unidad
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {dets.length === 0 ? (
                    <p className="py-6 text-center text-xs text-gray-400">
                      Sin platos registrados en el pedido.
                    </p>
                  ) : (
                    dets.map((d, idx) => {
                      const f = fila(d.id)
                      const asignado = f.reduce((a, b) => a + b, 0)
                      const resta = (d.cantidad ?? 0) - asignado
                      const completo = resta === 0
                      const isFirstLlevar =
                        d.paraLlevar && (idx === 0 || !dets[idx - 1]?.paraLlevar)
                      const hasMixed =
                        dets.some((x) => !x.paraLlevar) && dets.some((x) => x.paraLlevar)

                      return (
                        <div key={d.id}>
                          {isFirstLlevar && hasMixed && (
                            <div className="relative my-2.5 flex items-center">
                              <div className="flex-grow border-t border-gray-200" />
                              <span className="mx-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Para llevar
                              </span>
                              <div className="flex-grow border-t border-gray-200" />
                            </div>
                          )}

                          {/* Tarjeta de plato */}
                          <div
                            className={`rounded-2xl border p-3 transition-all ${
                              completo
                                ? 'border-emerald-200 bg-emerald-50/60 shadow-xs'
                                : asignado > 0
                                  ? 'border-orange-200 bg-orange-50/50'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => agregarUnidad(d.id)}
                              disabled={completo || isPersonaYaPagada}
                              className={`flex w-full items-center gap-3 text-left ${
                                completo || isPersonaYaPagada ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span
                                className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-xs font-black shadow-xs ${
                                  completo
                                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-200'
                                    : asignado > 0
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {completo ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {d.cantidad}×
                                  </span>
                                ) : (
                                  `${d.cantidad}×`
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-sm font-bold ${
                                    completo
                                      ? 'text-emerald-900 font-semibold'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  {d.idPlato?.nombre ?? 'Plato'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatCurrency(d.precioUnitario)} c/u
                                </p>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`text-sm font-extrabold ${
                                    completo ? 'text-emerald-700' : 'text-gray-900'
                                  }`}
                                >
                                  {formatCurrency(d.subtotal)}
                                </span>
                                {completo && (
                                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                                    Completo
                                  </p>
                                )}
                              </div>
                            </button>

                            {/* Detalle de asignación por persona */}
                            {(asignado > 0 || resta > 0) && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
                                {Array.from({ length: numPersonas }, (_, i) => {
                                  const unidades = f[i] ?? 0
                                  if (unidades <= 0) return null
                                  const personaEstaPagada = personasPagadas.includes(i)

                                  return (
                                    <span
                                      key={i}
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 shadow-2xs ${
                                        personaEstaPagada
                                          ? 'bg-emerald-100 text-emerald-800 ring-emerald-300'
                                          : 'bg-white text-orange-600 ring-orange-200'
                                      }`}
                                    >
                                      P{i + 1} ×{unidades}
                                      {!personaEstaPagada && (
                                        <button
                                          type="button"
                                          onClick={() => quitarUnidad(d.id, i)}
                                          className="flex h-4 w-4 items-center justify-center rounded-full text-orange-400 transition-colors hover:text-red-500"
                                          title="Quitar 1 unidad de esta persona"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                      )}
                                    </span>
                                  )
                                })}
                                {resta > 0 && (
                                  <span className="text-xs font-semibold text-amber-600">
                                    Sin asignar: {resta}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ================= COLUMNA DERECHA: COBRO & CALCULADORA (7 columnas md) ================= */}
            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm md:col-span-7">
              
              {/* Tarjeta de identificación de Persona a Cobrar */}
              <div
                className={`flex items-center justify-between rounded-2xl p-4 border transition-all ${
                  isPersonaYaPagada
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl font-black text-white shadow-sm ${
                      isPersonaYaPagada ? 'bg-emerald-600' : 'bg-orange-500'
                    }`}
                  >
                    {isPersonaYaPagada ? <Check className="h-6 w-6 stroke-[3]" /> : `P${personaActiva + 1}`}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isPersonaYaPagada ? 'text-emerald-700' : 'text-orange-600'
                      }`}
                    >
                      {isPersonaYaPagada ? 'Cuenta Liquidada' : 'Cobrando a'}
                    </span>
                    <h4 className="text-base font-extrabold text-gray-900">
                      Persona {personaActiva + 1}
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {isPersonaYaPagada ? 'Total Cobrado' : 'Total a Pagar'}
                  </span>
                  <p
                    className={`text-2xl font-black sm:text-3xl ${
                      isPersonaYaPagada ? 'text-emerald-700' : 'text-orange-600'
                    }`}
                  >
                    {formatCurrency(targetTotal)}
                  </p>
                </div>
              </div>

              {/* Si la persona ya está pagada, mostramos aviso de bloqueo claro */}
              {isPersonaYaPagada ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h5 className="text-base font-extrabold text-gray-900">
                      Persona {personaActiva + 1} ya completó su pago
                    </h5>
                    <p className="mt-1 text-xs text-gray-500 max-w-sm">
                      Esta cuenta ya fue liquidada y no permite modificaciones. Selecciona otra persona en la izquierda para continuar.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Métodos de Pago Disponibles / Divididos para esta Persona */}
                  {currentLineas.length === 1 ? (
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Método de pago
                        </label>
                        <button
                          type="button"
                          onClick={agregarLineaMetodo}
                          className="flex items-center gap-1 text-xs font-semibold text-orange-600 transition-colors hover:text-orange-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Dividir método
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          value={currentLineas[0].tipo}
                          onChange={(e) =>
                            actualizarLineaPersona(0, { tipo: e.target.value })
                          }
                          className="w-full cursor-pointer appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base font-extrabold text-gray-900 tracking-wide outline-none transition-colors hover:bg-gray-100/70 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                        >
                          {METODOS.map((m) => (
                            <option
                              key={m.value}
                              value={m.value}
                              className="text-base font-bold py-1"
                            >
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
                          Métodos divididos ({currentLineas.length})
                        </span>
                        <button
                          type="button"
                          onClick={agregarLineaMetodo}
                          className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Agregar otro método
                        </button>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {currentLineas.map((linea, index) => (
                          <div
                            key={linea.id}
                            onClick={() =>
                              setActiveLineIdxPorPersona((prev) => ({
                                ...prev,
                                [targetPersona]: index,
                              }))
                            }
                            className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-2 transition-all ${
                              safeActiveLineIdx === index
                                ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-100'
                                : 'border-gray-200 bg-gray-50/70 hover:bg-gray-100/50'
                            }`}
                          >
                            <select
                              value={linea.tipo}
                              onChange={(e) =>
                                actualizarLineaPersona(index, { tipo: e.target.value })
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-extrabold text-gray-800 tracking-wide outline-none"
                            >
                              {METODOS.map((m) => (
                                <option
                                  key={m.value}
                                  value={m.value}
                                  className="text-sm font-bold"
                                >
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
                                quitarLineaMetodo(index)
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

                  {/* Visor de Monto Recibido / Faltante / Cambio */}
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
                            {formatCurrency((transfCents - targetCents) / 100)}
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
                          activeLinea?.tipo === 'TRANSFERENCIA'
                            ? 'cursor-not-allowed select-none text-orange-600'
                            : ''
                        }`}
                      />
                    </div>
                    {activeLinea?.tipo === 'TRANSFERENCIA' && (
                      <p className="mt-1 text-center text-[11px] font-semibold text-gray-400">
                        Transferencia fijada al monto exacto pendiente
                      </p>
                    )}
                  </div>

                  {/* Botón Exacto y Billetes */}
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={handleExacto}
                      className={`flex items-center justify-center rounded-xl border py-2.5 text-center text-xs font-bold transition-all ${
                        Number(activeLinea?.monto) === targetTotal && targetTotal > 0
                          ? 'border-amber-500 bg-amber-400 font-extrabold text-gray-950 shadow-sm ring-2 ring-amber-300'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Cobro exacto del valor de la persona"
                    >
                      Exacto
                    </button>
                    {BILLETES.map((billete) => {
                      const isActive = Number(activeLinea?.monto) === billete
                      return (
                        <button
                          key={billete}
                          type="button"
                          disabled={activeLinea?.tipo === 'TRANSFERENCIA'}
                          onClick={() => handleSetMonto(billete.toString())}
                          className={`flex items-center justify-center rounded-xl border py-2.5 text-center text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none ${
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
                            disabled={activeLinea?.tipo === 'TRANSFERENCIA'}
                            onClick={() => handleKeypadPress('BACKSPACE')}
                            className="flex cursor-pointer select-none items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-3 text-gray-700 shadow-sm transition-all hover:bg-gray-100 active:scale-95 active:bg-gray-200 sm:py-3.5 disabled:opacity-40 disabled:pointer-events-none"
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
                          disabled={activeLinea?.tipo === 'TRANSFERENCIA'}
                          onClick={() => handleKeypadPress(key)}
                          className="flex cursor-pointer select-none items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 py-3 text-xl font-bold text-gray-800 shadow-sm transition-all hover:bg-gray-100 active:scale-95 active:bg-gray-200 sm:py-3.5 sm:text-2xl disabled:opacity-40 disabled:pointer-events-none"
                        >
                          {key}
                        </button>
                      )
                    })}
                  </div>

                  {/* Mensajes de validación */}
                  {targetTotal <= 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-700">
                      Asigna al menos un plato a Persona {personaActiva + 1} para habilitar el cobro.
                    </div>
                  )}

                  {excesoTransferencia && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700">
                      La transferencia excede el valor a pagar en{' '}
                      {formatCurrency((transfCents - targetCents) / 100)}
                    </div>
                  )}

                  {!excesoTransferencia && cambioCents > 0 && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-center text-xs font-bold text-green-700">
                      Cambio a devolver: {formatCurrency(cambioCents / 100)}
                    </div>
                  )}

                  {/* Botón de Cobro de la Persona Activa */}
                  <button
                    type="button"
                    disabled={!puedeCobrarPersona || cobrarMutation.isPending}
                    onClick={() => cobrarMutation.mutate()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-green-600 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                  >
                    {cobrarMutation.isPending
                      ? 'Registrando pago...'
                      : puedeCobrarPersona
                        ? `Cobrar Persona ${personaActiva + 1} (${formatCurrency(targetTotal)})`
                        : `Cobrar Persona ${personaActiva + 1}`}
                  </button>
                </>
              )}

              {/* Saldo general pendiente de la mesa */}
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span>Total Pedido: <strong className="text-gray-900">{formatCurrency(totalPedido)}</strong></span>
                <span>Restante Pedido: <strong className="text-orange-600">{formatCurrency(restantePedido)}</strong></span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
