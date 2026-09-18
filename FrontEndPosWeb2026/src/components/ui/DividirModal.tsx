import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, UserRound, X } from 'lucide-react'
import { getDetallesPedido } from '../../api/pedidos'
import type { Pedido } from '../../types/pos'
import { formatCurrency } from '../../utils/format'
import { CobroForm } from './CobroForm'

export function DividirModal({
  pedido,
  onClose,
}: {
  pedido: Pedido
  onClose: () => void
}) {
  const [numPersonas, setNumPersonas] = useState(2)
  const [personaActiva, setPersonaActiva] = useState(0)
  const [asignaciones, setAsignaciones] = useState<Record<number, number[]>>({})

  const { data: detalles, isLoading } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
  })

  const dets = detalles ?? []

  const fila = (id: number): number[] =>
    asignaciones[id] ?? Array(numPersonas).fill(0)

  function agregarUnidad(detalleId: number) {
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
              unidades,
              subtotal: unidades * (d.precioUnitario ?? 0),
            }
          : null
      })
      .filter((x): x is { nombre: string; unidades: number; subtotal: number } => x !== null)
  }

  function totalPersona(i: number) {
    return resumenPersona(i).reduce((sum, r) => sum + r.subtotal, 0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Dividir pedido #{pedido.id}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
        ) : (
          <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Personas</p>
                  <div className="flex items-center gap-2">
                    {numPersonas > 2 && (
                      <button
                        type="button"
                        onClick={quitarPersona}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-red-500"
                      >
                        Quitar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={agregarPersona}
                      className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-500 transition-colors hover:bg-orange-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Persona
                    </button>
                  </div>
                </div>

                {Array.from({ length: numPersonas }, (_, i) => {
                  const items = resumenPersona(i)
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPersonaActiva(i)}
                      className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors ${
                        personaActiva === i
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <UserRound className="h-4 w-4 text-orange-500" />
                          Persona {i + 1}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(totalPersona(i))}
                        </span>
                      </div>
                      {items.length > 0 && (
                        <ul className="flex flex-col gap-0.5">
                          {items.map((r, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between text-xs text-gray-500"
                            >
                              <span>
                                {r.unidades}× {r.nombre}
                              </span>
                              <span>{formatCurrency(r.subtotal)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-700">Pedido</p>

                {dets.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    Sin detalles.
                  </p>
                ) : (
                  dets.map((d) => {
                    const f = fila(d.id)
                    const asignado = f.reduce((a, b) => a + b, 0)
                    const resta = (d.cantidad ?? 0) - asignado
                    const completo = resta === 0
                    return (
                      <div
                        key={d.id}
                        className={`rounded-xl border p-3 transition-colors ${
                          asignado > 0
                            ? 'border-orange-200 bg-orange-50/70'
                            : 'border-gray-100 bg-white'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => agregarUnidad(d.id)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <span
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-bold ${
                              asignado > 0
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {d.cantidad}×
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate font-medium ${
                                completo ? 'text-gray-400 line-through' : 'text-gray-900'
                              }`}
                            >
                              {d.idPlato?.nombre ?? 'Plato'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatCurrency(d.precioUnitario)} c/u
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(d.subtotal)}
                          </span>
                        </button>
                        {(asignado > 0 || resta > 0) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {Array.from({ length: numPersonas }, (_, i) => {
                              const unidades = f[i] ?? 0
                              if (unidades <= 0) return null
                              return (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-orange-600 ring-1 ring-orange-200"
                                >
                                  P{i + 1} ×{unidades}
                                  <button
                                    type="button"
                                    onClick={() => quitarUnidad(d.id, i)}
                                    className="flex h-4 w-4 items-center justify-center rounded-full text-orange-400 transition-colors hover:text-red-500"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                </span>
                              )
                            })}
                            {resta > 0 && (
                              <span className="text-xs font-medium text-amber-600">
                                sin asignar: {resta}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Cobro</p>
              <CobroForm pedido={pedido} onSuccess={onClose} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
