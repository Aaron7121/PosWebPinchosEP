import { NavLink } from 'react-router-dom'
import { BarChart3, Boxes, ClipboardList, Download, LogOut, ReceiptText, Settings, X } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { SoundToggle } from '../ui/SoundToggle'
import logoNegocio from '../../api/assets/logoNegocio.png'


const navItems = [
  { to: '/', label: 'Nuevo pedido', icon: ReceiptText },
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
  { to: '/inventario', label: 'Inventario y caja', icon: Boxes },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Menú deslizante móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-lg">
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-sm font-semibold text-gray-400">Menú</span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { canInstall, promptInstall } = useInstallPrompt()

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-5">
        <img
          src={logoNegocio}
          alt="Pinchos"
          className="h-10 w-10 shrink-0 rounded-xl object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">Pinchos</p>
          <p className="truncate text-xs text-gray-500">El parqueadero</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.name ?? 'Usuario'}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <SoundToggle
          showLabel
          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        />
        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Download className="h-5 w-5 shrink-0" />
            Instalar app
          </button>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}
