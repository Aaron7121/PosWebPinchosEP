import { request } from './client'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth'

export function login(credentials: LoginCredentials) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function register(credentials: RegisterCredentials) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function me() {
  return request<User>('/auth/me')
}
