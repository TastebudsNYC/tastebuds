'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cx } from '@/lib/app/format'

const MODAL_CLOSE_MS = 170

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return []
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'))
}

export function ModalShell({
  align = 'start',
  children,
  className,
  initialFocus = 'first',
  onClose,
}: {
  align?: 'center' | 'start'
  children: (controls: { requestClose: () => void }) => ReactNode
  className?: string
  initialFocus?: 'container' | 'first'
  onClose: () => void
}) {
  const [isClosing, setIsClosing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [])

  useEffect(() => {
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const focusable = getFocusableElements(container)
    const initialTarget =
      initialFocus === 'container' ? container : (focusable[0] ?? container)

    document.body.style.overflow = 'hidden'
    initialTarget?.focus()

    function requestClose() {
      setIsClosing((current) => {
        if (current) {
          return current
        }

        window.setTimeout(() => {
          onClose()
        }, MODAL_CLOSE_MS)

        return true
      })
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const nextFocusable = getFocusableElements(containerRef.current)
      if (nextFocusable.length === 0) {
        event.preventDefault()
        containerRef.current?.focus()
        return
      }

      const first = nextFocusable[0]
      const last = nextFocusable[nextFocusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    window.addEventListener('keydown', handleKeydown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [initialFocus, onClose])

  function requestClose() {
    if (isClosing) {
      return
    }

    setIsClosing(true)
    window.setTimeout(() => {
      onClose()
    }, MODAL_CLOSE_MS)
  }

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={cx(
        'fixed inset-0 z-50 flex justify-center overflow-y-auto px-4 py-6',
        align === 'center' ? 'items-center' : 'items-start',
        isClosing ? 'tb-overlay-exit' : 'tb-overlay-enter'
      )}
      onClick={requestClose}
      role="dialog"
    >
      <div
        className={cx(
          'w-full outline-none',
          isClosing ? 'tb-modal-exit' : 'tb-modal-enter',
          className
        )}
        onClick={(event) => event.stopPropagation()}
        ref={containerRef}
        tabIndex={-1}
      >
        <span className="sr-only" id={titleId}>
          Dialog
        </span>
        {children({ requestClose })}
      </div>
    </div>,
    document.body
  )
}
