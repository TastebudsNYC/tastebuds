'use client'

import { Button } from '@/components/app/Button'
import { ModalShell } from '@/components/app/ModalShell'
import { formatEventDate } from '@/lib/app/format'
import type { DashboardEvent } from '@/lib/app/types'

function getPrimaryLabel(event: DashboardEvent) {
  if (!event.isVenueSaved) {
    return 'Save & join'
  }

  if (event.status !== 'open' || event.spotsLeft === 0) {
    return 'Okay'
  }

  return 'Join table'
}

function getBodyCopy(event: DashboardEvent) {
  if (event.status !== 'open' || event.spotsLeft === 0) {
    return 'This table is currently full. Waitlist signups are not live yet, so we are keeping this to a clear heads-up instead of pretending otherwise.'
  }

  if (!event.isVenueSaved) {
    return 'This venue will be saved to your watchlist first, then you will be added to the table and receive dinner updates in your inbox.'
  }

  return "You'll be added to the table and receive dinner updates in your inbox."
}

export function EventJoinConfirmModal({
  event,
  loading = false,
  onCancel,
  onConfirm,
}: {
  event: DashboardEvent
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const title =
    event.status !== 'open' || event.spotsLeft === 0
      ? `Join waitlist for ${event.title}?`
      : `Join ${event.title}?`

  return (
    <ModalShell align="center" className="max-w-xl" onClose={onCancel}>
      {({ requestClose }) => (
        <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 shadow-[0_30px_90px_rgba(20,20,20,0.28)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
            Confirm booking
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {title}
          </h2>
          <div className="mt-5 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-4">
            <p className="text-base font-semibold text-[color:var(--foreground)]">
              {event.restaurant_name} / {event.restaurant_subregion}
              {event.restaurant_neighbourhood ? `, ${event.restaurant_neighbourhood}` : ''}
            </p>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              {formatEventDate(event.starts_at)}
            </p>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Table for {event.capacity}</p>
          </div>
          <p className="mt-5 text-sm leading-7 text-[color:var(--text-secondary)]">
            {getBodyCopy(event)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={loading}
              onClick={() => {
                if (event.status !== 'open' || event.spotsLeft === 0) {
                  requestClose()
                  return
                }

                onConfirm()
              }}
            >
              {loading ? 'Updating...' : getPrimaryLabel(event)}
            </Button>
            <Button onClick={requestClose} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
