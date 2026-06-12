import type { ReactNode } from 'react'
import Icon from './Icone'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  actions?: ReactNode
  breadcrumb?: { label: string; path?: string }[]
  className?: string
}

/**
 * PageHeader - Cabeçalho de página com título e ações
 *
 * @example
 * <PageHeader
 *   title="Dashboard"
 *   subtitle="Resumo financeiro"
 *   actions={<Button label="Novo" icon="pi pi-plus" />}
 * />
 */
const PageHeader = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumb,
  className = ''
}: PageHeaderProps) => {
  return (
    <div className={`page-header ${className}`}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="page-header__breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={index} className="breadcrumb-item">
              {index > 0 && <Icon name="chevron-right" size={12} className="mx-2" />}
              {item.path ? (
                <a href={item.path} className="breadcrumb-link">{item.label}</a>
              ) : (
                <span className="breadcrumb-current">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="page-header__content">
        <div className="page-header__left">
          {icon && (
            <div className="page-header__icon">
              <Icon name={icon} size={22} />
            </div>
          )}
          <div>
            <h1 className="page-title m-0">{title}</h1>
            {subtitle && <p className="page-subtitle m-0">{subtitle}</p>}
          </div>
        </div>

        {actions && (
          <div className="page-header__actions">
            {actions}
          </div>
        )}
      </div>

      <style>{`
        .page-header {
          margin-bottom: var(--spacing-lg);
        }

        .page-header__breadcrumb {
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-sm);
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
        }

        .breadcrumb-item i {
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        .breadcrumb-link {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .breadcrumb-link:hover {
          color: var(--accent-primary);
        }

        .breadcrumb-current {
          color: var(--text-primary);
        }

        .page-header__content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }

        .page-header__left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .page-header__icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--border-radius-md);
          color: var(--text-primary);
        }

        .page-header__actions {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        @media (max-width: 576px) {
          .page-header__content {
            flex-direction: column;
            align-items: stretch;
          }

          .page-header__actions {
            margin-top: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  )
}

export default PageHeader
