import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import Icon from './Icone'

interface ConfirmDialogProps {
  visible: boolean
  onHide: () => void
  onConfirm: () => void
  title?: string
  message: string
  icon?: string
  iconColor?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmClass?: string
  loading?: boolean
}

/**
 * ConfirmDialog - Diálogo de confirmação com estilo glass
 *
 * @example
 * <ConfirmDialog
 *   visible={showConfirm}
 *   onHide={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir transação"
 *   message="Tem certeza que deseja excluir esta transação?"
 *   icon="pi-trash"
 *   iconColor="var(--color-danger)"
 *   confirmLabel="Excluir"
 *   confirmClass="p-button-danger"
 * />
 */
const ConfirmDialog = ({
  visible,
  onHide,
  onConfirm,
  title = 'Confirmar',
  message,
  icon = 'pi-exclamation-triangle',
  iconColor = 'var(--color-warning)',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmClass = 'p-button-primary',
  loading = false
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onHide()
    }
  }

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label={cancelLabel}
        className="p-button-text"
        onClick={onHide}
        disabled={loading}
      />
      <Button
        label={confirmLabel}
        className={confirmClass}
        onClick={handleConfirm}
        loading={loading}
        autoFocus
      />
    </div>
  )

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={title}
      footer={footer}
      modal
      closable={!loading}
      draggable={false}
      resizable={false}
      style={{ width: '90vw', maxWidth: '400px' }}
      className="confirm-dialog"
    >
      <div className="confirm-dialog__content">
        <div className="confirm-dialog__icon" style={{ color: iconColor }}>
          <Icon name={icon} size={28} strokeWidth={1.5} />
        </div>
        <p className="confirm-dialog__message">{message}</p>
      </div>

      <style>{`
        .confirm-dialog__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-md) 0;
        }

        .confirm-dialog__icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-content);
          border-radius: 50%;
          margin-bottom: var(--spacing-md);
        }

        .confirm-dialog__message {
          font-size: var(--font-size-base);
          color: var(--text-secondary);
          margin: 0;
          max-width: 300px;
        }
      `}</style>
    </Dialog>
  )
}

export default ConfirmDialog
