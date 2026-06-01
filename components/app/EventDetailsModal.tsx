'use client'

import { EventCard } from '@/components/app/EventCard'
import { ModalShell } from '@/components/app/ModalShell'
import type { DashboardEvent, FeedbackDraft } from '@/lib/app/types'

export function EventDetailsModal({
  event,
  eventActionLoadingId,
  feedbackDraft,
  feedbackSavingId,
  onClose,
  onFeedbackDraftChange,
  onSelectSimilarEvent,
  onSetDayOfConfirmation,
  onSetEventSignup,
  onSubmitFeedback,
  similarEvents = [],
}: {
  event: DashboardEvent
  eventActionLoadingId?: number | null
  feedbackDraft?: FeedbackDraft
  feedbackSavingId?: number | null
  onClose: () => void
  onFeedbackDraftChange?: (draft: FeedbackDraft) => void
  onSelectSimilarEvent?: (eventId: number) => void
  onSetDayOfConfirmation?: (action: 'confirm' | 'decline') => void
  onSetEventSignup?: (action: 'join' | 'leave') => void
  onSubmitFeedback?: () => void
  similarEvents?: DashboardEvent[]
}) {
  return (
    <ModalShell className="max-w-6xl" initialFocus="container" onClose={onClose}>
      {({ requestClose }) => (
        <EventCard
          event={event}
          onCloseDetails={requestClose}
          similarEvents={similarEvents}
          showDetails
          withinModal
          {...(eventActionLoadingId !== undefined ? { eventActionLoadingId } : {})}
          {...(feedbackDraft ? { feedbackDraft } : {})}
          {...(feedbackSavingId !== undefined ? { feedbackSavingId } : {})}
          {...(onFeedbackDraftChange ? { onFeedbackDraftChange } : {})}
          {...(onSelectSimilarEvent ? { onSelectSimilarEvent } : {})}
          {...(onSetDayOfConfirmation ? { onSetDayOfConfirmation } : {})}
          {...(onSetEventSignup ? { onSetEventSignup } : {})}
          {...(onSubmitFeedback ? { onSubmitFeedback } : {})}
        />
      )}
    </ModalShell>
  )
}
