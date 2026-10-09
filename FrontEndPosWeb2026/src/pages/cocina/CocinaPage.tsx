import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { getCategoriasActivas } from '../../api/catalogo'
import { PERFIL_VACIO, useCocinaPerfiles } from '../../store/cocinaPerfiles'
import type { PerfilBorrador, TamanoCocina } from '../../store/cocinaPerfiles'
import type { CategoriaPlato } from '../../types/catalogo'
import { unlockAudio } from '../../utils/sound'

const TAMANOS: { id: TamanoCocina; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'grande', label: 'Grande' },
  { id: 'enorme', label: 'Enorme' },
]

export function CocinaPage() {
  const perfiles = useCocinaPerfiles((s) => s.perfiles)
  const eliminar = useCocinaPerfiles((s) => s.eliminar)
  const duplicar = useCocinaPerfiles((s) => s.duplicar)
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'activas'],
    queryFn: getCategoriasActivas,
  })
  const [editando, setEditando] = useState<{ id?: string; datos: PerfilBorrador } | null>(null)

  const nombreCategoria = (id: number) =>
    categorias.find((c) => c.id === id)?.nombre ?? `#${id}`

  if (editando) {
    return (
      <PerfilEditor
        categorias={categorias}
        inicial={editando.datos}
        id={editando.id}
        onClose={() => setEditando(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" onPointerDown={unlockAudio}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-lg p-2 text-gray-500 hover:bg-gray-200">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Pantallas de cocina</h1>
          </div>
          <button
            type="button"
            onClick={() => setEditando({ datos: PERFIL_VACIO })}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={18} /> Nuevo perfil
          </button>
        </div>

        {perfiles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Aún no hay perfiles. Crea uno y elige qué categorías mostrar.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {perfiles.map((p) => {
              const { id, ...datos } = p
              return (
                <div key={id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <Link to={`/cocina/${id}`} className="block">
                    <h2 className="text-xl font-bold text-gray-900">{p.nombre}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {p.categoriaIds.length > 0
                        ? p.categoriaIds.map(nombreCategoria).join(', ')
                        : 'Sin categorías'}
                    </p>
                    <span className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                      Abrir pantalla
                    </span>
                  </Link>
                  <div className="mt-3 flex gap-1 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditando({ id, datos })}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicar(id)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Duplicar"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el perfil "${p.nombre}"?`)) eliminar(id)
                      }}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PerfilEditor({
  categorias,
  inicial,
  id,
  onClose,
}: {
  categorias: CategoriaPlato[]
  inicial: PerfilBorrador
  id?: string
  onClose: () => void
}) {
  const guardar = useCocinaPerfiles((s) => s.guardar)
  const [datos, setDatos] = useState<PerfilBorrador>(inicial)

  const set = <K extends keyof PerfilBorrador>(k: K, v: PerfilBorrador[K]) =>
    setDatos((d) => ({ ...d, [k]: v }))

  const toggleCategoria = (cid: number) =>
    set(
      'categoriaIds',
      datos.categoriaIds.includes(cid)
        ? datos.categoriaIds.filter((x) => x !== cid)
        : [...datos.categoriaIds, cid],
    )

  const valido = datos.nombre.trim() !== '' && datos.categoriaIds.length > 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Editar perfil' : 'Nuevo perfil'}
          </h1>
        </div>

        <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-gray-700">Nombre de la pantalla</label>
          <input
            value={datos.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej: Parrilla"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-lg"
          />
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Categorías a mostrar</h2>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                className="text-emerald-600 hover:underline"
                onClick={() => set('categoriaIds', categorias.map((c) => c.id))}
              >
                Todas
              </button>
              <button
                type="button"
                className="text-gray-500 hover:underline"
                onClick={() => set('categoriaIds', [])}
              >
                Ninguna
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => {
              const activa = datos.categoriaIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategoria(c.id)}
                  className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 font-semibold transition-colors ${
                    activa
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {activa && <Check size={16} />}
                  {c.categoriaPadre ? `${c.categoriaPadre.nombre} › ` : ''}
                  {c.nombre}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400">
            Al elegir una categoría principal también se incluyen sus subcategorías.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700">Qué se muestra</h2>
          {(
            [
              ['mostrarMesa', 'Mesa y tipo de servicio'],
              ['mostrarComentario', 'Comentario del pedido'],
              ['mostrarHora', 'Hora y tiempo de espera'],
              ['sonido', 'Sonido al llegar un pedido nuevo'],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-3 text-gray-800">
              <input
                type="checkbox"
                checked={datos[k]}
                onChange={(e) => set(k, e.target.checked)}
                className="h-5 w-5"
              />
              {label}
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            {TAMANOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set('tamano', t.id)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${
                  datos.tamano === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Letra {t.label.toLowerCase()}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-black p-4 text-white">
          <p className="mb-2 text-xs uppercase text-gray-500">Vista previa</p>
          <div className="w-64 rounded-2xl border-2 border-emerald-500 bg-gray-900 p-3">
            <div className="mb-2 border-b border-white/10 pb-1 text-xl font-extrabold">
              #123
              {datos.mostrarMesa && <span className="ml-2 text-amber-300">Mesa 4</span>}
            </div>
            <p
              className={`font-bold ${
                datos.tamano === 'normal' ? 'text-xl' : datos.tamano === 'grande' ? 'text-3xl' : 'text-5xl'
              }`}
            >
              <span className="text-amber-300">2×</span> Pincho mixto
            </p>
            {datos.mostrarComentario && (
              <p className="mt-2 rounded bg-yellow-400/15 px-2 py-1 text-yellow-200">Sin ají</p>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-2 font-semibold text-gray-600 hover:bg-gray-200">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valido}
            onClick={() => {
              guardar({ ...datos, nombre: datos.nombre.trim() }, id)
              onClose()
            }}
            className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-40"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
