import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playSound } from '../utils/sound'
import type { SoundKind } from '../utils/sound'

export interface NotifEvento {
  tipo: SoundKind
  id: number
  total?: number | null
}

interface ToastState extends NotifEvento {
  key: number
}

interface VistoState {
  id: number
  key: number
}

interface NotificationsState {
  silenciado: boolean
  toast: ToastState | null
  visto: VistoState | null
  toggleSilenciado: () => void
  notificar: (evento: NotifEvento) => void
  mostrarVisto: (id: number) => void
  limpiarToast: () => void
  limpiarVisto: () => void
}

let keyCounter = 0

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      silenciado: false,
      toast: null,
      visto: null,
      toggleSilenciado: () => set({ silenciado: !get().silenciado }),
      notificar: (evento) => {
        if (!get().silenciado) playSound(evento.tipo)
        set({ toast: { ...evento, key: ++keyCounter } })
      },
      mostrarVisto: (id) => {
        if (!get().silenciado) playSound('cobrado')
        set({ visto: { id, key: ++keyCounter } })
      },
      limpiarToast: () => set({ toast: null }),
      limpiarVisto: () => set({ visto: null }),
    }),
    {
      name: 'pos-notif',
      partialize: (state) => ({ silenciado: state.silenciado }),
    },
  ),
)
