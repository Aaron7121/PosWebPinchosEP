import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TamanoCocina = 'normal' | 'grande' | 'enorme'

export interface PerfilCocina {
  id: string
  nombre: string
  categoriaIds: number[]
  mostrarMesa: boolean
  mostrarComentario: boolean
  mostrarHora: boolean
  sonido: boolean
  tamano: TamanoCocina
}

export type PerfilBorrador = Omit<PerfilCocina, 'id'>

export const PERFIL_VACIO: PerfilBorrador = {
  nombre: '',
  categoriaIds: [],
  mostrarMesa: true,
  mostrarComentario: true,
  mostrarHora: true,
  sonido: true,
  tamano: 'grande',
}

interface CocinaPerfilesState {
  perfiles: PerfilCocina[]
  hechos: Record<string, number>
  guardar: (perfil: PerfilBorrador, id?: string) => string
  eliminar: (id: string) => void
  duplicar: (id: string) => void
  marcarHecho: (clave: string) => void
  limpiarHechos: (vigentes: Set<string>) => void
}

export const useCocinaPerfiles = create<CocinaPerfilesState>()(
  persist(
    (set, get) => ({
      perfiles: [],
      hechos: {},
      guardar: (perfil, id) => {
        const finalId = id ?? crypto.randomUUID()
        set((s) => ({
          perfiles: id
            ? s.perfiles.map((p) => (p.id === id ? { ...perfil, id } : p))
            : [...s.perfiles, { ...perfil, id: finalId }],
        }))
        return finalId
      },
      eliminar: (id) =>
        set((s) => ({ perfiles: s.perfiles.filter((p) => p.id !== id) })),
      duplicar: (id) => {
        const original = get().perfiles.find((p) => p.id === id)
        if (!original) return
        set((s) => ({
          perfiles: [
            ...s.perfiles,
            {
              ...original,
              id: crypto.randomUUID(),
              nombre: `${original.nombre} (copia)`,
            },
          ],
        }))
      },
      marcarHecho: (clave) =>
        set((s) => {
          const hechos = { ...s.hechos }
          if (hechos[clave]) delete hechos[clave]
          else hechos[clave] = Date.now()
          return { hechos }
        }),
      limpiarHechos: (vigentes) =>
        set((s) => {
          const claves = Object.keys(s.hechos)
          const sobran = claves.filter((c) => !vigentes.has(c))
          if (sobran.length === 0) return s
          const hechos = { ...s.hechos }
          for (const c of sobran) delete hechos[c]
          return { hechos }
        }),
    }),
    { name: 'pos-cocina' },
  ),
)
