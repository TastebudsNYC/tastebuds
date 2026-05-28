'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { cx } from '@/lib/app/format'

type ToastTone = 'navy' | 'surface'

type ToastInput = {
  description?: string
  title: string
  tone?: ToastTone
}

type ToastRecord = ToastInput & {
  id: number
}

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)
const TOAST_DISMISS_MS = 3200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextIdRef = useRef(1)

  const removeToast = useCallback((toastId: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const pushToast = useCallback((toast: ToastInput) => {
    const toastId = nextIdRef.current++
    setToasts((current) => [...current, { ...toast, id: toastId }])
  }, [])

  useEffect(() => {
    if (toasts.length === 0) {
      return
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), TOAST_DISMISS_MS)
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [removeToast, toasts])

  const contextValue = useMemo(
    () => ({ pushToast }),
    [pushToast]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-atomic="true"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[80] flex flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-[min(24rem,calc(100vw-2rem))]"
      >
        {toasts.map((toast) => (
          <div
            className={cx(
              'tb-toast pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_40px_rgba(0,20,38,0.14)]',
              toast.tone === 'navy'
                ? 'border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] text-white'
                : 'border-[color:var(--border-soft)] bg-[color:var(--surface)] text-[color:var(--foreground)]'
            )}
            key={toast.id}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cx(
                  'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                  toast.tone === 'navy' ? 'bg-[color:var(--accent)]' : 'bg-[color:var(--accent-strong)]'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p
                    className={cx(
                      'mt-1 text-sm leading-6',
                      toast.tone === 'navy' ? 'text-[#d8e2ec]' : 'text-[color:var(--text-secondary)]'
                    )}
                  >
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                aria-label="Dismiss notification"
                className={cx(
                  'rounded-full p-1 text-sm transition hover:bg-black/5',
                  toast.tone === 'navy' ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-[color:var(--text-muted)] hover:text-[color:var(--foreground)]'
                )}
                onClick={() => removeToast(toast.id)}
                type="button"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.')
  }

  return context
}
