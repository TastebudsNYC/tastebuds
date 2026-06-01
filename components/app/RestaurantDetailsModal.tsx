'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/app/Button'
import { ModalShell } from '@/components/app/ModalShell'
import { VenuePhotoCarousel } from '@/components/app/VenuePhotoCarousel'
import { formatGooglePriceLevel } from '@/lib/app/format'
import type { DashboardRestaurant } from '@/lib/app/types'
import type { GooglePlacePhotoResult } from '@/lib/google-places'

type RestaurantDetailsResponse = {
  details?: {
    editorialSummary: string | null
    formattedAddress: string | null
    googleMapsUri: string | null
    id: string
    latitude: number | null
    longitude: number | null
    name: string | null
    openNow: boolean | null
    openingHours: string[]
    phoneNumber: string | null
    photoAuthorName: string | null
    photoUri: string | null
    photos: GooglePlacePhotoResult[]
    priceLevel: string | null
    rating: number | null
    userRatingCount: number | null
    websiteUri: string | null
  }
  error?: string
}

function getFallbackSubtitle(restaurant: DashboardRestaurant) {
  return `${restaurant.restaurant_cuisines?.[0] ?? 'Restaurant'} in ${restaurant.subregion}${
    restaurant.neighbourhood ? `, ${restaurant.neighbourhood}` : ''
  }`
}

export function RestaurantDetailsModal({
  onClose,
  onToggleSaved,
  restaurant,
  saving,
  showEventsAction = true,
}: {
  onClose: () => void
  onToggleSaved?: (restaurantId: number, action: 'save' | 'unsave') => void
  restaurant: DashboardRestaurant
  saving?: boolean
  showEventsAction?: boolean
}) {
  const [loading, setLoading] = useState(Boolean(restaurant.googlePlaceId))
  const [error, setError] = useState('')
  const [details, setDetails] = useState<RestaurantDetailsResponse['details'] | null>(null)

  useEffect(() => {
    let active = true

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeydown)

    async function loadDetails() {
      if (!restaurant.googlePlaceId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `/api/restaurant-details/${encodeURIComponent(restaurant.googlePlaceId)}`
        )
        const payload = (await response.json()) as RestaurantDetailsResponse

        if (!active) {
          return
        }

        if (!response.ok || payload.error) {
          setError(payload.error ?? 'Could not load restaurant details.')
          setLoading(false)
          return
        }

        setDetails(payload.details ?? null)
        setLoading(false)
      } catch (nextError) {
        if (!active) {
          return
        }

        setError(nextError instanceof Error ? nextError.message : 'Could not load restaurant details.')
        setLoading(false)
      }
    }

    void loadDetails()

    return () => {
      active = false
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [onClose, restaurant.googlePlaceId])

  const rating = details?.rating ?? restaurant.googleRating
  const userRatingsTotal = details?.userRatingCount ?? restaurant.googleUserRatingsTotal
  const mapsUri = details?.googleMapsUri ?? restaurant.googleMapsUri
  const websiteUri = details?.websiteUri ?? restaurant.googleWebsiteUri
  const address = details?.formattedAddress ?? restaurant.formattedAddress
  const summary =
    details?.editorialSummary ?? restaurant.googleEditorialSummary ?? restaurant.venueMatchSummary
  const photos = details?.photos ?? []
  const priceLevel = formatGooglePriceLevel(details?.priceLevel ?? restaurant.googlePriceLevel)
  const subtitle = getFallbackSubtitle(restaurant)
  const eventsHref =
    restaurant.availableEventCount > 0
      ? `/events${restaurant.googlePlaceId ? `?place=${encodeURIComponent(restaurant.googlePlaceId)}` : ''}`
      : null

  return (
    <ModalShell align="center" className="max-w-5xl" onClose={onClose}>
      {({ requestClose }) => (
      <div className="max-h-[90vh] w-full overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_rgba(20,20,20,0.28)]">
        <div className="grid max-h-[90vh] overflow-y-auto md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-80 bg-[color:var(--surface-soft)]">
            <VenuePhotoCarousel
              alt={restaurant.name}
              attributionClassName="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white"
              emptyState={
                <div className="flex h-full items-center justify-center px-8 text-center text-sm text-[color:var(--text-muted)]">
                  No Google photo available for this restaurant yet.
                </div>
              }
              imageClassName="h-full w-full object-cover"
              photos={photos}
            />
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                  Restaurant details
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--foreground)]">
                  {restaurant.name}
                </h2>
                <p className="mt-2 text-base text-[color:var(--text-muted)]">{subtitle}</p>
              </div>
              <button
                aria-label="Close restaurant details"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-xl text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]"
                onClick={requestClose}
                type="button"
              >
                x
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {rating !== null ? (
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--accent-strong)]">
                  {rating.toFixed(1)}
                  {userRatingsTotal ? ` on Google (${userRatingsTotal} reviews)` : ' on Google'}
                </span>
              ) : null}
              {details?.openNow !== null && details?.openNow !== undefined ? (
                <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--status-text)]">
                  {details.openNow ? 'Open now' : 'Closed now'}
                </span>
              ) : null}
              {priceLevel ? (
                <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--foreground)]">
                  {priceLevel}
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="mt-6 space-y-3">
                <div className="tb-skeleton h-4 w-36 rounded-full" />
                <div className="tb-skeleton h-4 w-full rounded-full" />
                <div className="tb-skeleton h-4 w-5/6 rounded-full" />
              </div>
            ) : null}
            {error ? (
              <p className="mt-6 rounded-[1.25rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-softer)] p-4 text-sm text-[color:var(--accent-strong)]">
                {error}
              </p>
            ) : null}

            <div className="mt-6 space-y-5 text-sm leading-7 text-[color:var(--foreground)]">
              {summary ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    Overview
                  </p>
                  <p className="mt-2 text-base leading-7">{summary}</p>
                </div>
              ) : null}

              {address ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    Address
                  </p>
                  <p className="mt-2">{address}</p>
                </div>
              ) : null}

              {details?.phoneNumber ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    Phone
                  </p>
                  <p className="mt-2">{details.phoneNumber}</p>
                </div>
              ) : null}

              {details?.openingHours?.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    Opening hours
                  </p>
                  <div className="mt-2 space-y-1">
                    {details.openingHours.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {onToggleSaved ? (
                <Button
                  disabled={saving}
                  onClick={() => onToggleSaved(restaurant.id, restaurant.isSaved ? 'unsave' : 'save')}
                  variant={restaurant.isSaved ? 'secondary' : 'primary'}
                >
                  {saving ? 'Updating...' : restaurant.isSaved ? 'Unsave' : 'Save restaurant'}
                </Button>
              ) : null}
              {showEventsAction && eventsHref ? (
                <Button href={eventsHref} variant="secondary">
                  See events
                </Button>
              ) : null}
              {mapsUri ? (
                <Button href={mapsUri} target="_blank" variant="secondary">
                  Open in Google Maps
                </Button>
              ) : null}
              {websiteUri ? (
                <Button href={websiteUri} target="_blank" variant="secondary">
                  Website
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      )}
    </ModalShell>
  )
}
