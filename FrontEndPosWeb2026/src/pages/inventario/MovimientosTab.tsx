import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight } from 'lucide-react'
import { getMovimientos } from '../../api/movimientos'
import type { MovInventario } from '../../types/pos'
import { formatFecha } from '../../utils/format'

export function MovimientosTab() {
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
