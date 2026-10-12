import { useQuery } from '@tanstack/react-query'
import { getDetallesPedido } from '../../api/pedidos'
import type { Pedido } from '../../types/pos'
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
  const { data: detalles, isLoading } = useQuery({
    queryKey: ['pedidos', pedido.id, 'detalles'],
    queryFn: () => getDetallesPedido(pedido.id),
  })

  return (
    <Modal
      open
      title={`Cobro de Pedido #${pedido.id}`}
      onClose={onClose}
      maxWidth="max-w-xl md:max-w-4xl lg:max-w-5xl"
    >
      <CobroForm
        pedido={pedido}
        detalles={detalles}
        isLoadingDetalles={isLoading}
        onSuccess={() => {
          onPaid?.()
          onClose()
        }}
      />
    </Modal>
  )
}
