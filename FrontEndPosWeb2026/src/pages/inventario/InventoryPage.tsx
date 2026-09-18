import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeftRight,
  Banknote,
  Boxes,
} from 'lucide-react'
import { InventarioTab } from './InventarioTab'
import { CajaTab } from './CajaTab'
import { MovimientosTab } from './MovimientosTab'

type Tab = 'inventario' | 'caja' | 'movimientos'

export function InventoryPage() {
  const [searchParams] = useSearchParams()
  const paramTab = searchParams.get('tab')
  const [tab, setTab] = useState<Tab>(
    paramTab === 'caja'
      ? 'caja'
      : paramTab === 'movimientos'
        ? 'movimientos'
        : 'inventario',
  )

  const tabs: { id: Tab; label: string; icon: typeof Boxes }[] = [
     { id: 'caja', label: 'Caja', icon: Banknote },
    { id: 'inventario', label: 'Inventario', icon: Boxes },
   
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center border-b border-gray-100 bg-white px-6">
        <h1 className="text-lg font-bold text-gray-900">Inventario y caja</h1>
      </header>

      <nav className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-6 py-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-orange-50 text-orange-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'caja' && <CajaTab />}
        {tab === 'inventario' && <InventarioTab />}
        {tab === 'movimientos' && <MovimientosTab />}
      </div>
    </div>
  )
}
