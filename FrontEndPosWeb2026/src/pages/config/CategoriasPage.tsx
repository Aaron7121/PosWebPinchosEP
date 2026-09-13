import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
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
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Tags className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{categoria.nombre}</p>
                <p className="truncate text-sm text-gray-500">
                  {categoria.activo ? 'Activa' : 'Inactiva'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setEditing(categoria)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => handleDelete(categoria)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          No hay categorías registradas.
        </p>
      )}

      {isCreating && (
        <CategoriaModal categoria={null} onClose={() => setIsCreating(false)} />
      )}
      {editing && (
        <CategoriaModal categoria={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function CategoriaModal({
  categoria,
  onClose,
}: {
  categoria: CategoriaPlato | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(categoria)

  const [nombre, setNombre] = useState(categoria?.nombre ?? '')
  const [img, setImg] = useState(categoria?.img ?? '')
  const [activo, setActivo] = useState(categoria?.activo ?? true)

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
    mutation.mutate({ nombre, img: img || undefined, activo })
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
