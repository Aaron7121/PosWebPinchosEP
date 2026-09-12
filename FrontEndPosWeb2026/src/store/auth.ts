import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, User } from '../types/auth'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (auth: AuthResponse) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: ({ token, user }) => set({ token, user, isAuthenticated: true }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'pos-auth' },
  ),
)
