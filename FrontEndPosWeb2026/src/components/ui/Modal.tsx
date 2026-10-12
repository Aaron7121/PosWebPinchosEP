import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  className?: string
}

export function Modal({
  open,
  title,
  onClose,
  children,
  maxWidth = 'max-w-sm',
  className = '',
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div
        className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-xl transition-all ${className}`}
      >
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-white pb-1">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
