'use client'

import { Button } from '@/components/app/Button'
import { ModalShell } from '@/components/app/ModalShell'
import { SavedSpotsMap } from '@/components/app/SavedSpotsMap'
import { formatRestaurantLocationLine } from '@/lib/app/format'
import type { DashboardRestaurant } from '@/lib/app/types'

export function MapViewModal({
  includeUserLocationInBounds = true,
  highlightedRestaurantId,
  onClose,
  onHighlightRestaurant,
  onPreviewRestaurant,
  onSelectRestaurant,
  previewActionLabel = 'Open details',
  previewedRestaurantId,
  restaurants,
  selectedRestaurantId,
  showUserMarker = true,
  title,
  userLocation,
}: {
  includeUserLocationInBounds?: boolean
  highlightedRestaurantId?: number | null
  onClose: () => void
  onHighlightRestaurant?: (restaurantId: number | null) => void
  onPreviewRestaurant?: (restaurantId: number | null) => void
  onSelectRestaurant: (restaurantId: number | null) => void
  previewActionLabel?: string
  previewedRestaurantId?: number | null
  restaurants: DashboardRestaurant[]
  selectedRestaurantId?: number | null
  showUserMarker?: boolean
  title: string
  userLocation: { lat: number; lng: number } | null
}) {
  const previewedRestaurant =
    restaurants.find((restaurant) => restaurant.id === previewedRestaurantId) ??
    restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ??
    null
  const liveTableCount = restaurants.reduce(
    (count, restaurant) => count + Math.max(0, restaurant.availableEventCount),
    0
  )
  const savedCount = restaurants.filter((restaurant) => restaurant.isSaved).length

  return (
    <ModalShell className="max-w-7xl" onClose={onClose}>
      {({ requestClose }) => (
        <div className="overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_30px_90px_rgba(20,20,20,0.28)]">
          <div className="border-b border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,246,233,0.92)_0%,rgba(255,255,255,0.98)_100%)] px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                  Map view
                </p>
                <h2 className="mt-1 text-[2rem] font-semibold leading-none text-[color:var(--foreground)]">
                  {title}
                </h2>
              </div>
              <button
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-5 py-2.5 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--border-strong)] hover:bg-white"
                onClick={requestClose}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--status-strong)]" />
                {savedCount} saved venue{savedCount === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-border)] bg-[color:var(--match-bg)] px-3 py-1.5 text-xs font-semibold text-[color:var(--match-text)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                {liveTableCount} live table{liveTableCount === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">
                Click a pin to inspect a venue
              </span>
            </div>
          </div>
          <div className="grid min-h-[72vh] gap-0 lg:grid-cols-[minmax(0,1.55fr)_26rem]">
            <div className="relative bg-[color:var(--surface-soft)]">
              <div className="pointer-events-none absolute left-5 top-5 z-[1]">
                <div className="rounded-2xl border border-white/75 bg-white/90 px-4 py-3 shadow-[0_18px_36px_rgba(11,19,36,0.12)] backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    Saved venue spread
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--foreground)]">
                    Compare where your watched spots actually cluster
                  </p>
                </div>
              </div>
              <SavedSpotsMap
                className="min-h-[60vh] rounded-none border-0 lg:min-h-[72vh]"
                includeUserLocationInBounds={includeUserLocationInBounds}
                markerClickMode="preview"
                restaurants={restaurants}
                showUserMarker={showUserMarker}
                showInlinePreviewCard={false}
                userLocation={userLocation}
                {...(highlightedRestaurantId !== undefined
                  ? { highlightedRestaurantId }
                  : {})}
                {...(onHighlightRestaurant ? { onHighlightRestaurant } : {})}
                {...(onPreviewRestaurant ? { onPreviewRestaurant } : {})}
                {...(previewedRestaurantId !== undefined ? { previewedRestaurantId } : {})}
                {...(selectedRestaurantId !== undefined ? { selectedRestaurantId } : {})}
              />
            </div>
            <aside className="flex flex-col border-t border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,250,246,1)_0%,rgba(255,246,233,0.88)_100%)] lg:border-l lg:border-t-0">
              <div className="border-b border-[color:var(--border-soft)] px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                  Venue preview
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                  Inspect the pin here first, then jump into the full venue flow when it is worth opening.
                </p>
              </div>
              <div className="flex flex-1 flex-col px-6 py-6">
                {previewedRestaurant ? (
                  <>
                    <div className="rounded-[1.75rem] border border-[color:var(--border-soft)] bg-white px-5 py-5 shadow-[0_18px_36px_rgba(11,19,36,0.06)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                            Selected venue
                          </p>
                          <h3 className="mt-2 text-[2rem] font-semibold leading-tight text-[color:var(--foreground)]">
                            {previewedRestaurant.name}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                            {formatRestaurantLocationLine({
                              distanceKm: previewedRestaurant.venueDistanceKm,
                              neighbourhood: previewedRestaurant.neighbourhood,
                              subregion: previewedRestaurant.subregion,
                            })}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[color:var(--status-bg)] bg-[color:var(--status-bg)] px-3 py-1.5 text-xs font-semibold text-[color:var(--status-text)]">
                          {previewedRestaurant.isSaved ? 'Watching' : 'Match'}
                        </span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[color:var(--match-bg)] px-3 py-1.5 text-xs font-semibold text-[color:var(--match-text)]">
                          {previewedRestaurant.matchScore}% match
                        </span>
                        {previewedRestaurant.googleRating !== null ? (
                          <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]">
                            {previewedRestaurant.googleRating.toFixed(1)} rating
                          </span>
                        ) : null}
                        <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]">
                          {previewedRestaurant.availableEventCount > 0
                            ? `${previewedRestaurant.availableEventCount} live table${previewedRestaurant.availableEventCount === 1 ? '' : 's'}`
                            : 'No live tables'}
                        </span>
                        {previewedRestaurant.restaurant_cuisines?.[0] ? (
                          <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]">
                            {previewedRestaurant.restaurant_cuisines[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-5 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-white/80 px-5 py-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                        Why this works
                      </p>
                      <p className="mt-3 text-sm leading-8 text-[color:var(--text-secondary)]">
                        {previewedRestaurant.venueMatchSummary}
                      </p>
                    </div>
                    {previewedRestaurant.topMatchFactors.length > 0 ? (
                      <div className="mt-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                          Match factors
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {previewedRestaurant.topMatchFactors.slice(0, 4).map((factor) => (
                            <span
                              className="rounded-full border border-[color:var(--border-soft)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] shadow-[0_8px_18px_rgba(11,19,36,0.04)]"
                              key={factor}
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-auto space-y-3 pt-6">
                      <Button className="w-full shadow-[0_16px_34px_rgba(242,169,0,0.28)]" onClick={() => onSelectRestaurant(previewedRestaurant.id)}>
                        {previewActionLabel}
                      </Button>
                      {previewedRestaurant.googleMapsUri ? (
                        <Button
                          className="w-full bg-white"
                          href={previewedRestaurant.googleMapsUri}
                          target="_blank"
                          variant="secondary"
                        >
                          Open in Google Maps
                        </Button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-[color:var(--border-soft)] bg-white px-6 text-center shadow-[0_18px_36px_rgba(11,19,36,0.04)]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--match-bg)] text-[color:var(--match-text)]">
                      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z" />
                        <path d="M12 10.5h.01" />
                      </svg>
                    </div>
                    <p className="mt-5 text-lg font-semibold text-[color:var(--foreground)]">
                      Pick a venue on the map
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-[color:var(--text-secondary)]">
                      Use the map to compare your watched venues, then inspect one in detail here.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
