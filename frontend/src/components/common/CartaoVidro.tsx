import type { ReactNode } from 'react'

type CardVariant = 'default' | 'positive' | 'warning' | 'danger'
type CategoryVariant = 'imovel' | 'veiculo' | 'emprestimo' | 'consorcio' | 'investimento' | 'transacao' | 'meta' | 'casal' | 'receita' | 'despesa'

interface GlassCardProps {
  children: ReactNode
  className?: string
  variant?: CardVariant
  category?: CategoryVariant
  bordered?: boolean
  noHover?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

/**
 * GlassCard - Card com efeito glassmorphism
 *
 * @example
 * <GlassCard variant="positive" bordered>
 *   <h3>Saldo Positivo</h3>
 * </GlassCard>
 */
const GlassCard = ({
  children,
  className = '',
  variant,
  category,
  bordered = false,
  noHover = false,
  onClick,
  style
}: GlassCardProps) => {
  const classes = [
    'glass-card',
    bordered && 'glass-card--bordered',
    noHover && 'glass-card--no-hover',
    variant && `glass-card--${variant}`,
    category && `glass-card--${category}`,
    onClick && 'cursor-pointer',
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}

export default GlassCard
