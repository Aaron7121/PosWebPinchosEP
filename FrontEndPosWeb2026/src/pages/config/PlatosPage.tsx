import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import {
  deletePlato,
  getCategorias,
  getPlatosActivos,
  getPlatosByCategoria,
} from '../../api/catalogo'
import type { CategoriaPlato, Plato } from '../../types/catalogo'

function rutaCategoria(
  categoria: CategoriaPlato | null,
  categorias: CategoriaPlato[],
) {
  if (!categoria) return 'Sin categoría'

  const porId = new Map(categorias.map((item) => [item.id, item]))
  const partes: string[] = []
  const visitados = new Set<number>()
  let actual: CategoriaPlato | null = categoria

  while (actual && !visitados.has(actual.id)) {
    visitados.add(actual.id)
    partes.unshift(actual.nombre)
    actual = actual.categoriaPadre?.id
      ? porId.get(actual.categoriaPadre.id) ?? actual.categoriaPadre
      : null
  }

  return partes.join(' / ')
}

export function PlatosPage() {
  const queryClient = useQueryClient()
  const [categoriaId, setCategoriaId] = useState<number | null>(null)

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
  })

  const { data: platos, isLoading } = useQuery({
    queryKey: ['platos', categoriaId],
    queryFn: () =>
      categoriaId == null
        ? getPlatosActivos()
        : getPlatosByCategoria(categoriaId),
  })

  const deleteMutation = useMutation({
    mutationFn: deletePlato,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platos'] }),
  })

  function handleDelete(plato: Plato) {
    if (window.confirm(`¿Eliminar el plato "${plato.nombre}"?`)) {
      deleteMutation.mutate(plato.id)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Platos</h2>
          <p className="text-sm text-gray-500">
            Administra el menú y las recetas de cada plato.
          </p>
        </div>
        <Link
          to="/configuracion/platos/nuevo"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo plato
        </Link>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoriaId(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            categoriaId == null
              ? 'bg-orange-50 text-orange-500'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {categorias?.map((categoria) => (
          <button
            key={categoria.id}
            type="button"
            onClick={() => setCategoriaId(categoria.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              categoriaId === categoria.id
                ? 'bg-orange-50 text-orange-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {categoria.nombre}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : platos && platos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {platos.map((plato) => (
            <div
              key={plato.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
            >
              {plato.img ? (
                <img
                  src={plato.img}
                  alt={plato.nombre}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center bg-orange-100 text-3xl font-bold text-orange-300">
                  {plato.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-gray-900">{plato.nombre}</h3>
                <p className="text-xs text-gray-400">
                  {rutaCategoria(plato.idCategoria, categorias ?? [])}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {plato.precio != null ? `$${plato.precio.toFixed(2)}` : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/configuracion/platos/${plato.id}`}
                      title="Editar"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      title="Eliminar"
                      onClick={() => handleDelete(plato)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <UtensilsCrossed className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No hay platos registrados.</p>
        </div>
      )}
    </div>
  )
}
