import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import {
  createPlato,
  createReceta,
  deleteReceta,
  getCategorias,
  getPlato,
  getProductos,
  getRecetasByPlato,
  updatePlato,
  updateReceta,
} from '../../api/catalogo'
import type {
  CategoriaPlato,
  Plato,
  PlatoRequest,
  Producto,
  RecetaPlatoProducto,
  RecetaRequest,
} from '../../types/catalogo'
import { Input, Textarea } from '../../components/ui/Field'
import { ImageUpload } from '../../components/ui/ImageUpload'

interface RecetaRow {
  key: string
  id?: number
  idProducto: number | ''
  cantidad: string
}

export function PlatoFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const { data: plato, isLoading: platoLoading } = useQuery({
    queryKey: ['plato', id],
    queryFn: () => getPlato(Number(id)),
    enabled: isEdit,
  })
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: getCategorias,
  })
  const { data: productos } = useQuery({
    queryKey: ['productos'],
    queryFn: getProductos,
  })
  const { data: recetas, isLoading: recetasLoading } = useQuery({
    queryKey: ['recetas', id],
    queryFn: () => getRecetasByPlato(Number(id)),
    enabled: isEdit,
  })

  if (isEdit && (platoLoading || recetasLoading || !plato)) {
    return <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
  }
  if (!categorias || !productos) {
    return <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
  }

  return (
    <PlatoForm
      key={plato?.id ?? 'new'}
      initial={plato}
      recetasIniciales={recetas ?? []}
      categorias={categorias}
      productos={productos}
      isEdit={isEdit}
    />
  )
}

interface PlatoFormProps {
  initial?: Plato
  recetasIniciales: RecetaPlatoProducto[]
  categorias: CategoriaPlato[]
  productos: Producto[]
  isEdit: boolean
}

function PlatoForm({
  initial,
  recetasIniciales,
  categorias,
  productos,
  isEdit,
}: PlatoFormProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const keyRef = useRef(0)

  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [precio, setPrecio] = useState(
    initial?.precio != null ? String(initial.precio) : '',
  )
  const [img, setImg] = useState(initial?.img ?? '')
  const [idCategoria, setIdCategoria] = useState<number | ''>(
    initial?.idCategoria?.id ?? '',
  )
  const [recetas, setRecetas] = useState<RecetaRow[]>(() =>
    recetasIniciales.map((r) => ({
      key: String(r.id),
      id: r.id,
      idProducto: r.idProducto?.id ?? '',
      cantidad: r.cantidad != null ? String(r.cantidad) : '',
    })),
  )

  function addReceta() {
    setRecetas((prev) => [
      ...prev,
      { key: `n-${keyRef.current++}`, idProducto: '', cantidad: '' },
    ])
  }

  function patchReceta(key: string, patch: Partial<RecetaRow>) {
    setRecetas((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    )
  }

  function removeReceta(key: string) {
    setRecetas((prev) => prev.filter((r) => r.key !== key))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const platoPayload: PlatoRequest = {
        nombre,
        descripcion: descripcion || undefined,
        precio: precio === '' ? undefined : Number(precio),
        img: img || undefined,
        idCategoria: idCategoria === '' ? null : { id: Number(idCategoria) },
      }

      let platoId: number
      if (isEdit) {
        platoId = Number(id)
        await updatePlato(platoId, platoPayload)
      } else {
        const creado = await createPlato(platoPayload)
        platoId = creado.id
      }

      if (isEdit) {
        const originalIds = new Set(recetasIniciales.map((r) => r.id))
        const currentIds = new Set(
          recetas.filter((r) => r.id != null).map((r) => r.id),
        )
        const deleted = [...originalIds].filter((rid) => !currentIds.has(rid))
        await Promise.all(deleted.map((rid) => deleteReceta(rid)))
      }

      await Promise.all(
        recetas
          .filter((r) => r.idProducto !== '' && r.cantidad !== '')
          .map((r) => {
            const payload: RecetaRequest = {
              idPlato: { id: platoId },
              idProducto: { id: Number(r.idProducto) },
              cantidad: Number(r.cantidad),
            }
            return r.id != null ? updateReceta(r.id, payload) : createReceta(payload)
          }),
      )
    },
    onSuccess: () => navigate('/configuracion/platos'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => navigate('/configuracion/platos')}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a platos
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar plato' : 'Nuevo plato'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Completa la información del plato.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <Input
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
            <Textarea
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Precio"
                type="number"
                min={0}
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Categoría
                </span>
                <select
                  value={idCategoria}
                  onChange={(e) =>
                    setIdCategoria(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ImageUpload tipo="platos" value={img} onChange={setImg} />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Receta (ingredientes)
              </h3>
              <p className="text-sm text-gray-500">
                Indica cuánto de cada producto lleva este plato.
              </p>
            </div>
            <button
              type="button"
              onClick={addReceta}
              className="flex items-center gap-1 rounded-xl border border-orange-200 px-3 py-2 text-sm font-medium text-orange-500 transition-colors hover:bg-orange-50"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {productos.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                Primero registra productos en la pestaña "Productos".
              </p>
            ) : recetas.length === 0 ? (
              <p className="text-sm text-gray-400">
                Sin ingredientes. Agrega productos a la receta.
              </p>
            ) : (
              recetas.map((receta) => (
                <div key={receta.key} className="flex items-center gap-3">
                  <select
                    value={receta.idProducto}
                    onChange={(e) =>
                      patchReceta(receta.key, {
                        idProducto:
                          e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="h-11 flex-1 rounded-xl border border-gray-200 px-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="" disabled>
                      Selecciona un producto
                    </option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                        {producto.unidadMedida
                          ? ` (${producto.unidadMedida})`
                          : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={receta.cantidad}
                    onChange={(e) =>
                      patchReceta(receta.key, { cantidad: e.target.value })
                    }
                    placeholder="Cantidad"
                    className="h-11 w-28 rounded-xl border border-gray-200 px-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    title="Quitar"
                    onClick={() => removeReceta(receta.key)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

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
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {mutation.isPending ? 'Guardando...' : 'Guardar plato'}
        </button>
      </form>
    </div>
  )
}
