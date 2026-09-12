import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { getUsuario, updateUsuario, updateUsuarioPassword } from '../../api/user'
import type { Usuario } from '../../types/user'
import { useAuthStore } from '../../store/auth'
import { Input } from '../../components/ui/Field'

export function AdminProfilePage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['usuario', user?.id],
    queryFn: () => getUsuario(user!.id),
    enabled: Boolean(user),
  })

  if (!user || isLoading || !data) {
    return <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
  }

  return <AdminProfileForm key={data.id} initial={data} />
}

function AdminProfileForm({ initial }: { initial: Usuario }) {
  const userId = useAuthStore((s) => s.user?.id)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [nombre, setNombre] = useState(initial.nombre ?? '')
  const [cedula, setCedula] = useState(initial.cedula ?? '')
  const [telefono, setTelefono] = useState(initial.telefono ?? '')
  const [correo, setCorreo] = useState(initial.correo ?? '')
  const [cargo, setCargo] = useState(initial.cargo ?? '')
  const [usuario, setUsuario] = useState(initial.usuario ?? '')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) return
      await updateUsuario(userId, {
        nombre,
        cedula,
        telefono,
        correo,
        cargo,
        usuario,
      })
      if (password) {
        await updateUsuarioPassword(userId, { password })
      }
    },
    onSuccess: () => {
      setPassword('')
      updateUser({ name: nombre, email: correo })
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Mi perfil</h2>
        <p className="mt-1 text-sm text-gray-500">
          Actualiza los datos de tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <Input
            label="Correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
            <Input
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <Input
            label="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />
          <Input
            label="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Deja vacío para no cambiarla"
          />

          {mutation.isSuccess && (
            <p className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-600">
              Perfil actualizado correctamente.
            </p>
          )}
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
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
