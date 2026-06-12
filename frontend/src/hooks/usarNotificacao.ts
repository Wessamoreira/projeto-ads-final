import { useRef, useEffect } from 'react'
import type { ToastRef } from '../components/common/Notificacao'
import { setGlobalToastRef } from '../components/common/Notificacao'

/**
 * Liga o Toast global. Use uma vez no App e depois chame `toast.success(...)`
 * de qualquer lugar.
 */
export function useToast() {
  const toastRef = useRef<ToastRef>(null)

  useEffect(() => {
    setGlobalToastRef(toastRef.current)
    return () => setGlobalToastRef(null)
  }, [])

  return toastRef
}

export default useToast
