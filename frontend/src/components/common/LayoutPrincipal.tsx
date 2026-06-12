import { useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu } from 'primereact/menu'
import type { MenuItem } from 'primereact/menuitem'
import { useAuthStore } from '../../store/autenticacao'
import { toast } from './Notificacao'

type NavItem = { path: string; icon: string; label: string }

/**
 * Estrutura visual do app logado: barra lateral, cabecalho e area de conteudo.
 * Versao enxuta com apenas 3 secoes.
 */
const MainLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const userMenuRef = useRef<Menu>(null)

  const menuItems: NavItem[] = [
    { path: '/dashboard', icon: 'pi pi-th-large', label: 'Dashboard' },
    { path: '/transacoes', icon: 'pi pi-wallet', label: 'Transações' },
    { path: '/categorias', icon: 'pi pi-tags', label: 'Categorias' },
  ]

  const firstName = user?.nome?.split(' ')[0] || 'Usuário'
  const userInitial = (user?.nome || user?.email || 'U').trim().charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    toast.info('Até logo!', 'Você saiu da sua conta')
    navigate('/login')
  }

  const userMenuItems: MenuItem[] = [
    { label: 'Meu perfil', icon: 'pi pi-user', command: () => navigate('/perfil') },
    { separator: true },
    { label: 'Sair', icon: 'pi pi-sign-out', command: handleLogout },
  ]

  // Inclui o Perfil na hora de descobrir o titulo do cabecalho
  const todasAsSecoes = [...menuItems, { path: '/perfil', icon: 'pi pi-user', label: 'Meu perfil' }]
  const currentLabel =
    todasAsSecoes.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'

  return (
    <div className="app-layout">
      {/* Barra lateral */}
      <aside className="glass-sidebar">
        <div className="glass-sidebar__logo">
          <NavLink to="/dashboard" className="brand-row" aria-label="Ir para o dashboard">
            <span className="brand-mark">F</span>
            <span className="brand-text sidebar-text">Finanças</span>
          </NavLink>
        </div>

        <nav className="glass-sidebar__nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `glass-sidebar__item ${isActive ? 'glass-sidebar__item--active' : ''}`
              }
            >
              <i className={item.icon} aria-hidden="true" />
              <span className="sidebar-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="glass-sidebar__footer">
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `glass-sidebar__item glass-sidebar__profile ${isActive ? 'glass-sidebar__item--active' : ''}`
            }
          >
            <span className="sidebar-avatar">{userInitial}</span>
            <span className="sidebar-profile-copy sidebar-text">
              <strong>{firstName}</strong>
              <small>Meu perfil</small>
            </span>
          </NavLink>
          <button
            type="button"
            className="glass-sidebar__item glass-sidebar__logout"
            onClick={handleLogout}
          >
            <i className="pi pi-sign-out" aria-hidden="true" />
            <span className="sidebar-text">Sair</span>
          </button>
        </div>
      </aside>

      {/* Cabecalho */}
      <header className="glass-header">
        <div className="glass-header__left">
          <h1 className="header-title">{currentLabel}</h1>
        </div>

        <div className="glass-header__right">
          <Menu model={userMenuItems} popup ref={userMenuRef} className="glass-menu" />
          <button
            className="header-user-btn"
            onClick={e => userMenuRef.current?.toggle(e)}
            aria-label="Menu do usuário"
          >
            <span className="header-user-btn__avatar">{userInitial}</span>
            <span className="header-user-btn__name">{firstName}</span>
            <i className="pi pi-chevron-down" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Conteudo da pagina */}
      <main className="content-area">
        <Outlet />
      </main>

      {/* Navegacao inferior (celular) */}
      <nav className="bottom-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
            }
          >
            <span className="bottom-nav__icon">
              <i className={item.icon} aria-hidden="true" />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        .brand-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          color: inherit;
          text-decoration: none;
        }
        .brand-mark {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.28);
          border-radius: var(--border-radius-md);
          color: #D1FAE5;
          font-size: 0.875rem;
          font-weight: 700;
        }
        .brand-text {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #FFFFFF;
        }
        .header-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .header-user-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 4px 8px 4px 4px;
          background: transparent;
          border: none;
          border-radius: var(--border-radius-md);
          color: var(--text-primary);
          cursor: pointer;
        }
        .header-user-btn:hover { background: var(--bg-hover); }
        .header-user-btn__avatar {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-md);
          color: var(--brand);
          background: var(--brand-soft);
          border: 1px solid rgba(16, 185, 129, 0.20);
          font-size: 0.75rem;
          font-weight: 700;
        }
        .header-user-btn__name { font-weight: 500; font-size: var(--font-size-sm); }
        .header-user-btn .pi-chevron-down { font-size: 0.65rem; color: var(--text-muted); }
        .glass-sidebar__logout {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
          cursor: pointer;
        }
        .glass-sidebar__logout:hover { background: rgba(239, 68, 68, 0.10); color: #FCA5A5; }
        .glass-sidebar__profile { gap: 0.75rem; }
        .sidebar-avatar {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-md);
          background: rgba(16, 185, 129, 0.14);
          border: 1px solid rgba(16, 185, 129, 0.26);
          color: #D1FAE5;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .sidebar-profile-copy { display: flex; flex-direction: column; gap: 1px; }
        .sidebar-profile-copy strong { color: #FFFFFF; font-size: 0.8125rem; font-weight: 600; line-height: 1.2; }
        .sidebar-profile-copy small { color: var(--sidebar-text-muted); font-size: 0.6875rem; line-height: 1.2; }
      `}</style>
    </div>
  )
}

export default MainLayout
