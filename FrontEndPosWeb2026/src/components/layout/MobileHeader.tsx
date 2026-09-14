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
      <img
        src="/logo-negocio.png"
        alt="Pinchos"
        className="h-8 w-8 shrink-0 rounded-lg object-contain"
      />
      <p className="text-sm font-bold text-gray-900">Pinchos · El parqueadero</p>
    </header>
  )
}
