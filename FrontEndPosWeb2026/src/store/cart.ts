import { create } from 'zustand'
import type { Plato } from '../types/catalogo'

export interface CartItem {
  plato: Plato
  cantidad: number
  paraLlevar: boolean
}

export function getPrecioUnitarioItem(item: { plato: Plato; paraLlevar: boolean }): number {
  if (item.paraLlevar && item.plato.precioLlevar != null && item.plato.precioLlevar > 0) {
    return item.plato.precioLlevar
  }
  return item.plato.precio ?? 0
}

interface CartStore {
  items: CartItem[]
  addItem: (plato: Plato, paraLlevar?: boolean) => void
  setCantidad: (platoId: number, paraLlevar: boolean, cantidad: number) => void
  toggleParaLlevar: (platoId: number, currentParaLlevar: boolean) => void
  clearCart: () => void
  setCart: (items: CartItem[]) => void
  getSubtotal: () => number
  getTotalUnidades: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (plato, paraLlevar = false) => {
    set((state) => {
      const existente = state.items.find(
        (i) => i.plato.id === plato.id && i.paraLlevar === paraLlevar,
      )
      if (existente) {
        return {
          items: state.items.map((i) =>
            i.plato.id === plato.id && i.paraLlevar === paraLlevar
              ? { ...i, cantidad: i.cantidad + 1 }
              : i,
          ),
        }
      }
      return {
        items: [...state.items, { plato, cantidad: 1, paraLlevar }],
      }
    })
  },

  setCantidad: (platoId, paraLlevar, cantidad) => {
    set((state) => {
      if (cantidad <= 0) {
        return {
          items: state.items.filter(
            (i) => !(i.plato.id === platoId && i.paraLlevar === paraLlevar),
          ),
        }
      }
      return {
        items: state.items.map((i) =>
          i.plato.id === platoId && i.paraLlevar === paraLlevar
            ? { ...i, cantidad }
            : i,
        ),
      }
    })
  },

  toggleParaLlevar: (platoId, currentParaLlevar) => {
    set((state) => {
      const nuevoParaLlevar = !currentParaLlevar
      const itemActual = state.items.find(
        (i) => i.plato.id === platoId && i.paraLlevar === currentParaLlevar,
      )
      if (!itemActual) return state

      const yaExisteDestino = state.items.find(
        (i) => i.plato.id === platoId && i.paraLlevar === nuevoParaLlevar,
      )

      if (yaExisteDestino) {
        // Combinar en el destino existente y eliminar la línea origen
        return {
          items: state.items
            .filter((i) => !(i.plato.id === platoId && i.paraLlevar === currentParaLlevar))
            .map((i) =>
              i.plato.id === platoId && i.paraLlevar === nuevoParaLlevar
                ? { ...i, cantidad: i.cantidad + itemActual.cantidad }
                : i,
            ),
        }
      }

      // No existe destino, solo cambia el booleano
      return {
        items: state.items.map((i) =>
          i.plato.id === platoId && i.paraLlevar === currentParaLlevar
            ? { ...i, paraLlevar: nuevoParaLlevar }
            : i,
        ),
      }
    })
  },

  clearCart: () => set({ items: [] }),

  setCart: (items) => set({ items }),

  getSubtotal: () => {
    return get().items.reduce((suma, i) => suma + getPrecioUnitarioItem(i) * i.cantidad, 0)
  },

  getTotalUnidades: () => {
    return get().items.reduce((suma, i) => suma + i.cantidad, 0)
  },
}))
