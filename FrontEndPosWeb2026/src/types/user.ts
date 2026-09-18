export interface Direccion {
  id: number
  callePrincipal: string | null
  calleSecundaria: string | null
  ciudad: string | null
  sector: string | null
}

export interface DireccionRequest {
  callePrincipal?: string | null
  calleSecundaria?: string | null
  ciudad?: string | null
  sector?: string | null
}

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
  direccion: Direccion | null
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
  direccion?: DireccionRequest | null
}

export interface PasswordRequest {
  password: string
}

export const ROLES = ['ADMIN', 'COLABORADOR'] as const
