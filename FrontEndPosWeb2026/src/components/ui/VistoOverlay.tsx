import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { useNotificationsStore } from '../../store/notifications'

export function VistoOverlay() {
  const visto = useNotificationsStore((s) => s.visto)
  const limpiarVisto = useNotificationsStore((s) => s.limpiarVisto)

  useEffect(() => {
    if (!visto) return
    const timer = setTimeout(limpiarVisto, 1300)
    return () => clearTimeout(timer)
  }, [visto, limpiarVisto])

  if (!visto) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
      <div
        key={visto.key}
        className="visto-anim flex flex-col items-center rounded-3xl bg-green-500 px-10 py-8 text-white shadow-2xl"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/25">
          <Check className="h-10 w-10" strokeWidth={3} />
        </div>
        <p className="mt-3 text-lg font-bold">Pedido #{visto.id} pagado</p>
      </div>
    </div>
  )
}
