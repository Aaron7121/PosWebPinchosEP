import { NavLink } from 'react-router-dom'
import { BarChart3, Boxes, LogOut, ReceiptText, Settings } from 'lucide-react'
import { useAuthStore } from '../../store/auth'

const navItems = [
  { to: '/', label: 'Nuevo pedido', icon: ReceiptText },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
  { to: '/inventario', label: 'Inventario y caja', icon: Boxes },
  { to: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <aside className="flex h-full w-20 shrink-0 flex-col items-center border-r border-gray-100 bg-white">
      <div className="flex h-16 w-full items-center justify-center border-b border-gray-100">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold text-white">
          P
        </span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-500'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>

      <div className="flex w-full flex-col items-center gap-2 border-t border-gray-100 py-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white"
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <button
          type="button"
          onClick={logout}
          title="Cerrar sesión"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
