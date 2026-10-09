import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { useCocinaPerfiles } from '../../store/cocinaPerfiles'
import type { TamanoCocina } from '../../store/cocinaPerfiles'
import { useNotificationsStore } from '../../store/notifications'
import { fechaMs, usePedidosCocina } from '../../hooks/usePedidosCocina'
import { useNotifications } from '../../hooks/useNotifications'
import { playSound, unlockAudio } from '../../utils/sound'

const TEXTO: Record<TamanoCocina, string> = {
  normal: 'text-xl',
  grande: 'text-3xl',
  enorme: 'text-5xl',
}

function colorEspera(min: number) {
  if (min >= 15) return 'border-red-500 bg-red-950'
  if (min >= 8) return 'border-amber-400 bg-amber-950'
  return 'border-emerald-500 bg-gray-900'
}

export function TableroCocina() {
  const { perfilId } = useParams()
  const perfil = useCocinaPerfiles((s) => s.perfiles.find((p) => p.id === perfilId))
  const hechos = useCocinaPerfiles((s) => s.hechos)
  const marcarHecho = useCocinaPerfiles((s) => s.marcarHecho)
  const limpiarHechos = useCocinaPerfiles((s) => s.limpiarHechos)
  const silenciado = useNotificationsStore((s) => s.silenciado)
  const toggleSilenciado = useNotificationsStore((s) => s.toggleSilenciado)
  const [ahora, setAhora] = useState(() => Date.now())

  useNotifications({ avisos: false })
  const { tarjetas, isLoading, isError } = usePedidosCocina(perfil)

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 20_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useEffect(() => {
    if (isLoading || isError) return
    const vigentes = new Set<string>()
    for (const t of tarjetas) {
      for (const d of t.items) vigentes.add(`${t.pedido.id}:${d.id}`)
    }
    limpiarHechos(vigentes)
  }, [tarjetas, isLoading, isError, limpiarHechos])

  if (!perfil) return <Navigate to="/cocina" replace />

  const texto = TEXTO[perfil.tamano]

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        <div className="flex items-center gap-3">
          <Link
            to="/cocina"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Volver a perfiles"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold">{perfil.nombre}</h1>
          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-sm text-gray-300">
            {tarjetas.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            unlockAudio()
            if (silenciado) playSound('nuevo')
            toggleSilenciado()
          }}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
        >
          {silenciado ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="py-16 text-center text-xl text-gray-500">Cargando...</p>
        ) : isError ? (
          <p className="py-16 text-center text-xl text-red-400">
            Sin conexión con el servidor. Reintentando...
          </p>
        ) : tarjetas.length === 0 ? (
          <p className="py-16 text-center text-2xl text-gray-600">
            Sin pedidos pendientes
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {tarjetas.map(({ pedido, items }) => {
              const min = Math.max(0, Math.floor((ahora - fechaMs(pedido)) / 60_000))
              const hora = pedido.fecha
                ? new Date(pedido.fecha).toLocaleTimeString('es-EC', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''
              return (
                <article
                  key={pedido.id}
                  className={`rounded-2xl border-2 p-4 ${colorEspera(min)}`}
                >
                  <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
                    <span className="text-2xl font-extrabold">
                      #{pedido.id}
                      {perfil.mostrarMesa && pedido.numMesa != null && (
                        <span className="ml-2 text-amber-300">Mesa {pedido.numMesa}</span>
                      )}
                    </span>
                    {perfil.mostrarHora && (
                      <span className="text-sm text-gray-300">
                        {hora} · {min} min
                      </span>
                    )}
                  </div>
                  {perfil.mostrarMesa && pedido.tipoServicio && (
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                      {pedido.tipoServicio}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {items.map((d) => {
                      const hecho = !!hechos[`${pedido.id}:${d.id}`]
                      return (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={() => marcarHecho(`${pedido.id}:${d.id}`)}
                            className={`flex w-full items-baseline gap-3 rounded-lg px-2 py-1 text-left font-bold ${texto} ${
                              hecho ? 'text-gray-600 line-through' : 'hover:bg-white/5'
                            }`}
                          >
                            <span className="text-amber-300">{d.cantidad ?? 1}×</span>
                            <span>{d.idPlato?.nombre}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {perfil.mostrarComentario && pedido.comentario && (
                    <p className="mt-3 rounded-lg bg-yellow-400/15 px-3 py-2 text-lg font-semibold text-yellow-200">
                      {pedido.comentario}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
