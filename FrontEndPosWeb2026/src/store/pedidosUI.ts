import { create } from 'zustand'

interface PedidosUIState {
  expandidos: Record<number, boolean>
  toggle: (id: number) => void
  colapsar: (id: number) => void
  expandir: (id: number) => void
}

export const usePedidosUI = create<PedidosUIState>((set) => ({
  expandidos: {},
  toggle: (id) =>
    set((state) => ({
      expandidos: {
        ...state.expandidos,
        [id]: !(state.expandidos[id] ?? true),
      },
    })),
  colapsar: (id) =>
    set((state) => ({
      expandidos: { ...state.expandidos, [id]: false },
    })),
  expandir: (id) =>
    set((state) => ({
      expandidos: { ...state.expandidos, [id]: true },
    })),
}))
