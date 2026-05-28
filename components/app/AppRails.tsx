'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { AnimatedNumber } from '@/components/app/AnimatedNumber'
import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { MapViewModal } from '@/components/app/MapViewModal'
import { SavedSpotsMap } from '@/components/app/SavedSpotsMap'
import type { DashboardRestaurant, NotificationSummary, Profile } from '@/lib/app/types'

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

function StatusIcon({ type }: { type: 'saved' | 'updates' }) {
  const paths = {
    saved: <path d="M7 4.5h10v16l-5-3-5 3z" />,
    updates: (
      <>
        <path d="M6 8.75a6.25 6.25 0 0 1 12.5 0v3.65l1.75 3.1H3.75l1.75-3.1V8.75Z" />
        <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
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

const WATCHING_FALLBACK_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCoHML1D-nS9Lpd8JQsgkHZQy7xiCa4Cx9EeNcbmIe5Kp0jdxofD_dVVn6Ze22xEPoZgJTuKre5B1fsb1Pbbme3gUS-P9eUKSbS3DQQs4TkPqXXH3lEx8hArTWwf3eLo4jmiZBqoc5svsyFDFqKkvvC_rj4reYIojqZPtWbKTLiBugXIwtxa9qGGkVZ1Qvn7lEgs5cvkJpPYEypfeu3_hwcW_FJI1Rnh9Ib_QPpp-r_W-cmqmkxuliA_xVq0jvZHb9l0FtG2aimNlH'

export function TasteProfileRail({ profile }: { profile: Profile | null }) {
  const tasteSetting = compactList(profile?.preferred_setting, ['Bar', 'Lounge', 'Restaurant'])
  const tasteWhen = ['Evenings', 'Weekends']
  const tasteLocation = profile?.neighbourhood ?? profile?.subregion ?? 'Midtown'
  const tasteSummary = `${compactList(profile?.preferred_vibes ?? profile?.preferred_scene, [
    'Casual',
    'Social',
  ])
    .slice(0, 2)
    .join(', ')} and ${tasteLocation}-led.`

  return (
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
  )
}

export function ActivityRail({
  highlightedRestaurantId,
  mapAnchorId = 'activity-map',
  mapLegendMode = 'all',
  mapPrimaryActionLabel = 'Open details',
  mapRestaurants,
  onExpandedSelectRestaurant,
  notifications,
  onHighlightRestaurant,
  onInlineSelectRestaurant,
  onSelectRestaurant,
  restaurants,
  selectedRestaurantId,
  showWatching = true,
  userLocation,
}: {
  highlightedRestaurantId?: number | null
  mapAnchorId?: string
  mapLegendMode?: 'all' | 'live-only'
  mapPrimaryActionLabel?: string
  mapRestaurants?: DashboardRestaurant[]
  onExpandedSelectRestaurant?: (restaurantId: number | null) => void
  notifications: NotificationSummary[]
  onHighlightRestaurant?: (restaurantId: number | null) => void
  onInlineSelectRestaurant?: (restaurantId: number | null) => void
  onSelectRestaurant: (restaurantId: number | null) => void
  restaurants: DashboardRestaurant[]
  selectedRestaurantId: number | null
  showWatching?: boolean
  userLocation: { lat: number; lng: number } | null
}) {
  const unreadNotificationCount = notifications.filter((item) => !item.read_at).length
  const previousRestaurantIdsRef = useRef<number[]>(restaurants.map((restaurant) => restaurant.id))
  const previousUnreadRef = useRef(unreadNotificationCount)
  const [freshRestaurantIds, setFreshRestaurantIds] = useState<number[]>([])
  const [expandedPreviewRestaurantId, setExpandedPreviewRestaurantId] = useState<number | null>(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [pulseUnreadDot, setPulseUnreadDot] = useState(false)
  const displayedMapRestaurants = mapRestaurants ?? restaurants

  useEffect(() => {
    const previousIds = previousRestaurantIdsRef.current
    const nextIds = restaurants.map((restaurant) => restaurant.id)
    const addedIds = nextIds.filter((id) => !previousIds.includes(id))

    previousRestaurantIdsRef.current = nextIds

    if (addedIds.length === 0) {
      return
    }

    setFreshRestaurantIds(addedIds)
    const timeoutId = window.setTimeout(() => setFreshRestaurantIds([]), 420)

    return () => window.clearTimeout(timeoutId)
  }, [restaurants])

  useEffect(() => {
    if (unreadNotificationCount <= previousUnreadRef.current) {
      previousUnreadRef.current = unreadNotificationCount
      return
    }

    previousUnreadRef.current = unreadNotificationCount
    setPulseUnreadDot(true)
    const timeoutId = window.setTimeout(() => setPulseUnreadDot(false), 380)

    return () => window.clearTimeout(timeoutId)
  }, [unreadNotificationCount])

  useEffect(() => {
    if (!isMapOpen) {
      return
    }

    setExpandedPreviewRestaurantId(highlightedRestaurantId ?? selectedRestaurantId ?? displayedMapRestaurants[0]?.id ?? null)
  }, [displayedMapRestaurants, highlightedRestaurantId, isMapOpen, selectedRestaurantId])

  return (
    <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start xl:border-l xl:border-[color:var(--border-soft)] xl:pl-8">
      <section className="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Nearby</h2>
          <button
            className="text-xs font-semibold text-[color:var(--text-secondary)] hover:underline"
            onClick={() => {
              setExpandedPreviewRestaurantId(
                highlightedRestaurantId ??
                  selectedRestaurantId ??
                  displayedMapRestaurants[0]?.id ??
                  null
              )
              setIsMapOpen(true)
            }}
            type="button"
          >
            Map view
          </button>
        </div>
        {displayedMapRestaurants.length > 0 ? (
          <div className="[&>div]:min-h-[285px] [&>div]:rounded-none [&>div]:border-0">
            <SavedSpotsMap
              id={mapAnchorId}
              className="min-h-[285px]"
              includeUserLocationInBounds={false}
              markerClickMode="preview"
              restaurants={displayedMapRestaurants}
              showUserMarker={false}
              showInlinePreviewCard={false}
              {...(highlightedRestaurantId !== undefined ? { highlightedRestaurantId } : {})}
              {...(onHighlightRestaurant ? { onHighlightRestaurant } : {})}
              onPreviewRestaurant={(restaurantId) => {
                setExpandedPreviewRestaurantId(restaurantId)
                if (restaurantId !== null) {
                  setIsMapOpen(true)
                }
              }}
              {...(selectedRestaurantId !== null ? { selectedRestaurantId } : {})}
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
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[color:var(--border-soft)] px-4 py-3 text-xs font-semibold text-[color:var(--text-secondary)]">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[color:var(--accent)]" />
            Live table
          </span>
          {mapLegendMode === 'all' ? (
            <>
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[color:var(--status-strong)]" />
                Watching
              </span>
              <span className="inline-flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[color:var(--nav-bg)]" />
                Match
              </span>
            </>
          ) : null}
        </div>
      </section>

      {showWatching ? (
        <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Watching</h2>
            <Link className="text-xs font-semibold text-[color:var(--text-secondary)] hover:underline" href="/restaurants">
              View all (<AnimatedNumber value={restaurants.length} />)
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {restaurants.length > 0 ? (
              restaurants.map((restaurant) => (
                <div
                  className={`grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 ${
                    freshRestaurantIds.includes(restaurant.id) ? 'tb-slide-fade-in' : ''
                  }`}
                  key={restaurant.id}
                >
                  <GooglePlacePhoto
                    alt={restaurant.name}
                    enableCarousel={false}
                    fallbackSrc={WATCHING_FALLBACK_IMAGE}
                    imageClassName="h-12 w-12 rounded object-cover"
                    placeId={restaurant.googlePlaceId}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--foreground)]">{restaurant.name}</p>
                    <p className="text-xs leading-5 text-[color:var(--status-text)]">
                      {restaurant.availableEventCount > 0 ? 'Live table available' : 'Watching'}
                    </p>
                  </div>
                  <button
                    aria-label={`Show ${restaurant.name} on map`}
                    className="shrink-0 text-[color:var(--text-secondary)] hover:text-[color:var(--nav-bg)]"
                    onClick={() => onSelectRestaurant(restaurant.id)}
                    type="button"
                  >
                    <StatusIcon type="saved" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[color:var(--text-secondary)]">No watched venues yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {unreadNotificationCount > 0 ? (
        <section className="rounded-xl border border-[color:var(--nav-bg)] bg-[color:var(--nav-bg)] p-4 text-white shadow-[0_18px_44px_rgba(0,20,38,0.18)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Inbox</h2>
            <Link className="text-xs font-semibold text-[color:var(--accent)] hover:underline" href="/notifications">
              View all
            </Link>
          </div>
          <div className="mt-6 flex items-start gap-4">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full bg-[color:var(--accent)] ${pulseUnreadDot ? 'tb-unread-pulse-once' : ''}`} />
            <div>
              <p className="text-lg font-semibold text-[color:var(--accent)]">
                <AnimatedNumber value={unreadNotificationCount} /> unread update{unreadNotificationCount === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#d8e2ec]">
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
      ) : (
        <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Inbox</h2>
            <Link className="text-xs font-semibold text-[color:var(--text-secondary)] hover:underline" href="/notifications">
              View all
            </Link>
          </div>
          <div className="mt-5">
            <p className="text-lg font-semibold text-[color:var(--foreground)]">No unread updates</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">You&apos;re up to date.</p>
          </div>
          <div className="mt-5">
            <Button className="w-full" href="/notifications" variant="secondary">
              Open inbox
            </Button>
          </div>
        </section>
      )}

      {isMapOpen ? (
        <MapViewModal
          includeUserLocationInBounds={false}
          onClose={() => setIsMapOpen(false)}
          onPreviewRestaurant={setExpandedPreviewRestaurantId}
          onSelectRestaurant={(restaurantId) => {
            ;(onExpandedSelectRestaurant ?? onSelectRestaurant)(restaurantId)

            if (restaurantId !== null) {
              setIsMapOpen(false)
            }
          }}
          previewActionLabel={mapPrimaryActionLabel}
          previewedRestaurantId={expandedPreviewRestaurantId}
          restaurants={displayedMapRestaurants}
          showUserMarker={false}
          title="Nearby matches"
          userLocation={null}
          {...((highlightedRestaurantId ?? selectedRestaurantId) !== null &&
          (highlightedRestaurantId ?? selectedRestaurantId) !== undefined
            ? { highlightedRestaurantId: highlightedRestaurantId ?? selectedRestaurantId }
            : {})}
          {...(onHighlightRestaurant ? { onHighlightRestaurant } : {})}
          {...(selectedRestaurantId !== null ? { selectedRestaurantId } : {})}
        />
      ) : null}
    </aside>
  )
}
