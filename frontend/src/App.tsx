import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'

import MainLayout from './components/common/LayoutPrincipal'
import PrivateRoute from './components/common/RotaPrivada'
import LoadingScreen from './components/common/TelaCarregando'
import Toast from './components/common/Notificacao'
import ErrorBoundary from './components/common/LimiteErro'
import { useToast } from './hooks/usarNotificacao'
import { useAuthStore } from './store/autenticacao'

// Carregamento sob demanda das paginas (code splitting)
const Login = lazy(() => import('./pages/Login'))
const Registro = lazy(() => import('./pages/Registro'))
const Dashboard = lazy(() => import('./pages/Painel'))
const Transacoes = lazy(() => import('./pages/Transacoes'))
const Categorias = lazy(() => import('./pages/Categorias'))
const Casal = lazy(() => import('./pages/Casal'))
const Perfil = lazy(() => import('./pages/Perfil'))

function App() {
  const toastRef = useToast()
  const { checkAuth, token } = useAuthStore()

  // Ao abrir o app, se houver token salvo, confirma se ainda e valido
  useEffect(() => {
    if (token) checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ErrorBoundary>
      <Toast ref={toastRef} position="top-right" />

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Rotas publicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rotas protegidas (exigem login) */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transacoes" element={<Transacoes />} />
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/casal" element={<Casal />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
