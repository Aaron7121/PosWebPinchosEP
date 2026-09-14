interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: 'danger' | 'primary'
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              confirmVariant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isPending ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}