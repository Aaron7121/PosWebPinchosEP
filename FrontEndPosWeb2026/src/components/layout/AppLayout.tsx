import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationCenter } from '../ui/NotificationCenter'
import { VistoOverlay } from '../ui/VistoOverlay'
import { unlockAudio } from '../../utils/sound'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  useNotifications()

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setMenuOpen(true)} />
        <Outlet />
      </main>
      <NotificationCenter />
      <VistoOverlay />
    </div>
  )
}
