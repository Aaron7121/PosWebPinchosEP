import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-50"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">
        P
      </span>
      <p className="text-sm font-bold text-gray-900">PINCHOS · El Parqueadero</p>
    </header>
  )
}
