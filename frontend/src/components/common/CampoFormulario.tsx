import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

/**
 * FormField - Wrapper para campos de formulário
 *
 * @example
 * <FormField label="E-mail" error={errors.email} required>
 *   <InputText id="email" {...register('email')} />
 * </FormField>
 */
const FormField = ({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = ''
}: FormFieldProps) => {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      <label htmlFor={htmlFor} className="form-field__label">
        {label}
        {required && <span className="form-field__required">*</span>}
      </label>

      <div className="form-field__input">
        {children}
      </div>

      {error && (
        <small className="form-field__error">
          <AlertCircle size={12} strokeWidth={1.75} />
          {error}
        </small>
      )}

      {hint && !error && (
        <small className="form-field__hint">{hint}</small>
      )}

      <style>{`
        .form-field {
          margin-bottom: var(--spacing-md);
        }

        .form-field__label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xs);
        }

        .form-field__required {
          color: var(--color-danger);
          margin-left: 2px;
        }

        .form-field__input {
          width: 100%;
        }

        .form-field__input .p-inputtext,
        .form-field__input .p-dropdown,
        .form-field__input .p-calendar,
        .form-field__input .p-inputnumber {
          width: 100%;
        }

        .form-field__error {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-danger);
          font-size: var(--font-size-xs);
          margin-top: var(--spacing-xs);
        }

        .form-field__error i {
          font-size: 0.75rem;
        }

        .form-field__hint {
          display: block;
          color: var(--text-muted);
          font-size: var(--font-size-xs);
          margin-top: var(--spacing-xs);
        }

        .form-field--error .p-inputtext,
        .form-field--error .p-dropdown,
        .form-field--error .p-calendar {
          border-color: var(--color-danger) !important;
        }
      `}</style>
    </div>
  )
}

export default FormField
