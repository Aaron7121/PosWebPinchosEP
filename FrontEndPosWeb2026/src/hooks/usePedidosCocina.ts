import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDetallesPedido, getPedidos } from '../api/pedidos'
import type { DetallePedido, Pedido } from '../types/pos'
import type { PerfilCocina } from '../store/cocinaPerfiles'
import { playSound } from '../utils/sound'
import { useNotificationsStore } from '../store/notifications'

export interface PedidoCocina {
  pedido: Pedido
  items: DetallePedido[]
}

async function cargarPendientes(): Promise<PedidoCocina[]> {
  const pedidos = await getPedidos()
  const pendientes = pedidos.filter((p) => p.estadoPedido === 'PENDIENTE')
  return Promise.all(
    pendientes.map(async (pedido) => ({
      pedido,
      items: await getDetallesPedido(pedido.id),
    })),
  )
}

export function usePedidosCocina(perfil: PerfilCocina | undefined) {
  const silenciado = useNotificationsStore((s) => s.silenciado)

  const query = useQuery({
    queryKey: ['pedidos', 'cocina'],
    queryFn: cargarPendientes,
    refetchInterval: 15_000,
  })

  const categorias = useMemo(
    () => new Set(perfil?.categoriaIds ?? []),
    [perfil?.categoriaIds],
  )

  const tarjetas = useMemo(() => {
    if (!perfil) return []
    return (query.data ?? [])
      .map(({ pedido, items }) => ({
        pedido,
        items: items.filter((d) => {
          const cat = d.idPlato?.idCategoria
          if (!cat) return false
          return (
            categorias.has(cat.id) ||
            (cat.categoriaPadre != null && categorias.has(cat.categoriaPadre.id))
          )
        }),
      }))
      .filter((t) => t.items.length > 0)
      .sort((a, b) => fechaMs(a.pedido) - fechaMs(b.pedido))
  }, [query.data, categorias, perfil])

  // Suena solo cuando aparece un pedido nuevo que corresponde a este perfil
  const conocidos = useRef<Set<number> | null>(null)
  useEffect(() => {
    if (!query.data) return
    const ids = new Set(tarjetas.map((t) => t.pedido.id))
    if (conocidos.current) {
      const hayNuevo = [...ids].some((id) => !conocidos.current!.has(id))
      if (hayNuevo && perfil?.sonido && !silenciado) playSound('nuevo')
    }
    conocidos.current = ids
  }, [tarjetas, query.data, perfil?.sonido, silenciado])

  return { ...query, tarjetas }
}

export function fechaMs(pedido: Pedido): number {
  const t = pedido.fecha ? new Date(pedido.fecha).getTime() : NaN
  return Number.isNaN(t) ? 0 : t
}
