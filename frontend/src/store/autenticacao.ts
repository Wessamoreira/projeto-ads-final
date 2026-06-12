import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Usuario, LoginRequest, LoginResponse } from '../types'
import api from '../services/api'

interface AuthState {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  register: (data: Omit<LoginRequest, 'senha'> & { senha: string; nome: string; rendaMensal?: number }) => Promise<void>
  updateUser: (user: Partial<Usuario>) => void
  clearError: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post<LoginResponse>('/api/v1/auth/login', credentials)
          const { accessToken, usuario } = response.data

          // Set token in api instance
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          set({
            user: usuario,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erro ao fazer login'
          set({ error: message, isLoading: false })
          throw new Error(message)
        }
      },

      logout: () => {
        // Remove token from api instance
        delete api.defaults.headers.common['Authorization']

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/api/v1/auth/registro', data)
          // After registration, login automatically
          await get().login({ email: data.email, senha: data.senha })
        } catch (error: any) {
          const message = error.response?.data?.message || 'Erro ao criar conta'
          set({ error: message, isLoading: false })
          throw new Error(message)
        }
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        // Set token in api instance
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        try {
          const response = await api.get<Usuario>('/api/v1/usuarios/perfil')
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false
          })
        } catch {
          // Token invalid or expired
          get().logout()
        }
      }
    }),
    {
      name: 'glass-finance-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, check if token is still valid
        if (state?.token) {
          state.checkAuth()
        } else {
          state?.logout()
        }
      }
    }
  )
)
