import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export function useNotifications() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const token = useAuthStore.getState().token
    if (!token) return

    const source = new EventSource(`${API_URL}/stream?token=${token}`)

    source.onmessage = (event) => {
      try {
        const { type } = JSON.parse(event.data) as { type?: string }

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
            break
          case 'caja:modificado':
            queryClient.invalidateQueries({ queryKey: ['cajas'] })
            break
        }
      } catch {
        // Ignorar mensajes malformados
      }
    }

    return () => source.close()
  }, [queryClient])
}
