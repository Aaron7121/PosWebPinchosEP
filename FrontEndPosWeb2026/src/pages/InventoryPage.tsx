import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeftRight,
  Banknote,
  Boxes,
  CalendarDays,
  Minus,
  Plus,
} from 'lucide-react'
import { getProductos } from '../api/catalogo'
import { abrirCaja, cerrarCaja, getCajaAbierta, getCajas } from '../api/caja'
import {
  getInventario,
  getUltimoInventario,
  registrarEntrada,
  registrarEntradaLote,
  registrarInventarioLote,
  registrarSalida,
  registrarSalidaLote,
} from '../api/inventario'
import { getMovimientos } from '../api/movimientos'
import type {
  Caja,
  InventarioDiario,
  MovInventario,
} from '../types/pos'
import type {
  CajaAbrirRequest,
  CajaCerrarRequest,
  InventarioItemRequest,
} from '../types/pos'
import { formatCurrency, formatFecha, formatFechaCorta, todayISO } from '../utils/format'
import { Modal } from '../components/ui/Modal'

type Tab = 'inventario' | 'caja' | 'movimientos'

export function InventoryPage() {
  const [searchParams] = useSearchParams()
  const paramTab = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(
    paramTab === 'caja'
      ? 'caja'
      : paramTab === 'movimientos'
        ? 'movimientos'
        : 'inventario',
  )

  const tabs: { id: Tab; label: string; icon: typeof Boxes }[] = [
    { id: 'inventario', label: 'Inventario', icon: Boxes },
    { id: 'caja', label: 'Caja', icon: Banknote },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center border-b border-gray-100 bg-white px-6">
        <h1 className="text-lg font-bold text-gray-900">Inventario y caja</h1>
      </header>

      <nav className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-6 py-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-orange-50 text-orange-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'caja' && <CajaTab />}
        {tab === 'inventario' && <InventarioTab />}
        
        {tab === 'movimientos' && <MovimientosTab />}
      </div>
    </div>
  )
}

// ---------------- Inventario ----------------

function InventarioTab() {
  const [fecha, setFecha] = useState(todayISO())
  const [registrando, setRegistrando] = useState(false)
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
          {inventario.map((registro) => (
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
          ))}
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
                    step="0.01"
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

  const existentes = new Map(
    (registros ?? []).map((r) => [r.idProducto?.id, r.cantidadInicial]),
  )
  const precarga = new Map(
    (ultimo ?? []).map((r) => [r.idProducto?.id, r.cantidadActual]),
  )
  const [valores, setValores] = useState<Record<number, string>>({})

  function valorDe(productoId: number): string {
    const editado = valores[productoId]
    if (editado !== undefined) return editado
    const cantidad = existentes.get(productoId) ?? precarga.get(productoId)
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
                step="0.01"
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

// ---------------- Caja ----------------

function CajaTab() {
  const queryClient = useQueryClient()
  const hoy = todayISO()

  const { data: cajaAbierta, isLoading } = useQuery({
    queryKey: ['cajas', 'abierta'],
    queryFn: getCajaAbierta,
    retry: false,
  })
  const { data: cajas } = useQuery({
    queryKey: ['cajas'],
    queryFn: getCajas,
  })
  const { data: inventarioHoy } = useQuery({
    queryKey: ['inventario', hoy],
    queryFn: () => getInventario(hoy),
  })

  const [abriendo, setAbriendo] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  const hayInventario = (inventarioHoy?.length ?? 0) > 0

  function refrescarCajas() {
    queryClient.invalidateQueries({ queryKey: ['cajas'] })
    queryClient.invalidateQueries({ queryKey: ['cajas', 'abierta'] })
  }

  const abrirMutation = useMutation({
    mutationFn: (payload: CajaAbrirRequest) => abrirCaja(payload),
    onSuccess: () => {
      refrescarCajas()
      setAbriendo(false)
    },
  })

  const cerrarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CajaCerrarRequest }) =>
      cerrarCaja(id, payload),
    onSuccess: () => {
      refrescarCajas()
      setCerrando(false)
    },
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : cajaAbierta ? (
        <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-500">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Caja abierta</p>
                <p className="text-sm text-gray-500">
                  desde {formatFecha(cajaAbierta.fechaApertura)}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
              Activa
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <ResumenCaja label="Monto esperado" valor={cajaAbierta.montoEsperado} />
            <ResumenCaja label="Cajero" valor={cajaAbierta.idEmpleado?.nombre} textToNumber={false} />
          </div>
          {cajaAbierta.observaciones && (
            <p className="mt-3 text-sm text-gray-500">
              {cajaAbierta.observaciones}
            </p>
          )}
          <button
            type="button"
            onClick={() => setCerrando(true)}
            className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Cerrar caja
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">No hay caja abierta</p>
              <p className="text-sm text-gray-500">
                Abre la caja para comenzar a registrar pedidos.
              </p>
            </div>
          </div>
          {!hayInventario && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              Primero registra el inventario del día para poder abrir caja.
            </p>
          )}
          <button
            type="button"
            disabled={!hayInventario}
            onClick={() => setAbriendo(true)}
            className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            Abrir caja
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Historial de cajas</h3>
      </div>

      {cajas && cajas.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {cajas.map((caja) => (
            <div
              key={caja.id}
              className="flex items-center gap-4 border-t border-gray-50 px-4 py-3 first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {formatFecha(caja.fechaApertura)}
                </p>
                <p className="text-xs text-gray-400">
                  {caja.idEmpleado?.nombre ?? 'Empleado'}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-gray-400">Esperado</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(caja.montoEsperado)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Real</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(caja.montoReal)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  caja.fechaCierre
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {caja.fechaCierre ? 'Cerrada' : 'Abierta'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-gray-400">
          Sin cajas registradas.
        </p>
      )}

      {abriendo && (
        <AbrirCajaModal
          onClose={() => setAbriendo(false)}
          onSubmit={(payload) => abrirMutation.mutate(payload)}
          isPending={abrirMutation.isPending}
          error={abrirMutation.error}
        />
      )}
      {cerrando && cajaAbierta && (
        <CerrarCajaModal
          caja={cajaAbierta}
          onClose={() => setCerrando(false)}
          onSubmit={(payload) =>
            cerrarMutation.mutate({ id: cajaAbierta.id, payload })
          }
          isPending={cerrarMutation.isPending}
          error={cerrarMutation.error}
        />
      )}
    </div>
  )
}

function ResumenCaja({
  label,
  valor,
  textToNumber = true,
}: {
  label: string
  valor: number | string | null | undefined
  textToNumber?: boolean
}) {
  return (
    <div className="rounded-2xl bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {textToNumber ? formatCurrency(valor as number) : (valor ?? '—')}
      </p>
    </div>
  )
}

function AbrirCajaModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  onClose: () => void
  onSubmit: (payload: CajaAbrirRequest) => void
  isPending: boolean
  error: unknown
}) {
  const [montoEsperado, setMontoEsperado] = useState('')
  const [observaciones, setObservaciones] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const monto = Number(montoEsperado)
    if (montoEsperado === '' || Number.isNaN(monto) || monto < 0) return
    onSubmit({
      montoEsperado: monto,
      observaciones: observaciones || undefined,
    })
  }

  return (
    <Modal open title="Abrir caja" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CampoMonto
          label="Monto esperado inicial"
          value={montoEsperado}
          onChange={setMontoEsperado}
          placeholder="0.00"
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Observaciones</span>
          <input
            type="text"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Error al abrir caja'}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {isPending ? 'Abriendo...' : 'Abrir caja'}
        </button>
      </form>
    </Modal>
  )
}

function CerrarCajaModal({
  caja,
  onClose,
  onSubmit,
  isPending,
  error,
}: {
  caja: Caja
  onClose: () => void
  onSubmit: (payload: CajaCerrarRequest) => void
  isPending: boolean
  error: unknown
}) {
  const [montoReal, setMontoReal] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const monto = Number(montoReal)
    if (montoReal === '' || Number.isNaN(monto) || monto < 0) return
    onSubmit({ montoReal: monto })
  }

  return (
    <Modal open title="Cerrar caja" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm">
          <p className="text-gray-500">Monto esperado</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(caja.montoEsperado)}
          </p>
        </div>
        <CampoMonto
          label="Monto real en caja"
          value={montoReal}
          onChange={setMontoReal}
          placeholder="0.00"
        />
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Error al cerrar caja'}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Cerrando...' : 'Cerrar caja'}
        </button>
      </form>
    </Modal>
  )
}

function CampoMonto({
  label,
  value,
  onChange,
  placeholder,
  min,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  )
}

// ---------------- Movimientos ----------------

function MovimientosTab() {
  const { data: movimientos, isLoading } = useQuery({
    queryKey: ['movimientos'],
    queryFn: () => getMovimientos(),
  })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Movimientos de inventario</h2>
        <p className="text-sm text-gray-500">
          Entradas y salidas generadas automáticamente por los pedidos.
        </p>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : movimientos && movimientos.length > 0 ? (
        <div className="flex flex-col gap-2">
          {movimientos.map((mov) => (
            <MovimientoRow key={mov.id} mov={mov} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          Sin movimientos registrados.
        </p>
      )}
    </div>
  )
}

function MovimientoRow({ mov }: { mov: MovInventario }) {
  const esSalida = mov.tipoMovimiento === 'SALIDA'
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          esSalida ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
        }`}
      >
        <ArrowLeftRight className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">
          {mov.idProducto?.nombre ?? 'Producto'}
        </p>
        <p className="text-xs text-gray-400">
          {mov.tipoMovimiento}
          {mov.idPedido ? ` · Pedido #${mov.idPedido.id}` : ''} ·{' '}
          {formatFecha(mov.fecha)}
        </p>
      </div>
      <span
        className={`shrink-0 font-bold ${esSalida ? 'text-red-500' : 'text-green-600'}`}
      >
        {esSalida ? '−' : '+'}
        {mov.cantidad}
      </span>
    </div>
  )
}