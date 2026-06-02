'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { HomeEventTile } from '@/components/app/HomeEventTile'
import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { MapViewModal } from '@/components/app/MapViewModal'
import { RestaurantDetailsModal } from '@/components/app/RestaurantDetailsModal'
import { SavedSpotsMap } from '@/components/app/SavedSpotsMap'
import { SavedRestaurantTile } from '@/components/app/SavedRestaurantTile'
import {
  fetchEvents,
  fetchNotifications,
  fetchRestaurants,
  getAppBootstrap,
  logout,
} from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'
import type { DashboardEvent, DashboardRestaurant, NotificationSummary, Profile } from '@/lib/app/types'

function compactList(values: string[] | null | undefined, fallback: string[]) {
  const cleaned = values?.filter(Boolean) ?? []
  return cleaned.length > 0 ? cleaned.slice(0, 3) : fallback
}

function TasteIcon({ type }: { type: 'availability' | 'cuisine' | 'location' | 'mood' }) {
  const paths = {
    availability: (
      <>
        <path d="M7 3v3M17 3v3M4.5 9.5h15" />
        <path d="M5.5 5.5h13v14h-13z" />
        <path d="M8 13h2M14 13h2M8 16h2" />
      </>
    ),
    cuisine: (
      <>
        <path d="M6 3v18M4 3v6a2 2 0 0 0 4 0V3M14 3v18" />
        <path d="M14 3c3 1 4.5 3.5 4.5 7 0 2.5-1.2 4-4.5 4" />
      </>
    ),
    location: (
      <>
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
        <path d="M12 10.5h.01" />
      </>
    ),
    mood: (
      <>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M8.5 10h.01M15.5 10h.01M8.5 14c1.8 2 5.2 2 7 0" />
      </>
    ),
  } as const

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-[color:var(--text-secondary)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[type]}
    </svg>
  )
}

function StatusIcon({ type }: { type: 'events' | 'saved' | 'updates' | 'watched' }) {
  const paths = {
    events: (
      <>
        <path d="M5 12a7 7 0 0 1 14 0" />
        <path d="M8.5 12a3.5 3.5 0 0 1 7 0" />
        <path d="M12 12h.01" />
        <path d="M4 16.5h16" />
      </>
    ),
    saved: <path d="M7 4.5h10v16l-5-3-5 3z" />,
    updates: (
      <>
        <path d="M6 8.75a6.25 6.25 0 0 1 12.5 0v3.65l1.75 3.1H3.75l1.75-3.1V8.75Z" />
        <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
      </>
    ),
    watched: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </>
    ),
  } as const

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6 text-[color:var(--text-secondary)]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[type]}
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [restaurants, setRestaurants] = useState<DashboardRestaurant[]>([])
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<DashboardRestaurant | null>(null)
  const [previewedRestaurantId, setPreviewedRestaurantId] = useState<number | null>(null)
  const [isDashboardMapOpen, setIsDashboardMapOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupError, setSetupError] = useState('')

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        const bootstrap = await getAppBootstrap()

        if (!active) {
          return
        }

        if (!isProfileComplete(bootstrap.profile)) {
          router.replace('/onboarding')
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

        if (eventsPayload.onboardingRequired || restaurantsPayload.onboardingRequired) {
          router.replace('/onboarding')
          return
        }

        if (notificationResponse.error) {
          setSetupError(notificationResponse.error.message)
          setLoading(false)
          return
        }

        setNotifications(notificationResponse.data ?? [])
        setEvents(eventsPayload.events ?? [])
        setRestaurants(restaurantsPayload.restaurants ?? [])
        setProfile(bootstrap.profile)
        setLoading(false)
      } catch (error) {
        setSetupError(error instanceof Error ? error.message : 'Could not load dashboard.')
        setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [router])

  const allSavedRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.isSaved),
    [restaurants]
  )
  const savedRestaurants = useMemo(
    () => allSavedRestaurants.slice(0, 3),
    [allSavedRestaurants]
  )

  const savedRestaurantKeys = useMemo(
    () =>
      new Set(
        allSavedRestaurants.map((restaurant) =>
          restaurant.googlePlaceId
            ? `place:${restaurant.googlePlaceId}`
            : `name:${restaurant.name.toLowerCase()}::${restaurant.subregion.toLowerCase()}`
        )
      ),
    [allSavedRestaurants]
  )

  const displayEvents = useMemo(
    () =>
      events
        .filter((event) => {
          if (event.hasEnded) {
            return false
          }

          const placeKey = event.restaurantGooglePlaceId
            ? `place:${event.restaurantGooglePlaceId}`
            : null
          const fallbackKey = `name:${event.restaurant_name.toLowerCase()}::${event.restaurant_subregion.toLowerCase()}`

          return (placeKey !== null && savedRestaurantKeys.has(placeKey)) || savedRestaurantKeys.has(fallbackKey)
        })
        .slice(0, 4),
    [events, savedRestaurantKeys]
  )
  const liveEvents = useMemo(
    () =>
      displayEvents.filter(
        (event) => event.status === 'open' && event.spotsLeft > 0 && !event.hasEnded
      ),
    [displayEvents]
  )
  const watchedRestaurants = useMemo(
    () => allSavedRestaurants,
    [allSavedRestaurants]
  )
  const tasteSetting = compactList(profile?.preferred_setting, ['Bar', 'Lounge', 'Restaurant'])
  const tasteWhen = ['Evenings', 'Weekends']
  const tasteLocation = profile?.neighbourhood ?? profile?.subregion ?? 'Midtown'
  const tasteSummary = `${compactList(profile?.preferred_vibes ?? profile?.preferred_scene, [
    'Casual',
    'Social',
  ])
    .slice(0, 2)
    .join(', ')} and ${tasteLocation}-led.`
  const userMapLocation =
    profile?.home_latitude !== null &&
    profile?.home_latitude !== undefined &&
    profile.home_longitude !== null &&
    profile.home_longitude !== undefined
      ? { lat: profile.home_latitude, lng: profile.home_longitude }
      : null
  const unreadNotificationCount = notifications.filter((item) => !item.read_at).length
  const activeRestaurantId =
    selectedRestaurantId && allSavedRestaurants.some((restaurant) => restaurant.id === selectedRestaurantId)
      ? selectedRestaurantId
      : null
  const watchedVenueSummary = `${allSavedRestaurants.length} venue${allSavedRestaurants.length === 1 ? ' is' : 's are'} being watched for hosted tables.`

  if (loading) {
    return <AppPageSkeleton currentPath="/dashboard" title="Dashboard" variant="dashboard" />
  }

  if (setupError) {
    return (
      <AppShell
        currentPath="/dashboard"
        onLogout={handleLogout}
        profile={profile}
        unreadCount={unreadNotificationCount}
      >
        <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">Couldn&apos;t load your dashboard</h1>
          <p className="mt-4 max-w-2xl text-base text-[color:var(--text-secondary)]">{setupError}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/" variant="secondary">
              Back to home
            </Button>
            <Button onClick={() => void handleLogout()}>
              Log out
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      currentPath="/dashboard"
      onLogout={handleLogout}
      profile={profile}
      showFooter={false}
      unreadCount={unreadNotificationCount}
      wide
    >
        <div className="grid w-full gap-8 xl:grid-cols-[260px_minmax(520px,1fr)_320px]">
          <aside className="xl:sticky xl:top-28 xl:self-start xl:border-r xl:border-[color:var(--border-soft)] xl:pr-8">
            <details className="group border-y border-[color:var(--border-soft)] py-5 xl:block xl:border-t-0" open>
              <summary className="flex cursor-pointer list-none items-center justify-between xl:cursor-default">
                <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Your taste</h2>
                <span className="text-sm text-[color:var(--accent-strong)] group-open:hidden xl:hidden">Open</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{tasteSummary}</p>
              <div className="mt-7 space-y-6">
                {[
                  ['Cuisine', compactList(profile?.cuisine_preferences, ['Burgers', 'American', 'French']), 'cuisine'],
                  ['Vibe', compactList(profile?.preferred_vibes ?? profile?.preferred_scene, ['Chill', 'Social', 'Upscale']), 'mood'],
                  ['Setting', tasteSetting, 'availability'],
                  ['When', tasteWhen, 'availability'],
                  ['Location', [tasteLocation], 'location'],
                ].map(([label, values, icon]) => (
                  <div className="border-b border-[color:var(--border-soft)] pb-6 last:border-b-0" key={label as string}>
                    <div className="flex items-center gap-3">
                      <TasteIcon type={icon as 'availability' | 'cuisine' | 'location' | 'mood'} />
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{label as string}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(values as string[]).map((value) => (
                        <span
                          className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]"
                          key={value}
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <Button className="w-full" href="/profile" variant="secondary">
                  Edit taste profile
                </Button>
              </div>
            </details>
          </aside>

          <div className="min-w-0 space-y-8">
            <header className="border-b border-[color:var(--border-soft)] pb-5">
              <h1 className="max-w-4xl text-[2.45rem] font-black leading-[0.98] text-[color:var(--foreground)] sm:text-[3rem] 2xl:whitespace-nowrap">
                <span className="block xl:inline">Tables matched</span>
                <span className="block xl:inline"> to your taste</span>
              </h1>
              <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)]">
                {watchedVenueSummary}
              </p>
              <div className="mt-5 grid overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.07)] sm:grid-cols-4">
                {[
                  ['Saved venues', allSavedRestaurants.length, 'saved'],
                  ['Live events', liveEvents.length, 'events'],
                  ['Watched matches', watchedRestaurants.length, 'watched'],
                  ['Unread updates', unreadNotificationCount, 'updates'],
                ].map(([label, value, icon]) => (
                  <div className="flex items-center gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0" key={label as string}>
                    <StatusIcon type={icon as 'events' | 'saved' | 'updates' | 'watched'} />
                    <div>
                      <p className="text-xl font-semibold leading-none text-[color:var(--foreground)]">{value}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-secondary)]">{label as string}</p>
                    </div>
                  </div>
                ))}
              </div>
            </header>

            <section>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-2xl font-semibold leading-none text-[color:var(--foreground)]">
                  Events at your saved venues
                </h2>
                <Link className="text-sm font-semibold text-[color:var(--nav-bg)] hover:underline" href="/events">
                  Browse live events
                </Link>
              </div>

              {liveEvents.length > 0 ? (
                <div className="grid grid-cols-1 gap-5">
                  {liveEvents.map((event, index) => (
                    <HomeEventTile event={event} index={index} key={event.id} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-3 shadow-[0_12px_28px_rgba(74,31,20,0.045)] sm:px-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="hidden h-20 w-24 shrink-0 items-center justify-center md:flex">
                      <svg aria-hidden="true" className="h-20 w-24" fill="none" viewBox="0 0 128 116">
                        <circle cx="64" cy="62" fill="#FBFAF6" r="50" />
                        <g stroke="#D99000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                          <path d="M64 7v20" />
                          <path d="M53.5 38.5c1.2-8 19.8-8 21 0" />
                          <path d="M53 39h22l-4.5 8.5h-13L53 39Z" />
                          <path d="M31 57h19l2.5 34H34L31 57Z" />
                          <path d="M33 77c6 2 12 2 18 0" />
                          <path d="M36 91l-8 16M49 91l7 16" />
                          <path d="M97 57H78l-2.5 34H94L97 57Z" />
                          <path d="M95 77c-6 2-12 2-18 0" />
                          <path d="M92 91l8 16M79 91l-7 16" />
                          <path d="M49 75h30" />
                          <path d="M47 79h34" />
                          <path d="M64 79v28" />
                          <path d="M58 107h12" />
                        </g>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">No events at your saved venues yet</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
                        When a saved venue opens a table that fits your taste, you&apos;ll see it here first.
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[color:var(--status-text)]">
                        Your saved venues are being watched.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 md:flex-col">
                      <Button className="min-w-40" href="/restaurants" size="sm">Browse restaurants</Button>
                      <Button className="min-w-40" href="/profile" size="sm" variant="secondary">Edit taste profile</Button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold leading-none text-[color:var(--foreground)]">
                    Places you saved
                  </h2>
                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
                    Good starting points for your first Tastebuds plan.
                  </p>
                </div>
                <Link className="text-sm font-semibold text-[color:var(--nav-bg)] hover:underline" href="/restaurants">
                  Manage saved venues
                </Link>
              </div>

              <div className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.07)] [&>article:last-child>div]:border-b-0">
                {savedRestaurants.length > 0 ? (
                  savedRestaurants.map((restaurant, index) => (
                    <SavedRestaurantTile
                      active={restaurant.id === activeRestaurantId}
                      index={index}
                      key={restaurant.id}
                      onOpenDetails={() => setSelectedRestaurant(restaurant)}
                      onSelect={() => setSelectedRestaurantId(restaurant.id)}
                      restaurant={restaurant}
                    />
                  ))
                ) : (
                  <div className="py-6">
                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Start by saving a few places</h3>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      Pick restaurants you&apos;d actually say yes to, and we&apos;ll use them to shape better suggestions.
                    </p>
                    <div className="mt-4">
                      <Button href="/restaurants">Browse restaurants</Button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {allSavedRestaurants.length < 3 ? (
              <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-5 shadow-[0_12px_28px_rgba(74,31,20,0.05)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Want better matches?</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
                      Save more restaurants and we&apos;ll widen your event watchlist.
                    </p>
                  </div>
                  <Button className="shrink-0" href="/restaurants">
                    Browse restaurants
                  </Button>
                </div>
              </section>
            ) : null}

          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start xl:border-l xl:border-[color:var(--border-soft)] xl:pl-8">
            <section className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Nearby</h2>
                {savedRestaurants.length > 0 ? (
                  <button
                    className="text-xs font-semibold text-[color:var(--text-secondary)] hover:underline"
                    onClick={() => {
                      setPreviewedRestaurantId(activeRestaurantId ?? allSavedRestaurants[0]?.id ?? null)
                      setIsDashboardMapOpen(true)
                    }}
                    type="button"
                  >
                    Map view
                  </button>
                ) : null}
              </div>
              {savedRestaurants.length > 0 ? (
                <div className="[&>div]:min-h-[285px] [&>div]:rounded-none [&>div]:border-0">
                  <SavedSpotsMap
                    includeUserLocationInBounds={false}
                    onPreviewRestaurant={(restaurantId) => {
                      setPreviewedRestaurantId(restaurantId)
                      if (restaurantId !== null) {
                        setIsDashboardMapOpen(true)
                      }
                    }}
                    restaurants={allSavedRestaurants}
                    selectedRestaurantId={activeRestaurantId}
                    showUserMarker={false}
                    showInlinePreviewCard={false}
                  />
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center border-y border-[color:var(--border-soft)] px-6 text-center">
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">Your saved map will appear here</p>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">
                    Save a venue first, then compare nearby options.
                  </p>
                </div>
              )}
              <div className="flex gap-6 border-t border-[color:var(--border-soft)] px-4 py-3 text-xs font-semibold text-[color:var(--text-secondary)]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[color:var(--status-strong)]" />
                  Saved venues
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Watching</h2>
                <Link className="text-xs font-semibold text-[color:var(--text-secondary)] hover:underline" href="/restaurants">
                  View all ({watchedRestaurants.length})
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {watchedRestaurants.length > 0 ? (
                  watchedRestaurants.map((restaurant) => (
                    <div className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3" key={restaurant.id}>
                      <GooglePlacePhoto
                        alt={restaurant.name}
                        enableCarousel={false}
                        fallbackSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDCoHML1D-nS9Lpd8JQsgkHZQy7xiCa4Cx9EeNcbmIe5Kp0jdxofD_dVVn6Ze22xEPoZgJTuKre5B1fsb1Pbbme3gUS-P9eUKSbS3DQQs4TkPqXXH3lEx8hArTWwf3eLo4jmiZBqoc5svsyFDFqKkvvC_rj4reYIojqZPtWbKTLiBugXIwtxa9qGGkVZ1Qvn7lEgs5cvkJpPYEypfeu3_hwcW_FJI1Rnh9Ib_QPpp-r_W-cmqmkxuliA_xVq0jvZHb9l0FtG2aimNlH"
                        imageClassName="h-12 w-12 rounded object-cover"
                        placeId={restaurant.googlePlaceId}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[color:var(--foreground)]">{restaurant.name}</p>
                        <p className="text-xs leading-5 text-[color:var(--text-secondary)]">
                          You saved this - we&apos;ll tell you when a table opens.
                        </p>
                      </div>
                      <button
                        className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--nav-bg)]"
                        aria-label={`Show ${restaurant.name} on map`}
                        onClick={() => setSelectedRestaurantId(restaurant.id)}
                        type="button"
                      >
                        <StatusIcon type="saved" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                    No watched venues yet.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-[color:var(--nav-bg)] bg-[color:var(--nav-bg)] p-4 text-white shadow-[0_18px_44px_rgba(0,20,38,0.18)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Inbox</h2>
                <Link className="text-xs font-semibold text-[#f8dfba] hover:underline" href="/notifications">
                  View all
                </Link>
              </div>
              <div className="mt-6 flex items-start gap-4">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[color:var(--accent)]" />
                <div>
                  <p className="text-lg font-semibold text-[#f1a208]">
                    {unreadNotificationCount} unread update{unreadNotificationCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#f8dfba]">
                    Updates about your venues and matches.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button className="w-full rounded-md border-white/12 bg-white/8 text-white hover:bg-white/14" href="/notifications" variant="ghost">
                  Open inbox
                </Button>
              </div>
            </section>
          </aside>
        </div>

      {selectedRestaurant ? (
        <RestaurantDetailsModal
          onClose={() => setSelectedRestaurant(null)}
          restaurant={savedRestaurants.find((restaurant) => restaurant.id === selectedRestaurant.id) ?? selectedRestaurant}
        />
      ) : null}
      {isDashboardMapOpen && allSavedRestaurants.length > 0 ? (
        <MapViewModal
          includeUserLocationInBounds={false}
          onClose={() => setIsDashboardMapOpen(false)}
          onPreviewRestaurant={setPreviewedRestaurantId}
          onSelectRestaurant={(restaurantId) => {
            if (restaurantId === null) {
              return
            }

            const match = allSavedRestaurants.find((restaurant) => restaurant.id === restaurantId)
            if (match) {
              setSelectedRestaurantId(restaurantId)
              setSelectedRestaurant(match)
              setIsDashboardMapOpen(false)
            }
          }}
          previewActionLabel="Open venue"
          previewedRestaurantId={previewedRestaurantId}
          restaurants={allSavedRestaurants}
          {...(activeRestaurantId !== null ? { selectedRestaurantId: activeRestaurantId } : {})}
          showUserMarker={false}
          title="Saved venues nearby"
          userLocation={null}
        />
      ) : null}
    </AppShell>
  )
}
