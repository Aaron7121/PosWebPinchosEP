import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil, Plus, UserX, UserRound } from 'lucide-react'
import {
  deleteUsuario,
  getUsuarios,
  updateUsuarioPassword,
} from '../../api/user'
import type { Usuario } from '../../types/user'
import { Modal } from '../../components/ui/Modal'

export function UsuariosPage() {
  const queryClient = useQueryClient()

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  })

  const [resetTarget, setResetTarget] = useState<Usuario | null>(null)

  const desactivarMutation = useMutation({
    mutationFn: (id: number) => deleteUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  function handleDesactivar(usuario: Usuario) {
    if (window.confirm(`¿Deshabilitar al colaborador "${usuario.nombre}"?`)) {
      desactivarMutation.mutate(usuario.id)
    }
  }

  const colaboradores = usuarios?.filter(
    (usuario) => usuario.rol === 'COLABORADOR' && usuario.activo,
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500">
            Administra las cuentas y permisos del sistema.
          </p>
        </div>
        <Link
          to="/configuracion/usuarios/nuevo"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Link>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
      ) : colaboradores && colaboradores.length > 0 ? (
        <div className="flex flex-col gap-3">
          {colaboradores.map((usuario) => (
            <div
              key={usuario.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">
                  {usuario.nombre}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {usuario.correo} · @{usuario.usuario}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 sm:block">
                  Colaborador
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  to={`/configuracion/usuarios/${usuario.id}`}
                  title="Editar"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  title="Restablecer contraseña"
                  onClick={() => setResetTarget(usuario)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Deshabilitar colaborador"
                  onClick={() => handleDesactivar(usuario)}
                  disabled={desactivarMutation.isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <UserX className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-gray-400">
          No hay colaboradores activos.
        </p>
      )}

      {desactivarMutation.isError && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {desactivarMutation.error instanceof Error
            ? desactivarMutation.error.message
            : 'No se pudo deshabilitar el colaborador'}
        </p>
      )}

      <ResetPasswordModal
        usuario={resetTarget}
        onClose={() => setResetTarget(null)}
      />
    </div>
  )
}

function ResetPasswordModal({
  usuario,
  onClose,
}: {
  usuario: Usuario | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      updateUsuarioPassword(id, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setPassword('')
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (usuario) mutation.mutate({ id: usuario.id, password })
  }

  return (
    <Modal
      open={Boolean(usuario)}
      title={`Restablecer contraseña${usuario ? ` · ${usuario.nombre}` : ''}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva contraseña (mín. 6)"
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />

        {mutation.isError && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Error al restablecer'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {mutation.isPending ? 'Guardando...' : 'Restablecer'}
        </button>
      </form>
    </Modal>
  )
}
