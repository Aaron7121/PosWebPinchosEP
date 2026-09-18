import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { LogIn } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/auth'
import logoNegocio from '../assets/logoNegocio.png'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data)
      navigate('/', { replace: true })
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({ email, password })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-orange-50 px-4 py-6">
      <div className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src={logoNegocio}
            alt="Pinchos"
            className="h-14 w-14 rounded-2xl object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="text-sm text-gray-500">Pinchos · El parqueadero</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Correo o usuario</span>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Contraseña</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl border border-gray-200 px-4 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          {mutation.isError && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {mutation.error instanceof Error
                ? mutation.error.message
                : 'Error al iniciar sesión'}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {mutation.isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
