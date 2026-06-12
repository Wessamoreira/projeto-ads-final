import { useRef, forwardRef, useImperativeHandle } from 'react'
import { Toast as PrimeToast } from 'primereact/toast'
import type { ToastMessage } from 'primereact/toast'

export interface ToastRef {
  show: (message: ToastMessage | ToastMessage[]) => void
  success: (summary: string, detail?: string) => void
  info: (summary: string, detail?: string) => void
  warn: (summary: string, detail?: string) => void
  error: (summary: string, detail?: string) => void
  clear: () => void
}

interface ToastProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center'
}

/**
 * Toast - Notificacoes toast com estilo glass
 */
const Toast = forwardRef<ToastRef, ToastProps>(({ position = 'top-right' }, ref) => {
  const toastRef = useRef<PrimeToast>(null)

  useImperativeHandle(ref, () => ({
    show: (message: ToastMessage | ToastMessage[]) => {
      toastRef.current?.show(message)
    },
    success: (summary: string, detail?: string) => {
      toastRef.current?.show({
        severity: 'success',
        summary,
        detail,
        life: 3000
      })
    },
    info: (summary: string, detail?: string) => {
      toastRef.current?.show({
        severity: 'info',
        summary,
        detail,
        life: 3000
      })
    },
    warn: (summary: string, detail?: string) => {
      toastRef.current?.show({
        severity: 'warn',
        summary,
        detail,
        life: 4000
      })
    },
    error: (summary: string, detail?: string) => {
      toastRef.current?.show({
        severity: 'error',
        summary,
        detail,
        life: 5000
      })
    },
    clear: () => {
      toastRef.current?.clear()
    }
  }))

  return <PrimeToast ref={toastRef} position={position} />
})

Toast.displayName = 'Toast'

export default Toast

// Global Toast
let globalToastRef: ToastRef | null = null

export const setGlobalToastRef = (ref: ToastRef | null) => {
  globalToastRef = ref
}

export const toast = {
  show: (message: ToastMessage | ToastMessage[]) => globalToastRef?.show(message),
  success: (summary: string, detail?: string) => globalToastRef?.success(summary, detail),
  info: (summary: string, detail?: string) => globalToastRef?.info(summary, detail),
  warn: (summary: string, detail?: string) => globalToastRef?.warn(summary, detail),
  error: (summary: string, detail?: string) => globalToastRef?.error(summary, detail),
  clear: () => globalToastRef?.clear()
}
