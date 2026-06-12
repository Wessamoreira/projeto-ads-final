import { Component, type ReactNode } from 'react'
import { Button } from 'primereact/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary - Captura erros em componentes filhos
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <i className="pi pi-exclamation-triangle"></i>
            </div>

            <h1 className="error-boundary__title">Ops! Algo deu errado</h1>

            <p className="error-boundary__description">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>

            {this.state.error && (
              <details className="error-boundary__details">
                <summary>Detalhes técnicos</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}

            <div className="error-boundary__actions">
              <Button
                label="Recarregar Página"
                icon="pi pi-refresh"
                onClick={this.handleReload}
              />
              <Button
                label="Ir para Início"
                icon="pi pi-home"
                className="p-button-outlined"
                onClick={this.handleGoHome}
              />
            </div>
          </div>

          <style>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: var(--spacing-xl);
              background: var(--bg-primary);
            }

            .error-boundary__content {
              text-align: center;
              max-width: 500px;
            }

            .error-boundary__icon {
              width: 100px;
              height: 100px;
              margin: 0 auto var(--spacing-xl);
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--color-danger-bg);
              border-radius: 50%;
            }

            .error-boundary__icon i {
              font-size: 3rem;
              color: var(--color-danger);
            }

            .error-boundary__title {
              font-size: var(--font-size-2xl);
              color: var(--text-primary);
              margin: 0 0 var(--spacing-md);
            }

            .error-boundary__description {
              color: var(--text-secondary);
              margin: 0 0 var(--spacing-xl);
            }

            .error-boundary__details {
              text-align: left;
              margin-bottom: var(--spacing-xl);
              padding: var(--spacing-md);
              background: var(--glass-bg);
              border-radius: var(--border-radius-md);
              border: 1px solid var(--glass-border);
            }

            .error-boundary__details summary {
              cursor: pointer;
              color: var(--text-secondary);
              font-size: var(--font-size-sm);
            }

            .error-boundary__details pre {
              margin: var(--spacing-md) 0 0;
              font-size: var(--font-size-xs);
              color: var(--color-danger);
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-boundary__actions {
              display: flex;
              gap: var(--spacing-md);
              justify-content: center;
              flex-wrap: wrap;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
