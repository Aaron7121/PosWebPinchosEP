import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const MAX_BACKOFF = 30_000

const DOMAIN_KEYS: unknown[][] = [
  ['platos'],
  ['categorias'],
  ['productos'],
  ['inventario'],
  ['movimientos'],
  ['pedidos'],
  ['cajas'],
]

export function useNotifications() {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return

    let source: EventSource | null = null
    let retries = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closed = false
    let firstOpen = true

    function catchUp() {
      for (const key of DOMAIN_KEYS) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    }

    function invalidar(type?: string) {
      switch (type) {
        case 'catalogo:modificado':
          queryClient.invalidateQueries({ queryKey: ['platos'] })
          queryClient.invalidateQueries({ queryKey: ['categorias'] })
          break
        case 'inventario:modificado':
          queryClient.invalidateQueries({ queryKey: ['productos'] })
          queryClient.invalidateQueries({ queryKey: ['inventario'] })
          queryClient.invalidateQueries({ queryKey: ['movimientos'] })
          break
        case 'pedido:nuevo':
        case 'pedido:actualizado':
        case 'pedido:eliminado':
          queryClient.invalidateQueries({ queryKey: ['pedidos'] })
          queryClient.invalidateQueries({ queryKey: ['inventario'] })
          queryClient.invalidateQueries({ queryKey: ['movimientos'] })
          break
        case 'caja:modificado':
          queryClient.invalidateQueries({ queryKey: ['cajas'] })
          break
      }
    }

    function connect() {
      if (closed) return
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }

      source = new EventSource(`${API_URL}/stream?token=${token}`)

      source.onopen = () => {
        if (firstOpen) {
          firstOpen = false
        } else {
          catchUp()
        }
        retries = 0
      }

      source.onmessage = (event) => {
        try {
          const { type } = JSON.parse(event.data) as { type?: string }
          invalidar(type)
        } catch {
          // Ignorar mensajes malformados
        }
      }

      source.onerror = () => {
        source?.close()
        source = null
        if (closed) return
        const delay = Math.min(1000 * 2 ** retries, MAX_BACKOFF)
        retries += 1
        reconnectTimer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      source?.close()
    }
  }, [queryClient, token])
}
