import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (persisted by authStore)
    const authData = localStorage.getItem('glass-finance-auth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        const token = parsed?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (e) {
        console.error('Error parsing auth data:', e)
      }
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Clear auth and redirect to login
      localStorage.removeItem('glass-finance-auth')
      window.location.href = '/login'
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api

// ============================================================================
// API Helper Functions
// ============================================================================

/**
 * Format API error for display
 */
export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data?.message) return data.message
    if (data?.errors?.length) {
      return data.errors.map((e: { message: string }) => e.message).join(', ')
    }
    if (error.code === 'ECONNABORTED') {
      return 'O servidor demorou para responder. Se estiver hospedado no Render gratuito, ele pode estar iniciando. Tente novamente em alguns instantes.'
    }
    if (!error.response) {
      return 'Nao foi possivel conectar ao servidor. Ele pode estar iniciando ou indisponivel no momento.'
    }
    if (error.message) return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocorreu um erro inesperado'
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

/**
 * Check if error is 401 Unauthorized
 */
export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}
