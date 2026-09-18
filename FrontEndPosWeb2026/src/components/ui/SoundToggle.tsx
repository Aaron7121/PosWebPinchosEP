import { Volume2, VolumeX } from 'lucide-react'
import { useNotificationsStore } from '../../store/notifications'

export function SoundToggle({
  className = '',
  showLabel = false,
}: {
  className?: string
  showLabel?: boolean
}) {
  const silenciado = useNotificationsStore((s) => s.silenciado)
  const toggleSilenciado = useNotificationsStore((s) => s.toggleSilenciado)

  return (
    <button
      type="button"
      onClick={toggleSilenciado}
      aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
      aria-pressed={silenciado}
      title={silenciado ? 'Activar sonido' : 'Silenciar'}
      className={className}
    >
      {silenciado ? (
        <VolumeX className="h-5 w-5 shrink-0" />
      ) : (
        <Volume2 className="h-5 w-5 shrink-0" />
      )}
      {showLabel ? (
        <span className="truncate">
          {silenciado ? 'Sonido silenciado' : 'Sonido activado'}
        </span>
      ) : null}
    </button>
  )
}
