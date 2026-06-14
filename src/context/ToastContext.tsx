import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ToastItem } from '../types'

interface ToastContextValue {
  toasts: ToastItem[]
  show: (message: string, type?: ToastItem['type']) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, type: ToastItem['type'] = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => remove(id), 3000)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ toasts, show, remove }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-enter pointer-events-auto px-4 py-2 rounded-lg shadow-lg text-white text-sm min-w-[200px] ${
              t.type === 'success'
                ? 'bg-green-600'
                : t.type === 'warn'
                  ? 'bg-amber-500'
                  : t.type === 'error'
                    ? 'bg-red-600'
                    : 'bg-slate-700'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
