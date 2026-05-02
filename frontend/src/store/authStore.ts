import { create } from 'zustand'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  restoring: boolean
  setAuth: (user: User) => void
  logout: () => void
  setRestoring: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  restoring: true,
  setAuth: (user) => set({ user, isAuthenticated: true, restoring: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setRestoring: (v) => set({ restoring: v }),
}))
