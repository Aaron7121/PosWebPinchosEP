import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDetallesPedido } from '../../api/pedidos'
import type { Pedido } from '../../types/pos'
import { formatCurrency } from '../../utils/format'
import { Modal } from './Modal'
import { CobroForm } from './CobroForm'

export function CobroModal({
  pedido,
  onClose,
  onPaid,
}: {
  pedido: Pedido
  onClose: () => void
  onPaid?: () => void
}) {
  const { data: detalles } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
  })

  const total = pedido.total ?? 0
  const subtotal = useMemo(
    () => (detalles ?? []).reduce((acc, d) => acc + (d.subtotal ?? 0), 0),
    [detalles],
  )

  return (
    <Modal open title={`Cobrar pedido #${pedido.id}`} onClose={onClose}>
      <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto">
        {detalles && detalles.length > 0 && (
          <div className="rounded-2xl bg-gray-50 p-4">
            <ul className="flex flex-col gap-1">
              {detalles.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">
                    {d.cantidad}× {d.idPlato?.nombre ?? 'Plato'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(d.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-xl font-bold text-orange-500">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}

        <CobroForm
          pedido={pedido}
          onSuccess={() => {
            onPaid?.()
            onClose()
          }}
        />
      </div>
    </Modal>
  )
}
