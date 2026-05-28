import { Button } from '@/components/app/Button'
import { formatNotificationDate, formatNotificationType } from '@/lib/app/format'
import type { NotificationSummary } from '@/lib/app/types'

function NotificationIcon({ type }: { type: NotificationSummary['type'] }) {
  if (type === 'event_signup') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M5 12.5 9.5 17 19 7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (type === 'restaurant_removed') {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M12 10.5h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M15 17H5.5a1 1 0 0 1-.8-1.6L6 13.7V10a6 6 0 1 1 12 0v3.7l1.3 1.7A1 1 0 0 1 18.5 17H15Zm0 0a3 3 0 0 1-6 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function NotificationCard({
  actionHref,
  actionLabel,
  deleting,
  notification,
  onDismiss,
}: {
  actionHref?: string
  actionLabel?: string
  deleting?: boolean
  notification: NotificationSummary
  onDismiss?: () => void
}) {
  return (
    <article className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
              <NotificationIcon type={notification.type} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {!notification.read_at ? (
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                    Unread
                  </span>
                ) : null}
                <p className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
                  {notification.title}
                </p>
              </div>
              <p className="tb-label mt-2 text-xs uppercase tracking-[0.14em]">
                {formatNotificationType(notification.type)} / {formatNotificationDate(notification.created_at)}
              </p>
            </div>
          </div>
          <p className="tb-copy mt-4 text-sm leading-7">{notification.body}</p>
          {actionHref && actionLabel ? (
            <div className="mt-4">
              <Button href={actionHref} size="sm" variant="secondary">
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
        {onDismiss ? (
          <Button disabled={deleting} onClick={onDismiss} size="sm" variant="ghost">
            {deleting ? 'Removing...' : 'Dismiss'}
          </Button>
        ) : null}
      </div>
    </article>
  )
}
