import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import {
  createCategoria,
  deleteCategoria,
  getCategorias,
  updateCategoria,
} from '../../api/catalogo'
import type { CategoriaPlato, CategoriaRequest } from '../../types/catalogo'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Field'
import { ImageUpload } from '../../components/ui/ImageUpload'

export function CategoriasPage() {
  const queryClient = useQueryClient()

  const { data: categorias, isLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<CategoriaPlato | null>(null)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const deleteMutation = useMutation({
    mutationFn: deleteCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })

  function handleDelete(categoria: CategoriaPlato) {
    if (window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      deleteMutation.mutate(categoria.id)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Categorías</h2>
          <p className="text-sm text-gray-500">
            Agrupa los platos en el menú.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : categorias && categorias.length > 0 ? (
        <div className="flex flex-col gap-3">
          {categorias
            .filter((categoria) => categoria.categoriaPadre == null)
            .map((categoria) => (
              <CategoriaTree
                key={categoria.id}
                categoria={categoria}
                categorias={categorias}
                collapsed={collapsed}
                onToggle={(id) =>
                  setCollapsed((prev) => {
                    const next = new Set(prev)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return next
                  })
                }
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          No hay categorías registradas.
        </p>
      )}

      {isCreating && (
        <CategoriaModal
          categoria={null}
          categorias={categorias ?? []}
          onClose={() => setIsCreating(false)}
        />
      )}
      {editing && (
        <CategoriaModal
          categoria={editing}
          categorias={categorias ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function CategoriaTree({
  categoria,
  categorias,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
}: {
  categoria: CategoriaPlato
  categorias: CategoriaPlato[]
  collapsed: Set<number>
  onToggle: (id: number) => void
  onEdit: (categoria: CategoriaPlato) => void
  onDelete: (categoria: CategoriaPlato) => void
}) {
  const hijas = categorias.filter(
    (item) => item.categoriaPadre?.id === categoria.id,
  )
  const isCollapsed = collapsed.has(categoria.id)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <button
          type="button"
          title={isCollapsed ? 'Expandir' : 'Contraer'}
          onClick={() => onToggle(categoria.id)}
          disabled={hijas.length === 0}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-30"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <Tags className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">{categoria.nombre}</p>
          <p className="truncate text-sm text-gray-500">
            {hijas.length > 0
              ? `${hijas.length} subcategoría${hijas.length === 1 ? '' : 's'}`
              : 'Sin subcategorías'}{' '}
            · {categoria.activo ? 'Activa' : 'Inactiva'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            title="Editar"
            onClick={() => onEdit(categoria)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Eliminar"
            onClick={() => onDelete(categoria)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {!isCollapsed && hijas.length > 0 && (
        <div className="ml-7 flex flex-col gap-2 border-l-2 border-orange-100 pl-3">
          {hijas.map((hija) => (
            <CategoriaTree
              key={hija.id}
              categoria={hija}
              categorias={categorias}
              collapsed={collapsed}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoriaModal({
  categoria,
  categorias,
  onClose,
}: {
  categoria: CategoriaPlato | null
  categorias: CategoriaPlato[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(categoria)

  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [img, setImg] = useState(categoria?.img ?? '')
  const [activo, setActivo] = useState(categoria?.activo ?? true)
  const [idCategoriaPadre, setIdCategoriaPadre] = useState<number | ''>(
    categoria?.categoriaPadre?.id ?? '',
  )

  const idsDescendientes = new Set<number>()
  function agregarDescendientes(id: number) {
    for (const item of categorias) {
      if (item.categoriaPadre?.id === id && !idsDescendientes.has(item.id)) {
        idsDescendientes.add(item.id)
        agregarDescendientes(item.id)
      }
    }
  }
  if (categoria) agregarDescendientes(categoria.id)

  const mutation = useMutation({
    mutationFn: (payload: CategoriaRequest) =>
      isEdit ? updateCategoria(categoria!.id, payload) : createCategoria(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({
      nombre,
      img: img || undefined,
      activo,
      categoriaPadre:
        idCategoriaPadre === '' ? null : { id: Number(idCategoriaPadre) },
    })
  }

  return (
    <Modal
      open
      title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Categoría padre
          <select
            value={idCategoriaPadre}
            onChange={(e) =>
              setIdCategoriaPadre(
                e.target.value === '' ? '' : Number(e.target.value),
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Sin categoría padre (raíz)</option>
            {categorias
              .filter(
                (item) =>
                  item.id !== categoria?.id && !idsDescendientes.has(item.id),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
          </select>
        </label>
        <ImageUpload tipo="categorias" value={img} onChange={setImg} />

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-4 py-2.5 transition-colors hover:bg-gray-50">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="h-4 w-4 accent-orange-500"
          />
          <span className="text-sm text-gray-700">Categoría activa</span>
        </label>

        {mutation.isError && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Error al guardar'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Modal>
  )
}
