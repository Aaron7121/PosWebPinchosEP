import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Boxes, ChefHat, ClipboardList, Download, LogOut, ReceiptText, Settings, X, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
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
  { to: '/cocina', label: 'Pantallas de cocina', icon: ChefHat },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const STORAGE_KEY = 'sidebar-collapsed'

export function Sidebar({ open, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <>
      {/* Mobile drawer (< md) - unchanged */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
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
            <SidebarContent collapsed={false} onNavigate={onClose} />
          </aside>
        </div>
      )}

      {/* Collapsible sidebar (md+) */}
      <aside className={`hidden md:flex flex-col shrink-0 border-r border-gray-100 bg-white transition-all duration-200 h-full select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
        />
      </aside>
    </>
  )
}

function SidebarContent({
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { canInstall, promptInstall } = useInstallPrompt()
  const location = useLocation()

  const showText = !collapsed

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-3 lg:px-5">
        <img
          src={logoNegocio}
          alt="Pinchos"
          className="h-10 w-10 shrink-0 rounded-xl object-contain"
        />
        {showText && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">Pinchos</p>
            <p className="truncate text-xs text-gray-500">El parqueadero</p>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className={`ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 ${collapsed ? 'rotate-180' : ''}`}
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 lg:p-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onNavigate}
              className={`
                flex h-12 items-center gap-3 rounded-xl px-3 lg:px-4 text-sm font-medium transition-all duration-200
                ${collapsed ? 'justify-center' : ''}
                ${isActive ? 'bg-orange-50 text-orange-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {showText && <span className="truncate">{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-gray-100 p-2 lg:p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          {showText && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.name ?? 'Usuario'}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.role}</p>
            </div>
          )}
        </div>

        <SoundToggle
          showLabel={showText}
          className={`flex h-11 w-full items-center gap-3 rounded-xl px-2 lg:px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 ${collapsed ? 'justify-center' : ''}`}
        />

        {canInstall && (
          <button
            type="button"
            onClick={promptInstall}
            className={`flex h-11 w-full items-center gap-3 rounded-xl px-2 lg:px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Instalar app' : undefined}
          >
            <Download className="h-5 w-5 shrink-0" />
            {showText && <span>Instalar app</span>}
          </button>
        )}

        <button
          type="button"
          onClick={logout}
          className={`flex h-11 w-full items-center gap-3 rounded-xl px-2 lg:px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-500 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {showText && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  )
}