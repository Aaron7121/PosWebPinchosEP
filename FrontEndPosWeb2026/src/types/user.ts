export interface Usuario {
  id: number
  nombre: string
  cedula: string
  telefono: string
  correo: string
  cargo: string
  usuario: string
  rol: string
  activo: boolean
  idDireccion: number | null
}

export interface UsuarioRequest {
  nombre?: string
  cedula?: string
  telefono?: string
  correo?: string
  cargo?: string
  usuario?: string
  password?: string
  rol?: string
  activo?: boolean
  idDireccion?: number | null
}

export interface EstadoRequest {
  activo: boolean
}

export interface PasswordRequest {
  password: string
}

export const ROLES = ['ADMIN', 'COLABORADOR'] as const
