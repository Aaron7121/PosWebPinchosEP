export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  nombre: string
  correo: string
  usuario: string
  password: string
  rol: string
}
