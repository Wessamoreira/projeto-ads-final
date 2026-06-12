import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/autenticacao'
import LoadingScreen from './TelaCarregando'

/**
 * PrivateRoute - Protege rotas que requerem autenticação
 *
 * Comportamento:
 * - Se está carregando: mostra LoadingScreen
 * - Se não autenticado: redireciona para /login
 * - Se autenticado: renderiza rotas filhas
 */
const PrivateRoute = () => {
  const { isAuthenticated, isLoading, token } = useAuthStore()
  const location = useLocation()

  // Se tem token mas ainda está verificando, mostra loading
  if (isLoading && token) {
    return <LoadingScreen />
  }

  // Se não autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se autenticado, renderiza as rotas filhas
  return <Outlet />
}

export default PrivateRoute
