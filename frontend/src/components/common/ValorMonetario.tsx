import { useMemo } from 'react'
import CountUp from 'react-countup'

type MoneySize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'
type MoneyVariant = 'default' | 'positive' | 'negative' | 'warning'

interface MoneyValueProps {
  value: number
  size?: MoneySize
  variant?: MoneyVariant
  autoColor?: boolean // Auto color based on value (positive/negative)
  showSign?: boolean // Show + or - prefix
  animated?: boolean // Animate value changes
  currency?: string
  className?: string
}

/**
 * MoneyValue - Exibição de valores monetários formatados
 *
 * @example
 * <MoneyValue value={1500.50} size="lg" autoColor />
 */
const MoneyValue = ({
  value,
  size = 'base',
  variant = 'default',
  autoColor = false,
  showSign = false,
  animated = false,
  currency = 'BRL',
  className = ''
}: MoneyValueProps) => {
  // Determine variant based on value if autoColor is enabled
  const effectiveVariant = useMemo(() => {
    if (autoColor) {
      if (value > 0) return 'positive'
      if (value < 0) return 'negative'
    }
    return variant
  }, [value, autoColor, variant])

  // Format options
  const formatOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }

  // Format value
  const formattedValue = useMemo(() => {
    const absValue = Math.abs(value)
    const formatted = new Intl.NumberFormat('pt-BR', formatOptions).format(absValue)

    if (showSign && value !== 0) {
      return value > 0 ? `+${formatted}` : `-${formatted}`
    }

    return value < 0 ? `-${formatted.replace('-', '')}` : formatted
  }, [value, showSign, currency])

  // Build classes
  const classes = [
    'money-value',
    `money-value--${size}`,
    effectiveVariant !== 'default' && `money-value--${effectiveVariant}`,
    className
  ].filter(Boolean).join(' ')

  if (animated) {
    return (
      <span className={classes}>
        {showSign && value > 0 && '+'}
        {value < 0 && '-'}
        <CountUp
          end={Math.abs(value)}
          decimals={2}
          decimal=","
          separator="."
          prefix="R$ "
          duration={1}
          preserveValue
        />
      </span>
    )
  }

  return <span className={classes}>{formattedValue}</span>
}

export default MoneyValue
