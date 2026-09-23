import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Minus, Plus, Search } from 'lucide-react'
import { getProductos } from '../../api/catalogo'
import {
  getInventario,
  getUltimoInventario,
  registrarEntrada,
  registrarEntradaLote,
  registrarInventarioLote,
  registrarSalida,
  registrarSalidaLote,
} from '../../api/inventario'
import type { InventarioDiario, InventarioItemRequest } from '../../types/pos'
import { formatFechaCorta, todayISO } from '../../utils/format'
import { Modal } from '../../components/ui/Modal'
import { CampoMonto } from './CampoMonto'

export function InventarioTab() {
  const [fecha, setFecha] = useState(todayISO())
  const [registrando, setRegistrando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [ajuste, setAjuste] = useState<{
    registro: InventarioDiario
    tipo: 'entrada' | 'salida'
  } | null>(null)
  const [lote, setLote] = useState<'entrada' | 'salida' | null>(null)

  const { data: inventario, isLoading } = useQuery({
    queryKey: ['inventario', fecha],
    queryFn: () => getInventario(fecha),
  })

  const hayInventario = (inventario?.length ?? 0) > 0
  const inventarioFiltrado = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return inventario ?? []

    return (inventario ?? []).filter((registro) =>
      (registro.idProducto?.nombre ?? '').toLowerCase().includes(termino),
    )
  }, [busqueda, inventario])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventario diario</h2>
          <p className="text-sm text-gray-500">
            {hayInventario
              ? 'Usa los botones de cada producto para registrar entradas o salidas.'
              : 'Registra las existencias iniciales del día antes de abrir caja.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!hayInventario ? (
            <button
              type="button"
              onClick={() => setRegistrando(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Registrar inventario
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setLote('entrada')}
                className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600"
              >
                <Plus className="h-4 w-4" />
                Entrada lote
              </button>
              <button
                type="button"
                onClick={() => setLote('salida')}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                <Minus className="h-4 w-4" />
                Salida lote
              </button>
            </>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-gray-400" />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>
      <p className="text-xs text-gray-500">
        {hayInventario
          ? `Inventario del ${formatFechaCorta(fecha)}.`
          : 'No hay inventario para esta fecha; se tomará el último registro disponible como base.'}
      </p>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : inventario && inventario.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            <span className="flex-1">Producto</span>
            <span className="w-20 text-right">Inicial</span>
            <span className="w-20 text-right">Actual</span>
            <span className="w-16 text-right">Ajustar</span>
          </div>
          {inventarioFiltrado.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No hay productos que coincidan con la búsqueda.
            </div>
          ) : (
            inventarioFiltrado.map((registro) => (
              <div
                key={registro.id}
                className="flex items-center gap-3 border-t border-gray-50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {registro.idProducto?.nombre ?? 'Producto'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {registro.idProducto?.unidadMedida ?? ''}
                  </p>
                </div>
                <span className="w-20 text-right text-sm text-gray-600">
                  {registro.cantidadInicial}
                </span>
                <span className="w-20 text-right text-sm font-semibold text-gray-900">
                  {registro.cantidadActual}
                </span>
                <span className="flex w-16 shrink-0 justify-end gap-1">
                  <button
                    type="button"
                    title="Agregar entrada"
                    onClick={() => setAjuste({ registro, tipo: 'entrada' })}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-green-600 transition-colors hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Registrar salida"
                    onClick={() => setAjuste({ registro, tipo: 'salida' })}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          No hay inventario registrado para esta fecha.
        </p>
      )}

      {registrando && (
        <RegistrarInventarioModal
          fecha={fecha}
          onClose={() => setRegistrando(false)}
        />
      )}
      {ajuste && (
        <AjusteInventarioModal
          fecha={fecha}
          registro={ajuste.registro}
          tipo={ajuste.tipo}
          onClose={() => setAjuste(null)}
        />
      )}
      {lote && (
        <AjusteLoteModal
          fecha={fecha}
          tipo={lote}
          onClose={() => setLote(null)}
        />
      )}
    </div>
  )
}

function AjusteInventarioModal({
  fecha,
  registro,
  tipo,
  onClose,
}: {
  fecha: string
  registro: InventarioDiario
  tipo: 'entrada' | 'salida'
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const esEntrada = tipo === 'entrada'
  const [cantidad, setCantidad] = useState('')

  const mutation = useMutation({
    mutationFn: (c: number) => {
      if (registro.idProducto == null) {
        throw new Error('Producto no disponible')
      }
      return esEntrada
        ? registrarEntrada(registro.idProducto.id, c, fecha)
        : registrarSalida(registro.idProducto.id, c, fecha)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const c = Number(cantidad)
    if (cantidad === '' || Number.isNaN(c) || c <= 0) return
    mutation.mutate(c)
  }

  return (
    <Modal
      open
      title={esEntrada ? 'Agregar entrada' : 'Registrar salida'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm">
          <p className="font-medium text-gray-900">
            {registro.idProducto?.nombre ?? 'Producto'}
          </p>
          <p className="text-gray-500">Stock actual: {registro.cantidadActual}</p>
        </div>
        <CampoMonto
          label="Cantidad"
          value={cantidad}
          onChange={setCantidad}
          min={0}
          placeholder="0"
        />
        {mutation.isError ? (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Error al guardar'}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className={`rounded-xl px-4 py-2.5 font-semibold text-white transition-colors disabled:opacity-50 ${
            esEntrada
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {mutation.isPending
            ? 'Guardando...'
            : esEntrada
              ? 'Agregar entrada'
              : 'Registrar salida'}
        </button>
      </form>
    </Modal>
  )
}

function AjusteLoteModal({
  fecha,
  tipo,
  onClose,
}: {
  fecha: string
  tipo: 'entrada' | 'salida'
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const esEntrada = tipo === 'entrada'

  const { data: registros } = useQuery({
    queryKey: ['inventario', fecha],
    queryFn: () => getInventario(fecha),
  })
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: getProductos,
  })

  const actualPorProducto = new Map(
    (registros ?? []).map((r) => [r.idProducto?.id, r.cantidadActual]),
  )
  const productosVisibles = (productos ?? []).filter(
    (p) => esEntrada || actualPorProducto.has(p.id),
  )

  const [valores, setValores] = useState<Record<number, string>>({})

  const mutation = useMutation({
    mutationFn: (items: { idProducto: number; cantidad: number }[]) =>
      esEntrada
        ? registrarEntradaLote(items, fecha)
        : registrarSalidaLote(items, fecha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const items: { idProducto: number; cantidad: number }[] = []
    for (const producto of productosVisibles) {
      const valor = valores[producto.id]
      if (valor === undefined || valor === '') continue
      const cantidad = Number(valor)
      if (Number.isNaN(cantidad) || cantidad <= 0) continue
      items.push({ idProducto: producto.id, cantidad })
    }
    if (items.length === 0) return
    mutation.mutate(items)
  }

  return (
    <Modal
      open
      title={esEntrada ? 'Entrada en lote' : 'Salida en lote'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="max-h-80 overflow-y-auto rounded-2xl border border-gray-100">
          {productosVisibles.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-gray-400">
              {esEntrada
                ? 'Primero registra productos en Configuración.'
                : 'No hay inventario registrado para esta fecha.'}
            </p>
          ) : (
            productosVisibles.map((producto) => {
              const actual = actualPorProducto.get(producto.id)
              return (
                <label
                  key={producto.id}
                  className="flex items-center gap-3 border-b border-gray-50 px-3 py-2.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </p>
                    <p className="text-xs text-gray-400">
                      {producto.unidadMedida ?? 'sin unidad'}
                      {!esEntrada && actual != null ? ` · stock ${actual}` : ''}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={valores[producto.id] ?? ''}
                    onChange={(e) =>
                      setValores((prev) => ({
                        ...prev,
                        [producto.id]: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-24 rounded-xl border border-gray-200 px-3 py-1.5 text-right text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              )
            })
          )}
        </div>

        {mutation.isError ? (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Error al guardar'}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={mutation.isPending}
          className={`rounded-xl px-4 py-2.5 font-semibold text-white transition-colors disabled:opacity-50 ${
            esEntrada
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
        >
          {mutation.isPending
            ? 'Guardando...'
            : esEntrada
              ? 'Agregar entradas'
              : 'Registrar salidas'}
        </button>
      </form>
    </Modal>
  )
}

function RegistrarInventarioModal({
  fecha,
  onClose,
}: {
  fecha: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: registros } = useQuery({
    queryKey: ['inventario', fecha],
    queryFn: () => getInventario(fecha),
  })
  const { data: ultimo } = useQuery({
    queryKey: ['inventario', 'ultimo'],
    queryFn: getUltimoInventario,
  })
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: getProductos,
  })

  const [valores, setValores] = useState<Record<number, string>>({})

  const precarga = new Map(
    (ultimo ?? []).map((r) => [r.idProducto?.id, r.cantidadActual]),
  )

  function valorDe(productoId: number): string {
    const editado = valores[productoId]
    if (editado !== undefined) return editado

    const registroExistente = (registros ?? []).find(
      (r) => r.idProducto?.id === productoId && r.fecha === fecha,
    )

    if (registroExistente) {
      return String(registroExistente.cantidadInicial)
    }

    const cantidad = precarga.get(productoId)
    return cantidad != null ? String(cantidad) : ''
  }

  const mutation = useMutation({
    mutationFn: (items: InventarioItemRequest[]) =>
      registrarInventarioLote(items, fecha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const items: InventarioItemRequest[] = []
    for (const producto of productos ?? []) {
      const valor = valorDe(producto.id)
      if (valor === '') continue
      const cantidad = Number(valor)
      if (Number.isNaN(cantidad) || cantidad < 0) continue
      items.push({ idProducto: producto.id, cantidadInicial: cantidad })
    }
    if (items.length === 0) return
    mutation.mutate(items)
  }

  return (
    <Modal open title={`Registrar inventario · ${formatFechaCorta(fecha)}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="max-h-80 overflow-y-auto rounded-2xl border border-gray-100">
          {(productos ?? []).map((producto) => (
            <label
              key={producto.id}
              className="flex items-center gap-3 border-b border-gray-50 px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {producto.nombre}
                </p>
                <p className="text-xs text-gray-400">
                  {producto.unidadMedida ?? 'sin unidad'}
                </p>
              </div>
              <input
                type="number"
                min={0}
                step="1"
                value={valorDe(producto.id)}
                onChange={(e) =>
                  setValores((prev) => ({
                    ...prev,
                    [producto.id]: e.target.value,
                  }))
                }
                placeholder="0"
                className="w-24 rounded-xl border border-gray-200 px-3 py-1.5 text-right text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          ))}
        </div>

        {productos?.length === 0 && (
          <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Primero registra productos en Configuración.
          </p>
        )}

        {mutation.isError && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Error al guardar el inventario'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar inventario'}
        </button>
      </form>
    </Modal>
  )
}
