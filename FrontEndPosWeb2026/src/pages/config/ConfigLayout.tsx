import { NavLink, Outlet } from 'react-router-dom'
import { UserRound, Users } from 'lucide-react'

const tabs = [
  { to: '/configuracion/perfil', label: 'Mi perfil', icon: UserRound },
  { to: '/configuracion/usuarios', label: 'Usuarios', icon: Users },
]

export function ConfigLayout() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center border-b border-gray-100 bg-white px-6">
        <h1 className="text-lg font-bold text-gray-900">Configuración</h1>
      </header>

      <nav className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-6 py-3">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  )
}
