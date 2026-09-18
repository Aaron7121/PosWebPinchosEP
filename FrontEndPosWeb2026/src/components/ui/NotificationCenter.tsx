import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificationsStore } from '../../store/notifications'
import { formatCurrency } from '../../utils/format'

const TITULO: Record<string, string> = {
  nuevo: 'Nuevo pedido',
  listo: 'Pedido listo',
  cobrado: 'Pedido pagado',
}

const COLOR: Record<string, string> = {
  nuevo: 'bg-orange-500',
  listo: 'bg-green-500',
  cobrado: 'bg-emerald-500',
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const toast = useNotificationsStore((s) => s.toast)
  const limpiarToast = useNotificationsStore((s) => s.limpiarToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(limpiarToast, 4000)
    return () => clearTimeout(timer)
  }, [toast, limpiarToast])

  if (!toast) return null

  function abrirPedido() {
    if (!toast) return
    limpiarToast()
    navigate(`/pedidos?pedido=${toast.id}`)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-3">
      <button
        type="button"
        key={toast.key}
        onClick={abrirPedido}
        className="toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl bg-gray-900 text-left text-white shadow-lg transition-transform active:scale-95"
      >
        <span
          className={`h-full w-1.5 shrink-0 self-stretch ${COLOR[toast.tipo] ?? 'bg-orange-500'}`}
        />
        <span className="min-w-0 flex-1 py-3 pr-4">
          <span className="block text-sm font-bold">
            {TITULO[toast.tipo] ?? 'Pedido'}
          </span>
          <span className="block truncate text-xs text-gray-300">
            Pedido #{toast.id}
            {toast.total != null ? ` · ${formatCurrency(toast.total)}` : ''}
          </span>
        </span>
      </button>
    </div>
  )
}
