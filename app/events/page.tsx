'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { ActivityRail, TasteProfileRail } from '@/components/app/AppRails'
import { Button } from '@/components/app/Button'
import { EmptyState } from '@/components/app/EmptyState'
import { EventCard } from '@/components/app/EventCard'
import { EventDetailsModal } from '@/components/app/EventDetailsModal'
import { EventJoinConfirmModal } from '@/components/app/EventJoinConfirmModal'
import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { PageHeader } from '@/components/app/PageHeader'
import { useToast } from '@/components/app/ToastProvider'
import { compareEntitiesWithPromotion } from '@/lib/advertising-ordering'
import {
  fetchEvents,
  fetchNotifications,
  fetchRestaurants,
  getAppBootstrap,
  logout,
  setDayOfConfirmation,
  setEventSignup,
  setSavedRestaurant,
  submitFeedback,
} from '@/lib/app/client'
import { formatLiveTableCount, getTravelRadiusKm, toFeedbackDraft } from '@/lib/app/format'
import type { DashboardEvent, DashboardRestaurant, FeedbackDraft, NotificationSummary, Profile } from '@/lib/app/types'

type EventSort = 'match' | 'soonest' | 'seats'
type EventFilter = 'all' | 'open' | 'joined'
type TravelFilter = 'any' | 'flexible' | 'within30'

function getUniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function getSavedRestaurantKeys(restaurants: DashboardRestaurant[]) {
  return new Set(
    restaurants
      .filter((restaurant) => restaurant.isSaved)
      .map((restaurant) =>
        restaurant.googlePlaceId
          ? `place:${restaurant.googlePlaceId}`
          : `name:${restaurant.name.toLowerCase()}::${restaurant.subregion.toLowerCase()}`
      )
  )
}

function matchesEventTravelFilter(
  event: DashboardEvent,
  profile: Profile | null,
  filter: TravelFilter
) {
  if (filter === 'any') {
    return true
  }

  if (event.venueDistanceKm === null) {
    return filter === 'flexible'
  }

  if (filter === 'within30') {
    return event.venueDistanceKm <= getTravelRadiusKm(30)
  }

  return event.venueDistanceKm <= getTravelRadiusKm(profile?.max_travel_minutes ?? 30)
}

function isVisibleEvent(event: DashboardEvent, savedRestaurantKeys: Set<string>) {
  if (
    event.signupStatus === 'going' ||
    event.signupStatus === 'attended' ||
    event.signupStatus === 'no_show'
  ) {
    return true
  }

  const placeKey = event.restaurantGooglePlaceId
    ? `place:${event.restaurantGooglePlaceId}`
    : null
  const fallbackKey = `name:${event.restaurant_name.toLowerCase()}::${event.restaurant_subregion.toLowerCase()}`

  return (placeKey !== null && savedRestaurantKeys.has(placeKey)) || savedRestaurantKeys.has(fallbackKey)
}

function needsFeedback(event: DashboardEvent) {
  return event.canSubmitFeedback && !event.feedback.submitted
}

function isRelevantPastEvent(event: DashboardEvent) {
  return (
    event.hasEnded &&
    (event.signupStatus === 'going' ||
      event.signupStatus === 'attended' ||
      event.signupStatus === 'no_show' ||
      event.feedback.submitted)
  )
}

function getSimilarEvents(allEvents: DashboardEvent[], event: DashboardEvent) {
  return allEvents
    .filter(
      (candidate) =>
        candidate.id !== event.id &&
        candidate.status === 'open' &&
        !candidate.hasEnded &&
        candidate.spotsLeft > 0 &&
        !candidate.isJoined
    )
    .sort((left, right) => {
      const leftCuisineMatch =
        left.restaurant_cuisines?.[0] &&
        event.restaurant_cuisines?.includes(left.restaurant_cuisines[0])
          ? 1
          : 0
      const rightCuisineMatch =
        right.restaurant_cuisines?.[0] &&
        event.restaurant_cuisines?.includes(right.restaurant_cuisines[0])
          ? 1
          : 0

      if (rightCuisineMatch !== leftCuisineMatch) {
        return rightCuisineMatch - leftCuisineMatch
      }

      const leftAreaMatch = left.restaurant_subregion === event.restaurant_subregion ? 1 : 0
      const rightAreaMatch = right.restaurant_subregion === event.restaurant_subregion ? 1 : 0

      if (rightAreaMatch !== leftAreaMatch) {
        return rightAreaMatch - leftAreaMatch
      }

      if (right.projectedRestaurantScore !== left.projectedRestaurantScore) {
        return right.projectedRestaurantScore - left.projectedRestaurantScore
      }

      return left.starts_at.localeCompare(right.starts_at)
    })
    .slice(0, 3)
}

function compareEventsOrganically(
  left: DashboardEvent,
  right: DashboardEvent,
  sortBy: EventSort
) {
  if (sortBy === 'soonest') {
    return left.starts_at.localeCompare(right.starts_at)
  }

  if (sortBy === 'seats' && right.spotsLeft !== left.spotsLeft) {
    return right.spotsLeft - left.spotsLeft
  }

  if (Number(right.isJoined) !== Number(left.isJoined)) {
    return Number(right.isJoined) - Number(left.isJoined)
  }

  if (right.projectedRestaurantScore !== left.projectedRestaurantScore) {
    return right.projectedRestaurantScore - left.projectedRestaurantScore
  }

  return left.starts_at.localeCompare(right.starts_at)
}

export default function EventsPage() {
  const router = useRouter()
  const { pushToast } = useToast()
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [allRestaurants, setAllRestaurants] = useState<DashboardRestaurant[]>([])
  const [savedRestaurants, setSavedRestaurants] = useState<DashboardRestaurant[]>([])
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savedRestaurantKeys, setSavedRestaurantKeys] = useState<Set<string>>(new Set())
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null)
  const [highlightedRestaurantId, setHighlightedRestaurantId] = useState<number | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [feedbackDraft, setFeedbackDraft] = useState<FeedbackDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventActionLoadingId, setEventActionLoadingId] = useState<number | null>(null)
  const [feedbackSavingId, setFeedbackSavingId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedSubregion, setSelectedSubregion] = useState('all')
  const [selectedTravel, setSelectedTravel] = useState<TravelFilter>('any')
  const [sortBy, setSortBy] = useState<EventSort>('match')
  const [pendingJoinEventId, setPendingJoinEventId] = useState<number | null>(null)
  const placeFilter = searchParams.get('place')

  useEffect(() => {
    let active = true

    async function loadPage() {
      try {
        const bootstrap = await getAppBootstrap()

        if (!active) {
          return
        }

        const [eventsPayload, restaurantsPayload, notificationResponse] = await Promise.all([
          fetchEvents(bootstrap.accessToken),
          fetchRestaurants(bootstrap.accessToken),
          fetchNotifications(bootstrap.userId),
        ])

        if (!active) {
          return
        }

        if (notificationResponse.error) {
          setError(notificationResponse.error.message)
          setLoading(false)
          return
        }

        if (eventsPayload.onboardingRequired || restaurantsPayload.onboardingRequired) {
          router.replace('/onboarding')
          return
        }

        const nextRestaurants = restaurantsPayload.restaurants ?? []
        const nextSavedRestaurants = nextRestaurants.filter((restaurant) => restaurant.isSaved).slice(0, 3)

        setAllRestaurants(nextRestaurants)
        setSavedRestaurantKeys(getSavedRestaurantKeys(nextRestaurants))
        setSavedRestaurants(nextSavedRestaurants)
        setNotifications(notificationResponse.data ?? [])
        setProfile(bootstrap.profile)
        setEvents(eventsPayload.events ?? [])
        setLoading(false)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Could not load events.')
        setLoading(false)
      }
    }

    void loadPage()

    return () => {
      active = false
    }
  }, [router])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  async function refreshPageData() {
    const bootstrap = await getAppBootstrap()
    const [eventsPayload, restaurantsPayload, notificationResponse] = await Promise.all([
      fetchEvents(bootstrap.accessToken),
      fetchRestaurants(bootstrap.accessToken),
      fetchNotifications(bootstrap.userId),
    ])

    const nextRestaurants = restaurantsPayload.restaurants ?? []
    const nextEvents = eventsPayload.events ?? []

    setAllRestaurants(nextRestaurants)
    setSavedRestaurantKeys(getSavedRestaurantKeys(nextRestaurants))
    setSavedRestaurants(nextRestaurants.filter((restaurant) => restaurant.isSaved).slice(0, 3))
    setNotifications(notificationResponse.data ?? [])
    setEvents(nextEvents)

    return nextEvents
  }

  function findRestaurantIdForEvent(event: DashboardEvent) {
    const match = allRestaurants.find((restaurant) => {
      if (
        event.restaurantGooglePlaceId &&
        restaurant.googlePlaceId &&
        event.restaurantGooglePlaceId === restaurant.googlePlaceId
      ) {
        return true
      }

      return (
        restaurant.name.toLowerCase() === event.restaurant_name.toLowerCase() &&
        restaurant.subregion.toLowerCase() === event.restaurant_subregion.toLowerCase()
      )
    })

    return match?.id ?? null
  }

  async function handleEventSignup(eventId: number, action: 'join' | 'leave') {
    setError('')
    setEventActionLoadingId(eventId)

    try {
      const eventToUpdate = events.find((event) => event.id === eventId) ?? null

      if (action === 'join' && eventToUpdate && !eventToUpdate.isVenueSaved) {
        const restaurantId = findRestaurantIdForEvent(eventToUpdate)

        if (restaurantId === null) {
          throw new Error('Could not match this venue. Try saving it from Restaurants first.')
        }

        await setSavedRestaurant(restaurantId, 'save')
      }

      await setEventSignup(eventId, action)
      const refreshedEvents = await refreshPageData()
      const updatedEvent = refreshedEvents.find((event) => event.id === eventId) ?? eventToUpdate

      if (action === 'join' && updatedEvent) {
        pushToast({
          description: `${updatedEvent.title} has been added to your dinner inbox.`,
          title: "You're in.",
          tone: 'navy',
        })
      }

      if (selectedEventId === eventId) {
        const refreshedEvent = refreshedEvents.find((event) => event.id === eventId) ?? null
        setFeedbackDraft(refreshedEvent ? toFeedbackDraft(refreshedEvent) : null)
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not update your event signup.')
    } finally {
      setEventActionLoadingId(null)
    }
  }

  async function handleDayOfConfirmation(eventId: number, action: 'confirm' | 'decline') {
    setError('')
    setEventActionLoadingId(eventId)

    try {
      await setDayOfConfirmation(eventId, action)
      const refreshedEvents = await refreshPageData()
      pushToast({
        description: action === 'confirm' ? 'Your seat is confirmed for today.' : 'Your booking status was updated.',
        title: 'Booking updated.',
      })
      if (selectedEventId === eventId) {
        const refreshedEvent = refreshedEvents.find((event) => event.id === eventId) ?? null
        setFeedbackDraft(refreshedEvent ? toFeedbackDraft(refreshedEvent) : null)
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Could not update same-day confirmation.'
      )
    } finally {
      setEventActionLoadingId(null)
    }
  }

  async function handleFeedbackSubmit(eventId: number) {
    if (!feedbackDraft) {
      return
    }

    setError('')
    setFeedbackSavingId(eventId)

    try {
      await submitFeedback({
        eventId,
        groupRating: Number(feedbackDraft.groupRating),
        notes: feedbackDraft.notes,
        venueRating: Number(feedbackDraft.venueRating),
        wouldJoinAgain: feedbackDraft.wouldJoinAgain === 'yes',
      })
      const refreshedEvents = await refreshPageData()
      const refreshedEvent = refreshedEvents.find((event) => event.id === eventId) ?? null
      setFeedbackDraft(refreshedEvent ? toFeedbackDraft(refreshedEvent) : null)
      pushToast({
        description: 'Your dinner notes are saved.',
        title: 'Feedback updated.',
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save feedback.')
    } finally {
      setFeedbackSavingId(null)
    }
  }

  const visibleEvents = useMemo(
    () =>
      events
        .filter((event) => isVisibleEvent(event, savedRestaurantKeys))
        .filter((event) => !placeFilter || event.restaurantGooglePlaceId === placeFilter),
    [events, placeFilter, savedRestaurantKeys]
  )
  const cuisineOptions = useMemo(
    () => getUniqueOptions(visibleEvents.map((event) => event.restaurant_cuisines?.[0])),
    [visibleEvents]
  )
  const subregionOptions = useMemo(
    () => getUniqueOptions(visibleEvents.map((event) => event.restaurant_subregion)),
    [visibleEvents]
  )
  const groupedEvents = useMemo(() => {
    const activeEventCount = visibleEvents.filter((event) => !event.hasEnded).length
    const activeEvents = visibleEvents
      .filter((event) => !event.hasEnded)
      .filter((event) => {
        if (activeFilter === 'joined') {
          return event.signupStatus === 'going'
        }

        if (activeFilter === 'open') {
          return !event.isJoined && event.status === 'open' && event.spotsLeft > 0
        }

        return true
      })
      .filter(
        (event) =>
          selectedCuisine === 'all' || event.restaurant_cuisines?.[0] === selectedCuisine
      )
      .filter(
        (event) => selectedSubregion === 'all' || event.restaurant_subregion === selectedSubregion
      )
      .filter((event) => matchesEventTravelFilter(event, profile, selectedTravel))
      .sort((left, right) =>
        compareEntitiesWithPromotion(left, right, {
          organicCompare: (organicLeft, organicRight) =>
            compareEventsOrganically(organicLeft, organicRight, sortBy),
          surfaces: ['event_list'],
        })
      )
    const pastEvents = visibleEvents
      .filter(isRelevantPastEvent)
      .sort((left, right) => right.starts_at.localeCompare(left.starts_at))

    return {
      active: activeEvents,
      activeTotal: activeEventCount,
      needsFeedback: pastEvents.filter(needsFeedback),
      past: pastEvents,
    }
  }, [
    activeFilter,
    profile,
    selectedCuisine,
    selectedSubregion,
    selectedTravel,
    sortBy,
    visibleEvents,
  ])
  const userMapLocation =
    profile?.home_latitude !== null &&
    profile?.home_latitude !== undefined &&
    profile.home_longitude !== null &&
    profile.home_longitude !== undefined
      ? { lat: profile.home_latitude, lng: profile.home_longitude }
      : null
  const selectedEvent =
    selectedEventId === null
      ? null
      : visibleEvents.find((event) => event.id === selectedEventId) ?? null
  const pendingJoinEvent =
    pendingJoinEventId === null
      ? null
      : visibleEvents.find((event) => event.id === pendingJoinEventId) ??
        events.find((event) => event.id === pendingJoinEventId) ??
        null
  const mapRestaurants = useMemo(() => {
    const restaurantIds = new Set(
      groupedEvents.active
        .filter((event) => event.status === 'open' && event.spotsLeft > 0)
        .map((event) => findRestaurantIdForEvent(event))
        .filter((value): value is number => value !== null)
    )

    return allRestaurants.filter((restaurant) => restaurantIds.has(restaurant.id))
  }, [allRestaurants, groupedEvents.active])
  const unreadNotificationCount = notifications.filter((notification) => !notification.read_at).length
  const similarEvents = selectedEvent ? getSimilarEvents(visibleEvents, selectedEvent) : []

  function handleSelectRestaurantFromMap(restaurantId: number | null) {
    setSelectedRestaurantId(restaurantId)

    if (restaurantId === null) {
      return
    }

    const nextEvent =
      groupedEvents.active.find((event) => findRestaurantIdForEvent(event) === restaurantId) ??
      visibleEvents.find((event) => findRestaurantIdForEvent(event) === restaurantId) ??
      null

    if (nextEvent) {
      setSelectedEventId(nextEvent.id)
      setFeedbackDraft(toFeedbackDraft(nextEvent))
    }
  }

  if (loading) {
    return <AppPageSkeleton currentPath="/events" title="Events" variant="list" />
  }

  return (
    <AppShell
      currentPath="/events"
      onLogout={handleLogout}
      profile={profile}
      unreadCount={unreadNotificationCount}
      wide
    >
      <div className="grid w-full gap-8 xl:grid-cols-[260px_minmax(520px,1fr)_320px]">
        <TasteProfileRail profile={profile} />

        <div className="min-w-0 space-y-8">
          <PageHeader
            description="Small dinners ranked by venue fit, taste match and group vibe."
            eyebrow="Events"
            title="Tables worth joining"
          />

          {error ? (
            <div className="rounded-[1.5rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-softer)] p-4 text-sm text-[color:var(--accent-strong)]">
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
            <p className="text-sm text-[color:var(--text-muted)]">
              {placeFilter
                ? groupedEvents.active.length > 0
                  ? `${formatLiveTableCount(groupedEvents.active.length)} for this venue.`
                  : 'No live tables for this venue right now.'
                : groupedEvents.active.length > 0
                ? `${formatLiveTableCount(groupedEvents.active.length)} shown right now.`
                : groupedEvents.activeTotal > 0
                  ? 'No live tables match those filters.'
                  : groupedEvents.past.length > 0
                  ? 'No live tables right now. Past events are saved below.'
                  : 'Save a restaurant first to unlock live tables here.'}
            </p>
          </div>

          <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[color:var(--border-soft)] pb-4">
              {[
                { label: `All ${groupedEvents.activeTotal}`, value: 'all' as const },
                {
                  label: `Open seats ${
                    visibleEvents.filter(
                      (event) => !event.hasEnded && !event.isJoined && event.status === 'open' && event.spotsLeft > 0
                    ).length
                  }`,
                  value: 'open' as const,
                },
                {
                  label: `Joined ${
                    visibleEvents.filter((event) => !event.hasEnded && event.signupStatus === 'going').length
                  }`,
                  value: 'joined' as const,
                },
              ].map((filter) => (
                <Button
                  className="min-h-[42px]"
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  size="sm"
                  variant={activeFilter === filter.value ? 'primary' : 'secondary'}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  Cuisine
                </span>
                <select
                  className="tb-input"
                  onChange={(event) => setSelectedCuisine(event.target.value)}
                  value={selectedCuisine}
                >
                  <option value="all">All cuisines</option>
                  {cuisineOptions.map((cuisine) => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  Area
                </span>
                <select
                  className="tb-input"
                  onChange={(event) => setSelectedSubregion(event.target.value)}
                  value={selectedSubregion}
                >
                  <option value="all">All areas</option>
                  {subregionOptions.map((subregion) => (
                    <option key={subregion} value={subregion}>
                      {subregion}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  Sort
                </span>
                <select
                  className="tb-input"
                  onChange={(event) => setSortBy(event.target.value as EventSort)}
                  value={sortBy}
                >
                  <option value="match">Best match</option>
                  <option value="soonest">Soonest</option>
                  <option value="seats">Seats left</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  Travel
                </span>
                <select
                  className="tb-input"
                  onChange={(event) => setSelectedTravel(event.target.value as TravelFilter)}
                  value={selectedTravel}
                >
                  <option value="any">Any distance</option>
                  <option value="within30">Within 30 min</option>
                  <option value="flexible">Flexible</option>
                </select>
              </label>
              <div className="flex items-end">
                <Button
                  className="min-h-[50px]"
                  onClick={() => {
                    setActiveFilter('all')
                    setSelectedCuisine('all')
                    setSelectedSubregion('all')
                    setSelectedTravel('any')
                    setSortBy('match')
                  }}
                  variant="ghost"
                >
                  Reset filters
                </Button>
              </div>
            </div>
          </section>

          {groupedEvents.needsFeedback.length > 0 ? (
            <section className="rounded-xl border border-[color:var(--accent-border)] bg-[color:var(--accent-softer)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                    Feedback due
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">
                    {groupedEvents.needsFeedback.length === 1
                      ? `${groupedEvents.needsFeedback[0]!.title} has ended. Leave feedback while it is fresh.`
                      : `${groupedEvents.needsFeedback.length} past tables need your feedback.`}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const event = groupedEvents.needsFeedback[0]!
                    setSelectedEventId(event.id)
                    setFeedbackDraft(toFeedbackDraft(event))
                  }}
                >
                  Leave feedback
                </Button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-5">
            {groupedEvents.active.length > 0 ? (
              groupedEvents.active.map((event) => (
                <EventCard
                  event={event}
                  eventActionLoadingId={eventActionLoadingId}
                  highlighted={
                    (highlightedRestaurantId ?? selectedRestaurantId) !== null &&
                    findRestaurantIdForEvent(event) ===
                      (highlightedRestaurantId ?? selectedRestaurantId)
                  }
                  key={event.id}
                  onHighlightChange={(eventId) => {
                    const highlightedEvent =
                      eventId === null
                        ? null
                        : visibleEvents.find((candidate) => candidate.id === eventId) ?? null
                    setHighlightedRestaurantId(
                      highlightedEvent ? findRestaurantIdForEvent(highlightedEvent) : null
                    )
                  }}
                  onOpenDetails={() => {
                    setSelectedEventId(event.id)
                    setFeedbackDraft(toFeedbackDraft(event))
                  }}
                  onSetEventSignup={(action) => {
                    if (action === 'join') {
                      setPendingJoinEventId(event.id)
                      return
                    }

                    void handleEventSignup(event.id, action)
                  }}
                />
              ))
            ) : (
              <EmptyState
                action={
                  groupedEvents.activeTotal > 0 ? (
                    <Button
                      onClick={() => {
                        setActiveFilter('all')
                        setSelectedCuisine('all')
                        setSelectedSubregion('all')
                        setSelectedTravel('any')
                        setSortBy('match')
                      }}
                      variant="secondary"
                    >
                      Reset filters
                    </Button>
                  ) : (
                    <Button href="/restaurants">
                      Save a restaurant
                    </Button>
                  )
                }
                description={
                  groupedEvents.activeTotal > 0
                    ? 'Try widening cuisine, area or table status.'
                    : "Keep saving places you'd actually attend. When a saved venue opens a table that fits your taste, you'll see it here first."
                }
                title={groupedEvents.activeTotal > 0 ? 'No tables match these filters' : 'No events at your saved venues yet'}
              />
            )}
          </div>

          {groupedEvents.active.length === 1 ? (
            <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-5 py-4 text-sm text-[color:var(--text-secondary)] shadow-[0_18px_44px_rgba(74,31,20,0.05)]">
              More live tables from your saved venues will appear here.
            </section>
          ) : null}

          {groupedEvents.past.length > 0 ? (
            <details className="group rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[color:var(--foreground)] marker:hidden">
                <span>
                  Past events
                  {groupedEvents.needsFeedback.length > 0 ? (
                    <span className="ml-2 rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {groupedEvents.needsFeedback.length} feedback due
                    </span>
                  ) : null}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)] group-open:hidden">
                  Show
                </span>
                <span className="hidden text-xs uppercase tracking-[0.14em] text-[color:var(--text-muted)] group-open:inline">
                  Hide
                </span>
              </summary>
              <div className="mt-5 grid gap-5">
                {groupedEvents.past.map((event) => (
                  <EventCard
                    event={event}
                    eventActionLoadingId={eventActionLoadingId}
                    highlighted={
                      (highlightedRestaurantId ?? selectedRestaurantId) !== null &&
                      findRestaurantIdForEvent(event) ===
                        (highlightedRestaurantId ?? selectedRestaurantId)
                    }
                    key={event.id}
                    onHighlightChange={(eventId) => {
                      const highlightedEvent =
                        eventId === null
                          ? null
                          : visibleEvents.find((candidate) => candidate.id === eventId) ?? null
                      setHighlightedRestaurantId(
                        highlightedEvent ? findRestaurantIdForEvent(highlightedEvent) : null
                      )
                    }}
                    onOpenDetails={() => {
                      setSelectedEventId(event.id)
                      setFeedbackDraft(toFeedbackDraft(event))
                    }}
                    onSetEventSignup={(action) => {
                      if (action === 'join') {
                        setPendingJoinEventId(event.id)
                        return
                      }

                      void handleEventSignup(event.id, action)
                    }}
                  />
                ))}
              </div>
            </details>
          ) : null}
        </div>

        <ActivityRail
          mapAnchorId="events-map"
          mapLegendMode="live-only"
          mapPrimaryActionLabel="Open table"
          mapRestaurants={mapRestaurants}
          notifications={notifications}
          onExpandedSelectRestaurant={handleSelectRestaurantFromMap}
          onHighlightRestaurant={setHighlightedRestaurantId}
          onInlineSelectRestaurant={handleSelectRestaurantFromMap}
          onSelectRestaurant={handleSelectRestaurantFromMap}
          restaurants={savedRestaurants}
          selectedRestaurantId={selectedRestaurantId}
          userLocation={userMapLocation}
        />
      </div>

      {selectedEvent ? (
        <EventDetailsModal
          event={selectedEvent}
          eventActionLoadingId={eventActionLoadingId}
          feedbackSavingId={feedbackSavingId}
          onClose={() => {
            setSelectedEventId(null)
            setFeedbackDraft(null)
          }}
          onFeedbackDraftChange={setFeedbackDraft}
          onSelectSimilarEvent={(eventId) => {
            const nextEvent = visibleEvents.find((event) => event.id === eventId) ?? null
            setSelectedEventId(eventId)
            setFeedbackDraft(nextEvent ? toFeedbackDraft(nextEvent) : null)
          }}
          onSetDayOfConfirmation={(action) => void handleDayOfConfirmation(selectedEvent.id, action)}
          onSetEventSignup={(action) => {
            if (action === 'join') {
              setPendingJoinEventId(selectedEvent.id)
              return
            }

            void handleEventSignup(selectedEvent.id, action)
          }}
          onSubmitFeedback={() => void handleFeedbackSubmit(selectedEvent.id)}
          similarEvents={similarEvents}
          {...(feedbackDraft ? { feedbackDraft } : {})}
        />
      ) : null}

      {pendingJoinEvent ? (
        <EventJoinConfirmModal
          event={pendingJoinEvent}
          loading={eventActionLoadingId === pendingJoinEvent.id}
          onCancel={() => setPendingJoinEventId(null)}
          onConfirm={() => {
            void handleEventSignup(pendingJoinEvent.id, 'join')
            setPendingJoinEventId(null)
          }}
        />
      ) : null}
    </AppShell>
  )
}
