import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote } from 'lucide-react'
import { abrirCaja, cerrarCaja, getCajaAbierta, getCajas, getResumenCierre } from '../../api/caja'
import { getInventario } from '../../api/inventario'
import type {
  Caja,
  CajaAbrirRequest,
  CajaCerrarRequest,
} from '../../types/pos'
import { formatCurrency, formatFecha, todayISO } from '../../utils/format'
import { Modal } from '../../components/ui/Modal'
import { CampoMonto } from './CampoMonto'

export function CajaTab() {
  const queryClient = useQueryClient()
  const hoy = todayISO()

  const { data: cajaAbierta, isLoading } = useQuery({
    queryKey: ['cajas', 'abierta'],
    queryFn: getCajaAbierta,
    retry: false,
    refetchInterval: 15_000,
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

  const abrirMutation = useMutation({
    mutationFn: (payload: CajaAbrirRequest) => abrirCaja(payload),
    onSuccess: (caja) => {
      queryClient.setQueryData(['cajas', 'abierta'], caja)
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
      setAbriendo(false)
    },
  })

  const cerrarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CajaCerrarRequest }) =>
      cerrarCaja(id, payload),
    onSuccess: () => {
      queryClient.setQueryData(['cajas', 'abierta'], null as unknown as Caja | undefined)
      queryClient.invalidateQueries({ queryKey: ['cajas', 'abierta'] })
      queryClient.invalidateQueries({ queryKey: ['cajas'] })
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
  const { data: resumen, isLoading } = useQuery({
    queryKey: ['cajas', caja.id, 'resumen-cierre'],
    queryFn: () => getResumenCierre(caja.id),
  })

  const [montoReal, setMontoReal] = useState('')
  const [montoTransferencia, setMontoTransferencia] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  const montoRealNum = Number(montoReal)
  const montoTransferenciaNum = Number(montoTransferencia)

  const diferenciaEfectivo =
    montoReal !== '' && !Number.isNaN(montoRealNum) && resumen
      ? montoRealNum - resumen.efectivoEsperado
      : null
  const diferenciaTransferencia =
    montoTransferencia !== '' && !Number.isNaN(montoTransferenciaNum) && resumen
      ? montoTransferenciaNum - resumen.transferenciaEsperada
      : null

  const hayDescuadre =
    (diferenciaEfectivo !== null && diferenciaEfectivo !== 0) ||
    (diferenciaTransferencia !== null && diferenciaTransferencia !== 0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (montoReal === '' || Number.isNaN(montoRealNum) || montoRealNum < 0) return
    onSubmit({ montoReal: montoRealNum })
  }

  return (
    <Modal open title="Cerrar caja" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isLoading || !resumen ? (
          <p className="py-4 text-center text-sm text-gray-400">
            Calculando resumen...
          </p>
        ) : (
          <>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm">
              <FilaResumen label="Monto inicial (fondo)" valor={resumen.montoInicial} />
              <FilaResumen label="Ventas en efectivo" valor={resumen.totalEfectivo} />
              <FilaResumen label="Ventas por transferencia" valor={resumen.totalTransferencia} />
              <div className="my-2 border-t border-gray-200" />
              <FilaResumen label="Efectivo esperado" valor={resumen.efectivoEsperado} />
              <FilaResumen label="Transferencia esperada" valor={resumen.transferenciaEsperada} />
              <FilaResumen label="Total esperado" valor={resumen.totalEsperado} strong />
            </div>

            <CampoMonto
              label="Monto real en caja (efectivo contado)"
              value={montoReal}
              onChange={setMontoReal}
              placeholder="0.00"
            />
            {diferenciaEfectivo !== null && (
              <DescuadreLinea monto={diferenciaEfectivo} />
            )}

            <CampoMonto
              label="Monto real transferencias (extracto)"
              value={montoTransferencia}
              onChange={setMontoTransferencia}
              placeholder="0.00"
            />
            {diferenciaTransferencia !== null && (
              <DescuadreLinea monto={diferenciaTransferencia} />
            )}

            {hayDescuadre && (
              <label className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <input
                  type="checkbox"
                  checked={confirmado}
                  onChange={(e) => setConfirmado(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-amber-600"
                />
                <span>
                  Confirmo que he revisado el sobrante/faltante y quiero cerrar la caja.
                </span>
              </label>
            )}
          </>
        )}

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Error al cerrar caja'}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || isLoading || (hayDescuadre && !confirmado)}
          className="rounded-xl bg-gray-900 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? 'Cerrando...' : 'Cerrar caja'}
        </button>
      </form>
    </Modal>
  )
}

function FilaResumen({
  label,
  valor,
  strong = false,
}: {
  label: string
  valor: number
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-gray-500">{label}</span>
      <span
        className={
          strong
            ? 'font-bold text-gray-900'
            : 'font-medium text-gray-900'
        }
      >
        {formatCurrency(valor)}
      </span>
    </div>
  )
}

function DescuadreLinea({ monto }: { monto: number }) {
  if (monto === 0) {
    return (
      <p className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">
        Cuadre exacto
      </p>
    )
  }
  if (monto > 0) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
        Sobrante: {formatCurrency(monto)}
      </p>
    )
  }
  return (
    <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
      Faltante: {formatCurrency(Math.abs(monto))}
    </p>
  )
}
