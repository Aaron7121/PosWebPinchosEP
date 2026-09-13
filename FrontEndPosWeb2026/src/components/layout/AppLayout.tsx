import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { useNotifications } from '../../hooks/useNotifications'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  useNotifications()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setMenuOpen(true)} />
        <Outlet />
      </main>
    </div>
  )
}
