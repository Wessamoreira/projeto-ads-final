import { Button } from 'primereact/button'
import Icon from './Icone'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

/**
 * EmptyState - Estado vazio com ação
 *
 * @example
 * <EmptyState
 *   icon="pi-inbox"
 *   title="Nenhuma transação"
 *   description="Adicione sua primeira transação"
 *   actionLabel="Nova Transação"
 *   onAction={() => setShowDialog(true)}
 * />
 */
const EmptyState = ({
  icon = 'pi-inbox',
  title,
  description,
  actionLabel,
  actionIcon = 'pi-plus',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state__icon">
        <Icon name={icon} size={32} strokeWidth={1.5} />
      </div>

      <h3 className="empty-state__title">{title}</h3>

      {description && (
        <p className="empty-state__description">{description}</p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="empty-state__actions">
          {actionLabel && onAction && (
            <Button
              label={actionLabel}
              icon={`pi ${actionIcon}`}
              onClick={onAction}
              className="p-button-primary"
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              label={secondaryActionLabel}
              onClick={onSecondaryAction}
              className="p-button-outlined"
            />
          )}
        </div>
      )}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-2xl) var(--spacing-lg);
          text-align: center;
        }

        .empty-state__icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 50%;
          margin-bottom: var(--spacing-lg);
          color: var(--text-muted);
        }

        .empty-state__title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-sm);
        }

        .empty-state__description {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
          margin: 0 0 var(--spacing-lg);
          max-width: 300px;
        }

        .empty-state__actions {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}

export default EmptyState
