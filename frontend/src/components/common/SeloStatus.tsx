import type { SemaforoStatus } from '../../types'
import Icon from './Icone'

interface StatusBadgeProps {
  status: SemaforoStatus
  label: string
  icon?: string
  animated?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/**
 * StatusBadge - Badge de status com semáforo financeiro
 *
 * @example
 * <StatusBadge status="positive" label="Em dia" icon="pi-check" animated />
 */
const StatusBadge = ({
  status,
  label,
  icon,
  animated = false,
  size = 'md',
  className = ''
}: StatusBadgeProps) => {
  const classes = [
    'status-badge',
    `status-badge--${status}`,
    animated && 'status-badge--animated',
    size === 'sm' && 'status-badge--sm',
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {icon && <Icon name={icon} size={12} />}
      <span>{label}</span>

      <style>{`
        .status-badge--sm {
          padding: 2px 6px;
          font-size: 0.65rem;
        }
      `}</style>
    </span>
  )
}

export default StatusBadge

// Helper function to get status from percentage
export const getStatusFromPercentage = (percentage: number, inverted = false): SemaforoStatus => {
  if (inverted) {
    // For things like "budget used" where lower is better
    if (percentage >= 100) return 'danger'
    if (percentage >= 80) return 'warning'
    return 'positive'
  }
  // For things like "goal progress" where higher is better
  if (percentage >= 100) return 'positive'
  if (percentage >= 50) return 'warning'
  return 'danger'
}

// Helper function to get status label
export const getStatusLabel = (status: SemaforoStatus): string => {
  switch (status) {
    case 'positive': return 'Positivo'
    case 'warning': return 'Atenção'
    case 'danger': return 'Crítico'
    default: return ''
  }
}
