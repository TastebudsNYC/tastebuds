'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { MatchScoreBadge } from '@/components/app/MatchScoreBadge'
import { ProfileAvatar } from '@/components/app/ProfileAvatar'
import { TasteTag } from '@/components/app/TasteTag'
import {
  formatDayConfirmationStatus,
  formatEventDate,
  formatEventLocationLine,
} from '@/lib/app/format'
import type { DashboardEvent, FeedbackDraft } from '@/lib/app/types'

const EVENT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDqYWhd6CM0ja06fxxtGnrn-4gj2rJVjMEzPPAOzzyCNV05xUzS1i0rvjhfOFFbDniolswf3SLzB7QetHgaiH8UN9QWWN9wmtAnwLlXKLA2r-JGAr9DXLUN-FwLD_RiJcXVM8D0wwVokUfryW29TwmiZGmwJbLav9xiQSoHnGMiTPx3CQC82QPicuBDljcSBEJPOmDGwE3pEa-c6p5KFZkmbQ0V6U4AOygft8A2_Y1D6E4jUv1JcwVw_CFF9Mc9czMgDYSC7zoADxFy',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqL25hEDVJv9pN6Zjs2G2TZpmVWjMIFv-OpmSYKCvu0eyrh3F9GhwQk9ZaWR2q7OlehbXZMd2CrViUaNbHp4wL3RnOThQf28i4tcy4QFtSiddzWQNTpcV6j3Pct_FxUjVjSuGeUile0FLHm17i2yNXaMj9z74GrLizBt7x3SNmO1mwugeE6Wl5u7G_Dgj37zhoULyZUeFJFsXvdx2JayLb22Co6BZzBvR70FXOf0ggxi2hGt_S0JMVwEc4cBWONW_uMA8xEJN8ru8B',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCygTik5ExFv6d7QT2oGaLcpDJDr8C4Tte6UAOHLM8J9XSVspf3cV2m9S5-nQp9zTL50-_IUuNNTBCkkDHmWn8tTh-dEqVQsfnWqcW_AoOPIaBF8nset8-4AYSeqnpZ9lpsDXDSnBmU2DTWyIs3R7K8GShwB9wJew46FIsu7_S68vJaX70JM_yIrO0DnN7moy8nH6WuMW8IwZAVI83ZVGXZKoBxDeJrmmgAE1kzube4go9GkuP2XlEHgfEzTspjq0vlUt8xRBJyARE1',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCxNfyXjpd5uXbtI5ZwNkfFjXFXvmQ7j2g_YUjKIEmetFmNaMFFqHcBniBnsT17KEBNJa4VNYO9VaQHJCr7SA2WqF0p0AP3uAJqq3AVBdqra9EkmMxwFVsxcACH2dlTC2xTVssN_zHAXQN05iisrUID5xsa8M-o4IyRlhWHPKslpQ1f0LPR0SvjqNavrPIxTf_GNplbRltlI_sEYTtCUrzlxMymtLdIxGCZaC3d1wi4v3RnRJ8Zyq9bbwpNK-0zVNZz8F0zlJ0rlCM3',
] as const

function getPrimaryActionLabel(
  event: DashboardEvent,
  eventActionLoadingId: number | null | undefined
) {
  if (eventActionLoadingId === event.id) {
    return 'Updating...'
  }

  if (event.hasEnded) {
    return 'Event ended'
  }

  if (event.isJoined) {
    return 'View booking'
  }

  if (event.status !== 'open' || event.spotsLeft === 0) {
    return 'Join waitlist'
  }

  if (!event.isVenueSaved) {
    return 'Save & join'
  }

  return 'Join table'
}

function isPrimaryActionDisabled(
  event: DashboardEvent,
  eventActionLoadingId: number | null | undefined
) {
  if (eventActionLoadingId === event.id || event.hasEnded) {
    return true
  }

  return false
}

function getListTags(event: DashboardEvent) {
  const tags: string[] = []

  if (event.restaurant_cuisines?.[0]) {
    tags.push(event.restaurant_cuisines[0])
  }

  if (event.venue_price) {
    tags.push(event.venue_price)
  }

  if (event.venue_scene?.[0]) {
    tags.push(event.venue_scene[0])
  }

  if (event.venue_energy) {
    tags.push(event.venue_energy)
  }

  return tags.slice(0, 4)
}

function getAvailabilityLabel(event: DashboardEvent) {
  if (event.hasEnded) {
    return 'Table ended'
  }

  if (event.status !== 'open' || event.spotsLeft === 0) {
    return 'Table full'
  }

  if (event.attendeeCount === 0) {
    return `${event.capacity} seats available`
  }

  return `${event.spotsLeft} of ${event.capacity} seats left`
}

function getSeatSupportLine(event: DashboardEvent) {
  if (event.hasEnded) {
    if (event.feedback.submitted) {
      return 'You left feedback for this table.'
    }

    if (event.canSubmitFeedback) {
      return 'This table has ended. Feedback is still open.'
    }

    return 'This table has ended.'
  }

  if (event.isJoined) {
    return `You have a seat at this table. ${event.spotsLeft} of ${event.capacity} seats left.`
  }

  if (event.status !== 'open' || event.spotsLeft === 0) {
    return `Table for ${event.capacity}.`
  }

  return event.attendeeCount > 0
    ? `${event.attendeeCount} ${event.attendeeCount === 1 ? 'person has' : 'people have'} joined so far.`
    : 'A venue-hosted table with open seats right now.'
}

function getDetailSeatTitle(event: DashboardEvent) {
  if (event.hasEnded) {
    return 'This table has ended'
  }

  if (event.signupStatus === 'going') {
    return 'You are booked in'
  }

  if (event.status !== 'open' || event.spotsLeft === 0) {
    return 'This table is full'
  }

  return 'Seats are open right now'
}

function getDetailSeatDescription(event: DashboardEvent) {
  if (event.hasEnded || event.signupStatus !== 'going') {
    return `${getAvailabilityLabel(event)}. Table for ${event.capacity}.`
  }

  return `Today's reply: ${formatDayConfirmationStatus(event.dayOfConfirmationStatus)}.`
}

function getAtAGlanceSeatSummary(event: DashboardEvent) {
  if (event.hasEnded) {
    return event.feedback.submitted ? 'Feedback submitted' : 'Ended'
  }

  return getAvailabilityLabel(event)
}

function getStatusTone(event: DashboardEvent) {
  if (event.isJoined) {
    return 'joined'
  }

  if (event.status === 'open' && event.spotsLeft > 0) {
    return 'open'
  }

  return 'neutral'
}

function getStatusChip(event: DashboardEvent) {
  if (event.isJoined) {
    return 'Joined'
  }

  if (event.status === 'open' && event.spotsLeft > 0) {
    return 'Open table'
  }

  return 'Table full'
}

function formatFeedbackRating(value: number | null) {
  return value === null ? 'Not rated' : `${value}/5`
}

function formatJoinAgain(value: boolean | null) {
  if (value === null) {
    return 'Not answered'
  }

  return value ? 'Yes' : 'No'
}

function getShortEventWindow(event: DashboardEvent) {
  const start = new Date(event.starts_at)
  const end = new Date(start.getTime() + event.duration_minutes * 60 * 1000)
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
  const endFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })

  return `${formatter.format(start)} - ${endFormatter.format(end)}`
}

function getDateBadge(value: string) {
  const date = new Date(value)

  return {
    day: new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      timeZone: 'America/New_York',
    }).format(date),
    month: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      timeZone: 'America/New_York',
    }).format(date),
  }
}

function getEventImage(event: DashboardEvent) {
  return EVENT_IMAGES[event.id % EVENT_IMAGES.length] ?? EVENT_IMAGES[0]!
}

function getAttendeePreviewStatus(
  event: DashboardEvent,
  status: DashboardEvent['attendeePreview'][number]['dayOfConfirmationStatus']
) {
  if (!event.needsDayOfConfirmation) {
    return 'Joined'
  }

  switch (status) {
    case 'confirmed':
      return 'Confirmed today'
    case 'declined':
      return 'Unable today'
    case 'pending':
    default:
      return 'Awaiting reply'
  }
}

function getAttendeeAreaLabel(
  attendee: DashboardEvent['attendeePreview'][number]
) {
  if (attendee.neighbourhood && attendee.subregion) {
    return `${attendee.neighbourhood}, ${attendee.subregion}`
  }

  return attendee.neighbourhood ?? attendee.subregion ?? null
}

function getAttendeeInterestTags(
  attendee: DashboardEvent['attendeePreview'][number]
) {
  const tags: string[] = []

  for (const cuisine of attendee.cuisinePreferences ?? []) {
    if (!tags.includes(cuisine)) {
      tags.push(cuisine)
    }

    if (tags.length >= 2) {
      break
    }
  }

  const fallbackGroups = [
    attendee.preferredEnergy,
    attendee.preferredScene,
    attendee.preferredCrowd,
    attendee.conversationPreference,
  ]

  for (const group of fallbackGroups) {
    for (const value of group ?? []) {
      if (!tags.includes(value)) {
        tags.push(value)
      }

      if (tags.length >= 4) {
        return tags
      }
    }
  }

  return tags
}

function getMatchExplanation(event: DashboardEvent) {
  if (event.personalMatchSummary?.trim()) {
    return event.personalMatchSummary.trim()
  }

  if (event.isJoined) {
    return 'You already have a seat at this hosted table.'
  }

  if (event.isVenueSaved && event.status === 'open' && event.spotsLeft > 0) {
    return 'Already on your watchlist, with a live table available.'
  }

  if (!event.isVenueSaved && event.status === 'open' && event.spotsLeft > 0) {
    return 'A live table at a venue that looks promising for your usual dinner style.'
  }

  return event.venueMatchSummary
}

function getWhatToExpect(event: DashboardEvent) {
  if (event.description?.trim()) {
    return event.description.trim()
  }

  return 'A small venue-hosted table. Join if you are happy to be matched with people with similar taste and vibe.'
}

function DetailPanel({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section className="rounded-xl bg-[color:var(--surface-soft)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function EventCard({
  event,
  eventActionLoadingId,
  feedbackDraft,
  feedbackSavingId,
  highlighted = false,
  onCloseDetails,
  onHighlightChange,
  onFeedbackDraftChange,
  onOpenDetails,
  onSelectSimilarEvent,
  onSetDayOfConfirmation,
  onSetEventSignup,
  onSubmitFeedback,
  similarEvents = [],
  showDetails = false,
  withinModal = false,
}: {
  event: DashboardEvent
  eventActionLoadingId?: number | null
  feedbackDraft?: FeedbackDraft
  feedbackSavingId?: number | null
  highlighted?: boolean
  onCloseDetails?: () => void
  onHighlightChange?: (restaurantId: number | null) => void
  onFeedbackDraftChange?: (draft: FeedbackDraft) => void
  onOpenDetails?: () => void
  onSelectSimilarEvent?: (eventId: number) => void
  onSetDayOfConfirmation?: (action: 'confirm' | 'decline') => void
  onSetEventSignup?: (action: 'join' | 'leave') => void
  onSubmitFeedback?: () => void
  similarEvents?: DashboardEvent[]
  showDetails?: boolean
  withinModal?: boolean
}) {
  const listTags = getListTags(event)
  const badge = getDateBadge(event.starts_at)
  const seatSupportLine = getSeatSupportLine(event)
  const matchExplanation = getMatchExplanation(event)
  const locationLine = formatEventLocationLine({
    distanceKm: event.venueDistanceKm,
    neighbourhood: event.restaurant_neighbourhood,
    restaurantName: event.restaurant_name,
    subregion: event.restaurant_subregion,
  })
  const [editingFeedbackEventId, setEditingFeedbackEventId] = useState<number | null>(null)
  const isEditingFeedback = editingFeedbackEventId === event.id
  const showFeedbackForm = event.canSubmitFeedback && (!event.feedback.submitted || isEditingFeedback)

  return (
    <article
      className={`group overflow-hidden rounded-xl border bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.07)] ${
        event.hasEnded ? 'border-[color:var(--accent-border)] opacity-90' : 'border-[color:var(--border-soft)]'
      } ${highlighted ? 'border-[color:var(--accent-border)] shadow-[0_22px_50px_rgba(255,193,67,0.18)]' : ''} ${showDetails ? '' : 'tb-card-interactive'}`}
      onMouseEnter={() => onHighlightChange?.(event.id)}
      onMouseLeave={() => onHighlightChange?.(null)}
    >
      <div className={showDetails ? '' : 'grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)_220px]'}>
        <div
          className={
            showDetails ? 'relative h-72 overflow-hidden sm:h-80' : 'relative min-h-64 overflow-hidden'
          }
        >
          <GooglePlacePhoto
            alt={event.restaurant_name}
            attributionClassName="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white"
            fallbackSrc={getEventImage(event)}
            imageClassName={`h-full w-full object-cover transition-transform duration-300 ease-out ${
              showDetails ? '' : 'group-hover:scale-[1.02]'
            }`}
            placeId={event.restaurantGooglePlaceId}
          />
          <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-center backdrop-blur">
            <span className="block text-xl font-bold leading-none text-[color:var(--foreground)]">{badge.day}</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              {badge.month}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-7">
          <div className="flex flex-wrap items-start gap-3">
            <MatchScoreBadge
              className={showDetails ? 'min-w-[190px]' : undefined}
              compact={!showDetails}
              score={event.projectedRestaurantScore}
            />
            <span
              className={
                getStatusTone(event) === 'joined'
                  ? 'rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-strong)] transition-[filter,box-shadow] duration-180 group-hover:brightness-[1.02]'
                  : getStatusTone(event) === 'open'
                    ? 'rounded-full bg-[color:var(--status-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--status-text)] transition-[filter,box-shadow] duration-180 group-hover:brightness-[1.02]'
                    : 'rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)] transition-[filter,box-shadow] duration-180 group-hover:brightness-[1.02]'
              }
            >
              {getStatusChip(event)}
            </span>
            {event.hasEnded ? (
              <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
                Ended
              </span>
            ) : null}
            {event.canSubmitFeedback && !event.feedback.submitted ? (
              <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-strong)]">
                Feedback due
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {event.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-[color:var(--foreground)]">
            {locationLine}
          </p>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">{getShortEventWindow(event)}</p>

          {!showDetails ? (
            <div className="mt-5 max-w-3xl space-y-3">
              <p className="text-base leading-7 text-[color:var(--foreground)]">{matchExplanation}</p>
              {event.venueMatchFactors.length > 0 ? (
                <p className="text-sm text-[color:var(--text-muted)]">
                  Match: {event.venueMatchFactors.join(' / ')}
                </p>
              ) : null}
              <p className="text-sm leading-7 text-[color:var(--text-muted)]">{seatSupportLine}</p>
            </div>
          ) : (
            <p className="mt-5 max-w-3xl text-base leading-7 text-[color:var(--foreground)]">
              {getWhatToExpect(event)}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {listTags.map((value) => (
              <TasteTag key={`${event.id}-${value}`}>{value}</TasteTag>
            ))}
          </div>

          {showDetails ? (
            <>
              <section className="mt-8 grid gap-4 lg:grid-cols-2">
                <DetailPanel title="Why this fits you">
                  <p className="text-sm leading-7 text-[color:var(--foreground)]">{matchExplanation}</p>
                </DetailPanel>
                <DetailPanel title="What to expect">
                  <p className="text-sm leading-7 text-[color:var(--foreground)]">{getWhatToExpect(event)}</p>
                </DetailPanel>
                <DetailPanel title="Your seat">
                  <p className="text-base font-semibold text-[color:var(--foreground)]">
                    {getDetailSeatTitle(event)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                    {getDetailSeatDescription(event)}
                  </p>
                </DetailPanel>
                <DetailPanel title="At a glance">
                  <div className="space-y-2 text-sm text-[color:var(--foreground)]">
                    <p>{formatEventDate(event.starts_at)}</p>
                    <p>Table for {event.capacity}</p>
                    <p>{getAtAGlanceSeatSummary(event)}</p>
                    <p>Hosted by {event.restaurant_name}</p>
                  </div>
                </DetailPanel>
              </section>

              {event.needsDayOfConfirmation && onSetDayOfConfirmation ? (
                <section className="mt-5 rounded-[1.75rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-softer)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                    Confirmation needed today
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    This dinner is happening today. Confirm whether you are still going.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      disabled={eventActionLoadingId === event.id}
                      onClick={() => onSetDayOfConfirmation('confirm')}
                    >
                      {eventActionLoadingId === event.id ? 'Updating...' : 'Confirm I am still going'}
                    </Button>
                    <Button
                      disabled={eventActionLoadingId === event.id}
                      onClick={() => onSetDayOfConfirmation('decline')}
                      variant="secondary"
                    >
                      {eventActionLoadingId === event.id ? 'Updating...' : "I can't make it"}
                    </Button>
                  </div>
                </section>
              ) : null}

              <div className="mt-5">
                <DetailPanel title="Attendee preview">
                  {event.canViewAttendees ? (
                    event.attendeePreview.length > 0 ? (
                      <div className="space-y-3">
                        {event.attendeePreview.map((attendee, index) => (
                          <article
                            className="rounded-2xl border border-[color:var(--border-soft)] bg-white px-4 py-4"
                            key={`${event.id}-${attendee.displayName}-${index}`}
                          >
                            <div className="flex items-start gap-3">
                              <ProfileAvatar
                                className="h-12 w-12"
                                displayName={attendee.displayName}
                                photoUrl={attendee.profilePhotoUrl}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                                    {attendee.displayName}
                                  </p>
                                  <p className="text-xs text-[color:var(--text-muted)]">
                                    {getAttendeePreviewStatus(event, attendee.dayOfConfirmationStatus)}
                                  </p>
                                </div>
                                {getAttendeeAreaLabel(attendee) ? (
                                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                                    {getAttendeeAreaLabel(attendee)}
                                  </p>
                                ) : null}
                                {attendee.bio ? (
                                  <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                                    {attendee.bio}
                                  </p>
                                ) : null}
                                {getAttendeeInterestTags(attendee).length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {getAttendeeInterestTags(attendee).map((tag) => (
                                      <TasteTag key={`${event.id}-${attendee.displayName}-${tag}`}>
                                        {tag}
                                      </TasteTag>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[color:var(--text-muted)]">No one has confirmed yet.</p>
                    )
                  ) : (
                    <p className="text-sm text-[color:var(--text-muted)]">Join to see more about the table.</p>
                  )}
                </DetailPanel>
              </div>

              {!event.isJoined && (event.status !== 'open' || event.spotsLeft === 0) ? (
                <div className="mt-5">
                  <DetailPanel title="Try these instead">
                    {similarEvents.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {similarEvents.map((similarEvent) => (
                          onSelectSimilarEvent ? (
                            <Button
                              key={similarEvent.id}
                              onClick={() => onSelectSimilarEvent(similarEvent.id)}
                              variant="secondary"
                            >
                              {similarEvent.title}
                            </Button>
                          ) : (
                            <Button href="/events" key={similarEvent.id} variant="secondary">
                              {similarEvent.title}
                            </Button>
                          )
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[color:var(--text-muted)]">
                        No close alternatives are live right now.
                      </p>
                    )}
                  </DetailPanel>
                </div>
              ) : null}

              {event.canSubmitFeedback && event.feedback.submitted && !isEditingFeedback ? (
                <div className="mt-5">
                  <DetailPanel title="After the dinner">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">Venue</p>
                        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                          {formatFeedbackRating(event.feedback.venueRating)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">Group</p>
                        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                          {formatFeedbackRating(event.feedback.groupRating)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--foreground)]">Join again</p>
                        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                          {formatJoinAgain(event.feedback.wouldJoinAgain)}
                        </p>
                      </div>
                    </div>
                    {event.feedback.notes ? (
                      <p className="mt-4 rounded-2xl border border-[color:var(--border-soft)] bg-white p-4 text-sm leading-6 text-[color:var(--foreground)]">
                        {event.feedback.notes}
                      </p>
                    ) : null}
                    <div className="mt-4">
                      <Button onClick={() => setEditingFeedbackEventId(event.id)} variant="secondary">
                        Edit feedback
                      </Button>
                    </div>
                  </DetailPanel>
                </div>
              ) : null}

              {showFeedbackForm && feedbackDraft && onFeedbackDraftChange && onSubmitFeedback ? (
                <div className="mt-5">
                  <DetailPanel title="After the dinner">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[color:var(--foreground)]">Venue rating</span>
                        <select
                          className="tb-input"
                          onChange={(nextEvent) =>
                            onFeedbackDraftChange({
                              ...feedbackDraft,
                              venueRating: nextEvent.target.value,
                            })
                          }
                          value={feedbackDraft.venueRating}
                        >
                          <option value="">Select</option>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating}/5
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[color:var(--foreground)]">Group rating</span>
                        <select
                          className="tb-input"
                          onChange={(nextEvent) =>
                            onFeedbackDraftChange({
                              ...feedbackDraft,
                              groupRating: nextEvent.target.value,
                            })
                          }
                          value={feedbackDraft.groupRating}
                        >
                          <option value="">Select</option>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <option key={rating} value={rating}>
                              {rating}/5
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-[color:var(--foreground)]">Would you join again?</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          { label: 'Yes', value: 'yes' as const },
                          { label: 'No', value: 'no' as const },
                        ].map((option) => (
                          <Button
                            className="min-w-20"
                            key={option.value}
                            onClick={() =>
                              onFeedbackDraftChange({
                                ...feedbackDraft,
                                wouldJoinAgain: option.value,
                              })
                            }
                            size="sm"
                            variant={feedbackDraft.wouldJoinAgain === option.value ? 'primary' : 'secondary'}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <label className="mt-4 block space-y-2">
                      <span className="text-sm font-medium text-[color:var(--foreground)]">Notes</span>
                      <textarea
                        className="tb-input min-h-24"
                        onChange={(nextEvent) =>
                          onFeedbackDraftChange({
                            ...feedbackDraft,
                            notes: nextEvent.target.value,
                          })
                        }
                        placeholder="What worked or didn't?"
                        value={feedbackDraft.notes}
                      />
                    </label>
                    <div className="mt-4">
                      <Button
                        disabled={
                          feedbackSavingId === event.id ||
                          !feedbackDraft.groupRating ||
                          !feedbackDraft.venueRating ||
                          !feedbackDraft.wouldJoinAgain
                        }
                        onClick={() => {
                          onSubmitFeedback()
                          setEditingFeedbackEventId(null)
                        }}
                      >
                        {feedbackSavingId === event.id
                          ? 'Saving...'
                          : event.feedback.submitted
                            ? 'Update feedback'
                            : 'Save feedback'}
                      </Button>
                    </div>
                  </DetailPanel>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {event.isJoined ? (
                  <Button disabled variant="secondary">
                    View booking
                  </Button>
                ) : onSetEventSignup ? (
                  <Button
                    disabled={isPrimaryActionDisabled(event, eventActionLoadingId)}
                    onClick={() => onSetEventSignup('join')}
                  >
                    {getPrimaryActionLabel(event, eventActionLoadingId)}
                  </Button>
                ) : null}
                {withinModal && onCloseDetails ? (
                  <Button onClick={onCloseDetails} variant="secondary">
                    Back to events
                  </Button>
                ) : (
                  <Button href="/events" variant="secondary">
                    Back to events
                  </Button>
                )}
                {(event.status !== 'open' || event.spotsLeft === 0) && !event.isJoined && !event.hasEnded ? (
                  <p className="w-full text-sm text-[color:var(--text-muted)]">
                    This table is full. You can still open the join confirmation for details.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        {!showDetails ? (
          <aside className="border-t border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-6 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  Availability
                </p>
                <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
                  {getAvailabilityLabel(event)}
                </p>
              </div>
              <div className="grid gap-3 text-sm text-[color:var(--foreground)]">
                <p>Table for {event.capacity}</p>
                <p>Hosted by {event.restaurant_name}</p>
              </div>
              <div className="space-y-3">
                {event.isJoined ? (
                  <Button className="w-full" onClick={onOpenDetails}>
                    View booking
                  </Button>
                ) : onSetEventSignup ? (
                  <Button
                    className="w-full"
                    disabled={isPrimaryActionDisabled(event, eventActionLoadingId)}
                    onClick={() => onSetEventSignup('join')}
                  >
                    {getPrimaryActionLabel(event, eventActionLoadingId)}
                  </Button>
                ) : null}
                {onOpenDetails ? (
                  <Button className="w-full" onClick={onOpenDetails} variant="secondary">
                    See details
                  </Button>
                ) : null}
                {(event.status !== 'open' || event.spotsLeft === 0) && !event.isJoined && !event.hasEnded ? (
                  <p className="text-xs leading-5 text-[color:var(--text-muted)]">
                    Full right now. Open to review the waitlist message.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  )
}
