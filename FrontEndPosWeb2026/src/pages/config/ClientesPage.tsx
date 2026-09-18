import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import {
  createCliente,
  deleteCliente,
  getClientes,
  updateCliente,
} from '../../api/clientes'
import type { Cliente, ClienteRequest } from '../../types/pos'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Field'

export function ClientesPage() {
  const queryClient = useQueryClient()

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })

  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })

  function handleDelete(cliente: Cliente) {
    const nombre = cliente.nombre ?? 'Sin nombre'
    if (window.confirm(`¿Eliminar el cliente "${nombre}"?`)) {
      deleteMutation.mutate(cliente.id)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
          <p className="text-sm text-gray-500">
            Registra los datos de tus clientes para el cobro.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : clientes && clientes.length > 0 ? (
        <div className="flex flex-col gap-3">
          {clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">
                  {cliente.nombre ?? 'Sin nombre'}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {cliente.cedula ?? 'Sin cédula'}
                  {cliente.telefono ? ` · ${cliente.telefono}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setEditing(cliente)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => handleDelete(cliente)}
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
          No hay clientes registrados.
        </p>
      )}

      {isCreating && (
        <ClienteModal cliente={null} onClose={() => setIsCreating(false)} />
      )}
      {editing && (
        <ClienteModal cliente={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function ClienteModal({
  cliente,
  onClose,
}: {
  cliente: Cliente | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(cliente)

  const [cedula, setCedula] = useState(cliente?.cedula ?? '')
  const [nombre, setNombre] = useState(cliente?.nombre ?? '')
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '')
  const [correo, setCorreo] = useState(cliente?.correo ?? '')

  const mutation = useMutation({
    mutationFn: (payload: ClienteRequest) =>
      isEdit ? updateCliente(cliente!.id, payload) : createCliente(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({
      cedula,
      nombre,
      telefono,
      correo,
      activo: true,
    })
  }

  return (
    <Modal
      open
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Cédula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          placeholder="1712345678"
        />
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <Input
          label="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="09xxxxxxxx"
        />
        <Input
          label="Correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="cliente@correo.com"
        />

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
