import { useQuery } from '@tanstack/react-query'
import { getDetallesPedido } from '../../api/pedidos'
import type { ClientePagoRequest, DetallePedido, PagoItemRequest, Pedido } from '../../types/pos'
import { Modal } from './Modal'
import { CobroForm } from './CobroForm'

export function CobroModal({
  pedido,
  onClose,
  onPaid,
  detalles: detallesProp,
  onCobrar,
}: {
  pedido: Pedido
  onClose: () => void
  onPaid?: () => void
  detalles?: DetallePedido[]
  onCobrar?: (data: {
    cliente?: ClientePagoRequest
    pagos: PagoItemRequest[]
  }) => Promise<void>
}) {
  const isDraft = !pedido.id || pedido.id === 0
  const { data: detallesQuery, isLoading } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
    enabled: !isDraft && detallesProp === undefined,
  })

  const detalles = detallesProp ?? detallesQuery

  return (
    <Modal
      open
      title={isDraft ? 'Cobrar Pedido' : `Cobro de Pedido #${pedido.id}`}
      onClose={onClose}
      maxWidth="max-w-xl md:max-w-4xl lg:max-w-5xl"
    >
      <CobroForm
        pedido={pedido}
        detalles={detalles}
        isLoadingDetalles={isDraft ? false : isLoading}
        onCobrar={onCobrar}
        onSuccess={() => {
          onPaid?.()
          onClose()
        }}
      />
    </Modal>
  )
}
