import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import GlassCard from './CartaoVidro'

interface ChartContainerProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  height?: number | string
  loading?: boolean
  className?: string
}

/**
 * ChartContainer - Container para gráficos com estilo glass
 *
 * @example
 * <ChartContainer title="Fluxo de Caixa" height={300}>
 *   <Chart type="bar" data={data} />
 * </ChartContainer>
 */
const ChartContainer = ({
  title,
  subtitle,
  children,
  actions,
  height = 300,
  loading = false,
  className = ''
}: ChartContainerProps) => {
  return (
    <GlassCard noHover className={`chart-container ${className}`}>
      <div className="chart-container__header">
        <div>
          <h3 className="chart-container__title">{title}</h3>
          {subtitle && <p className="chart-container__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="chart-container__actions">{actions}</div>}
      </div>

      <div
        className="chart-container__body"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {loading ? (
          <div className="chart-container__loading">
            <Loader2 size={24} className="chart-spinner" />
            <span>Carregando...</span>
          </div>
        ) : (
          children
        )}
      </div>

      <style>{`
        .chart-container__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--spacing-md);
        }

        .chart-container__title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .chart-container__subtitle {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin: var(--spacing-xs) 0 0;
        }

        .chart-container__actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .chart-container__body {
          position: relative;
        }

        .chart-container__loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: var(--text-muted);
        }

        .chart-spinner {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </GlassCard>
  )
}

export default ChartContainer
