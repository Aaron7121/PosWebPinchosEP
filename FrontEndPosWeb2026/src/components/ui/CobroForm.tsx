import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserRound } from 'lucide-react'
import { createPago, getPagosPedido } from '../../api/pagos'
import type { Pedido } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
] as const

interface Linea {
  key: number
  tipo: string
  monto: string
}

export function CobroForm({
  pedido,
  onSuccess,
}: {
  pedido: Pedido
  onSuccess?: () => void
}) {
  const queryClient = useQueryClient()
  const [lineas, setLineas] = useState<Linea[]>([
    { key: 1, tipo: 'EFECTIVO', monto: '' },
  ])
  const [nextKey, setNextKey] = useState(2)

  const [conCliente, setConCliente] = useState(false)
  const [cedula, setCedula] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')

  const { data: pagos } = useQuery({
    queryKey: ['pagos', pedido.id],
    queryFn: () => getPagosPedido(pedido.id),
  })

  const pagado = useMemo(
    () => (pagos ?? []).reduce((acc, p) => acc + (p.total ?? 0), 0),
    [pagos],
  )
  const total = pedido.total ?? 0
  const restante = Math.max(0, total - pagado)

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

  const mutation = useMutation({
    mutationFn: () =>
      createPago({
        idPedido: pedido.id,
        cliente:
          conCliente && (cedula || nombre || telefono || correo)
            ? {
                cedula: cedula.trim() || undefined,
                nombre: nombre.trim() || undefined,
                telefono: telefono.trim() || undefined,
                correo: correo.trim() || undefined,
              }
            : undefined,
        pagos: [
          ...lineas
            .filter((l) => l.tipo === 'TRANSFERENCIA')
            .map((l) => ({ tipo: 'TRANSFERENCIA', monto: Number(l.monto) })),
          ...(aplicadoEfectivoCents > 0
            ? [{ tipo: 'EFECTIVO', monto: aplicadoEfectivoCents / 100 }]
            : []),
        ],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pagos', pedido.id] })
      onSuccess?.()
    },
  })

  function actualizar(index: number, cambios: Partial<Linea>) {
    setLineas((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...cambios } : l)),
    )
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { key: nextKey, tipo: 'EFECTIVO', monto: '' }])
    setNextKey((k) => k + 1)
  }

  function quitarLinea(index: number) {
    setLineas((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-orange-50 px-4 py-2">
        <span className="text-sm font-semibold text-gray-700">Por cobrar</span>
        <span className="text-lg font-bold text-orange-600">
          {formatCurrency(restante)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setConCliente((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <UserRound className="h-4 w-4 text-orange-500" />
          {conCliente ? 'Cliente' : 'Consumidor final'}
        </button>
        <button
          type="button"
          onClick={() => setConCliente((v) => !v)}
          className="rounded-xl px-3 py-1.5 text-sm font-semibold text-orange-500 transition-colors hover:bg-orange-50"
        >
          {conCliente ? 'Quitar' : 'Agregar cliente'}
        </button>
      </div>

      {conCliente && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Cédula"
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Correo"
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {lineas.map((linea, index) => (
          <div
            key={linea.key}
            className="flex items-center gap-2 rounded-xl border border-gray-100 p-2"
          >
            <select
              value={linea.tipo}
              onChange={(e) => actualizar(index, { tipo: e.target.value })}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {METODOS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder={linea.tipo === 'EFECTIVO' ? 'Recibido 0.00' : 'Monto 0.00'}
              value={linea.monto}
              onChange={(e) => actualizar(index, { monto: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {lineas.length > 1 && (
              <button
                type="button"
                onClick={() => quitarLinea(index)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={agregarLinea}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          Método
        </button>
      </div>

      {excesoTransferencia && (
        <p className="rounded-xl bg-red-100 px-4 py-2.5 text-center text-sm font-bold text-red-700">
          La transferencia excede lo por cobrar en{' '}
          {formatCurrency((transferenciaCents - restanteCents) / 100)}
        </p>
      )}

      {!excesoTransferencia && faltanteCents > 0 && (
        <p className="rounded-xl bg-red-100 px-4 py-2.5 text-center text-sm font-bold text-red-700">
          Falta {formatCurrency(faltanteCents / 100)}
        </p>
      )}

      {!excesoTransferencia && cambioCents > 0 && (
        <p className="rounded-xl bg-green-50 px-4 py-2.5 text-center text-sm font-bold text-green-700">
          Cambio a devolver: {formatCurrency(cambioCents / 100)}
        </p>
      )}

      <button
        type="button"
        disabled={!puedeCobrar || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-base font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
      >
        {mutation.isPending
          ? 'Procesando...'
          : todoValido
            ? `Cobrar ${formatCurrency(restante)}`
            : 'Cobrar'}
      </button>
    </div>
  )
}
