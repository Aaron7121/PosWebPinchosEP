import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createProducto,
  deleteProducto,
  getProductos,
  updateProducto,
} from '../../api/catalogo'
import type { Producto, ProductoRequest } from '../../types/catalogo'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Field'

export function ProductosPage() {
  const queryClient = useQueryClient()

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos'],
    queryFn: getProductos,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteProducto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })

  function handleDelete(producto: Producto) {
    if (window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) {
      deleteMutation.mutate(producto.id)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500">
            Ingredientes e insumos que se usan en las recetas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo producto
        </button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : productos && productos.length > 0 ? (
        <div className="flex flex-col gap-3">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{producto.nombre}</p>
                <p className="truncate text-sm text-gray-500">
                  {producto.unidadMedida ?? 'Sin unidad'}
                  {producto.esContable ? ' · Contable' : ''}
                </p>
              </div>
              {producto.stockMinimo != null && (
                <span className="hidden shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 sm:block">
                  Stock mín. {producto.stockMinimo}
                </span>
              )}
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setEditing(producto)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => handleDelete(producto)}
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
          No hay productos registrados.
        </p>
      )}

      {isCreating && (
        <ProductoModal producto={null} onClose={() => setIsCreating(false)} />
      )}
      {editing && (
        <ProductoModal producto={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function ProductoModal({
  producto,
  onClose,
}: {
  producto: Producto | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(producto)

  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [unidadMedida, setUnidadMedida] = useState(producto?.unidadMedida ?? '')
  const [esContable, setEsContable] = useState(producto?.esContable ?? true)
  const [stockMinimo, setStockMinimo] = useState(
    producto?.stockMinimo != null ? String(producto.stockMinimo) : '',
  )

  const mutation = useMutation({
    mutationFn: (payload: ProductoRequest) =>
      isEdit ? updateProducto(producto!.id, payload) : createProducto(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({
      nombre,
      unidadMedida: unidadMedida || undefined,
      esContable,
      stockMinimo: stockMinimo === '' ? undefined : Number(stockMinimo),
    })
  }

  return (
    <Modal
      open
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Unidad de medida"
            value={unidadMedida}
            onChange={(e) => setUnidadMedida(e.target.value)}
            placeholder="kg, L, unid..."
          />
          <Input
            label="Stock mínimo"
            type="number"
            min={0}
            step="0.01"
            value={stockMinimo}
            onChange={(e) => setStockMinimo(e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-4 py-2.5 transition-colors hover:bg-gray-50">
          <input
            type="checkbox"
            checked={esContable}
            onChange={(e) => setEsContable(e.target.checked)}
            className="h-4 w-4 accent-orange-500"
          />
          <span className="text-sm text-gray-700">Producto contable (se descuenta del inventario)</span>
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
