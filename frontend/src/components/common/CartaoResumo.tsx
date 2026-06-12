import type { SemaforoStatus } from '../../types'
import MoneyValue from './ValorMonetario'
import Icon from './Icone'

interface SummaryCardProps {
  title: string
  value: number
  icon: string
  status?: SemaforoStatus
  variation?: number // Percentage variation
  variationLabel?: string
  isMoney?: boolean
  suffix?: string
  onClick?: () => void
  className?: string
}

/**
 * SummaryCard - Card de resumo para dashboard
 *
 * @example
 * <SummaryCard
 *   title="Saldo Atual"
 *   value={15000}
 *   icon="pi-wallet"
 *   status="positive"
 *   variation={5.2}
 *   variationLabel="vs mês anterior"
 *   isMoney
 * />
 */
const SummaryCard = ({
  title,
  value,
  icon,
  status,
  variation,
  variationLabel,
  isMoney = true,
  suffix,
  onClick,
  className = ''
}: SummaryCardProps) => {
  const getVariationIcon = () => {
    if (!variation || variation === 0) return 'minus'
    return variation > 0 ? 'arrow-up' : 'arrow-down'
  }

  const getVariationClass = () => {
    if (!variation || variation === 0) return 'text-muted'
    return variation > 0 ? 'text-positive' : 'text-danger'
  }

  return (
    <div
      className={`glass-card glass-card--bordered ${status ? `glass-card--${status}` : ''} ${onClick ? 'cursor-pointer hover-lift' : 'glass-card--no-hover'} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex align-items-start justify-content-between mb-3">
        <div
          className="summary-card__icon"
          style={{
            background: status ? `var(--color-${status}-bg)` : 'var(--glass-bg)',
            color: status ? `var(--color-${status})` : 'var(--accent-primary)'
          }}
        >
          <Icon name={icon} size={20} />
        </div>

        {variation !== undefined && (
          <div className={`summary-card__variation ${getVariationClass()}`}>
            <Icon name={getVariationIcon()} size={12} />
            <span>{Math.abs(variation).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <p className="text-secondary text-sm m-0 mb-1">{title}</p>

      <div className="flex align-items-baseline gap-1">
        {isMoney ? (
          <MoneyValue
            value={value}
            size="xl"
            variant={status === 'danger' ? 'negative' : status === 'positive' ? 'positive' : 'default'}
          />
        ) : (
          <span className="text-2xl font-bold">
            {value.toLocaleString('pt-BR')}
            {suffix && <span className="text-secondary text-lg ml-1">{suffix}</span>}
          </span>
        )}
      </div>

      {variationLabel && (
        <p className="text-muted text-xs m-0 mt-1">{variationLabel}</p>
      )}

      <style>{`
        .summary-card__icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--border-radius-md);
        }

        .summary-card__icon i {
          font-size: 1.25rem;
        }

        .summary-card__variation {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--font-size-sm);
          font-weight: 600;
        }

        .summary-card__variation i {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  )
}

export default SummaryCard
