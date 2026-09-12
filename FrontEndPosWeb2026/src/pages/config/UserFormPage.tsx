import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { createUsuario, getUsuario, updateUsuario } from '../../api/user'
import { ROLES } from '../../types/user'
import type { Usuario, UsuarioRequest } from '../../types/user'
import { Input } from '../../components/ui/Field'

export function UserFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const { data, isLoading } = useQuery({
    queryKey: ['usuario', id],
    queryFn: () => getUsuario(Number(id)),
    enabled: isEdit,
  })

  if (isEdit && (isLoading || !data)) {
    return <p className="py-8 text-center text-sm text-gray-400">Cargando...</p>
  }

  return <UserForm key={data?.id ?? 'new'} initial={data} isEdit={isEdit} />
}

interface UserFormProps {
  initial?: Usuario
  isEdit: boolean
}

function UserForm({ initial, isEdit }: UserFormProps) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [cedula, setCedula] = useState(initial?.cedula ?? '')
  const [telefono, setTelefono] = useState(initial?.telefono ?? '')
  const [correo, setCorreo] = useState(initial?.correo ?? '')
  const [cargo, setCargo] = useState(initial?.cargo ?? '')
  const [usuario, setUsuario] = useState(initial?.usuario ?? '')
  const [rol, setRol] = useState(initial?.rol ?? ROLES[0])
  const [password, setPassword] = useState('')
  const [activo, setActivo] = useState(initial?.activo ?? true)

  const mutation = useMutation({
    mutationFn: (payload: UsuarioRequest) =>
      isEdit ? updateUsuario(Number(id), payload) : createUsuario(payload),
    onSuccess: () => navigate('/configuracion/usuarios'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({
      nombre,
      cedula: cedula || undefined,
      telefono: telefono || undefined,
      correo,
      cargo: cargo || undefined,
      usuario,
      rol,
      password: password || undefined,
      activo,
    })
  }

  return (
    <div className="mx-auto max-w-md">
      <button
        type="button"
        onClick={() => navigate('/configuracion/usuarios')}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a usuarios
      </button>

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Completa los datos de la cuenta.
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
          <Input
            label="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
          <Input
            label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            minLength={6}
            placeholder={isEdit ? 'Deja vacío para no cambiarla' : 'Mínimo 6 caracteres'}
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

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Rol</span>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-4 py-2.5 transition-colors hover:bg-gray-50">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            <span className="text-sm text-gray-700">Usuario activo</span>
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
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}
