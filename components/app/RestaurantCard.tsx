import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { TasteTag } from '@/components/app/TasteTag'
import {
  cx,
  formatMatchScore,
  formatRestaurantLocationLine,
} from '@/lib/app/format'
import type { DashboardRestaurant } from '@/lib/app/types'

const RESTAURANT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCoHML1D-nS9Lpd8JQsgkHZQy7xiCa4Cx9EeNcbmIe5Kp0jdxofD_dVVn6Ze22xEPoZgJTuKre5B1fsb1Pbbme3gUS-P9eUKSbS3DQQs4TkPqXXH3lEx8hArTWwf3eLo4jmiZBqoc5svsyFDFqKkvvC_rj4reYIojqZPtWbKTLiBugXIwtxa9qGGkVZ1Qvn7lEgs5cvkJpPYEypfeu3_hwcW_FJI1Rnh9Ib_QPpp-r_W-cmqmkxuliA_xVq0jvZHb9l0FtG2aimNlH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAslHXH8KjoZPnFH9tLgGOz8rpffzYp31oJCQ03BpWAGdwlFuUFHoISTgdAoZH_NjW-csUz083j3OW2m7Eg3SuZatWjxorJGliozLUIdLQ8c8z6hpL2bj-HYYYYraZ1M28INpoA-BFsk74mlHt5pUxujHqONyF7wwIBG2LeEI48EBwtXkT82xYxLlx3ZfU9xA0fKFD9uG5VwLYImjp2Ds_E_MAAvem_kn52S1La_X3JIpw26-1BtApNmFDKsn5tXXeqRiG9EglOZ9X-',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANwT_OCTmuJC4naZhU3nuu-_tl7nhx6boXESOu4GLp5ZWE2QupS8HMNQ8yy0ZzGILo9KDGkmYrfwOLwnmf-PZa_KNHdtjFKXI3pdft5g3EDqysljfjWnmqJQWnFOECkd1pt8ssY2BZq9Y5OJu_J9oiPE-ORo3hrHoDFk9xM-r8zFq_WS3azkfo5wzdoYL0xRq9J7_gQ0fi_xMOec9JpOSZFaAFZtm5hw0wQLDQAfNvmSuc06elFW9SCXwRrjWPtLEmFN4LjA5o3yx8',
] as const

function getRestaurantImage(restaurant: DashboardRestaurant) {
  return RESTAURANT_IMAGES[restaurant.id % RESTAURANT_IMAGES.length] ?? RESTAURANT_IMAGES[0]!
}

function getSupportLine(restaurant: DashboardRestaurant) {
  const values = restaurant.topMatchFactors?.filter(Boolean) ?? []

  return values.length > 0
    ? `Match: ${values.map((value) => value.toLowerCase()).join(' / ')}`
    : 'Match: taste / budget / vibe'
}

function getStatusText(restaurant: DashboardRestaurant) {
  return restaurant.isSaved ? 'Saved and watching' : 'Not saved yet'
}

export function RestaurantCard({
  flashState,
  highlighted = false,
  onHighlightChange,
  onOpenDetails,
  onToggleSaved,
  restaurant,
  saving,
}: {
  flashState?: 'removed' | 'saved' | null
  highlighted?: boolean
  onHighlightChange?: (restaurantId: number | null) => void
  onOpenDetails?: (restaurant: DashboardRestaurant) => void
  onToggleSaved?: (restaurantId: number, action: 'save' | 'unsave') => void
  restaurant: DashboardRestaurant
  saving?: boolean
}) {
  const locationLine = formatRestaurantLocationLine({
    distanceKm: restaurant.venueDistanceKm,
    neighbourhood: restaurant.neighbourhood,
    subregion: restaurant.subregion,
  })
  const tags =
    restaurant.matchTags?.length > 0
      ? restaurant.matchTags
      : [restaurant.restaurant_cuisines?.[0], restaurant.subregion, restaurant.venue_price].filter(
          (value): value is string => Boolean(value)
        )
  const statusText = getStatusText(restaurant)
  const eventText =
    restaurant.availableEventCount > 0
      ? restaurant.availableEventCount === 1
        ? 'Live table available'
        : 'Live tables available'
      : 'No live tables yet'

  return (
    <article
      className={cx(
        'group overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.07)] tb-card-interactive',
        highlighted ? 'border-[color:var(--accent-border)] shadow-[0_22px_50px_rgba(255,193,67,0.18)]' : '',
        flashState === 'saved' ? 'tb-card-flash' : ''
      )}
      onMouseEnter={() => onHighlightChange?.(restaurant.id)}
      onMouseLeave={() => onHighlightChange?.(null)}
    >
      <div className="grid gap-0 xl:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative min-h-[180px] overflow-hidden xl:min-h-full">
          <GooglePlacePhoto
            alt={restaurant.name}
            attributionClassName="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white"
            enableCarousel={false}
            fallbackSrc={getRestaurantImage(restaurant)}
            imageClassName="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            placeId={restaurant.googlePlaceId}
          />
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px] xl:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-start gap-4">
                <div className="inline-flex min-w-[94px] flex-col justify-center rounded-[0.95rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-3 py-3 text-[color:var(--accent-strong)] shadow-[0_10px_24px_rgba(74,31,20,0.06)]">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent-deep)]">
                    Match
                  </span>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-[1.9rem] font-black leading-none">
                      {formatMatchScore(restaurant.matchScore)}
                    </span>
                    <span className="pb-0.5 text-[11px] font-semibold tracking-[0.02em] text-[color:var(--accent-strong)]">
                      /100
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--status-text)] transition-[filter,box-shadow] duration-180 group-hover:brightness-[1.02]">
                      {restaurant.isSaved ? <span aria-hidden="true">✓</span> : null}
                      {statusText}
                    </p>
                    <p className="text-sm font-medium text-[color:var(--text-secondary)]">
                      {locationLine}
                    </p>
                  </div>

                  <h2 className="mt-3 text-[2rem] font-black tracking-tight text-[color:var(--foreground)]">
                    {restaurant.name}
                  </h2>

                  {restaurant.googleRating !== null ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--accent-strong)]">
                      <span className="text-base leading-none">*</span>
                      <span className="font-semibold">{restaurant.googleRating.toFixed(1)}</span>
                      <span className="text-[color:var(--text-secondary)]">
                        {restaurant.googleUserRatingsTotal
                          ? `(${restaurant.googleUserRatingsTotal} reviews)`
                          : '(Google rating)'}
                      </span>
                    </div>
                  ) : null}

                  <p className="mt-4 max-w-[44rem] text-[1.12rem] font-semibold leading-8 text-[color:var(--foreground)]">
                    {restaurant.venueMatchSummary || 'Matches enough of your taste profile to be worth saving.'}
                  </p>

                  <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{getSupportLine(restaurant)}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((value) => (
                      <TasteTag key={`${restaurant.id}-${value}`}>{value}</TasteTag>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex flex-col gap-2.5 rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-4 xl:ml-auto xl:min-w-[220px]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--status-bg)] px-3 py-2 text-sm font-semibold text-[color:var(--status-text)]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--status-strong)]" />
                {statusText}
              </div>

              {restaurant.isSaved ? (
                <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{eventText}</p>
              ) : restaurant.availableEventCount > 0 ? (
                <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                  Save first, then sign up for any hosted tables here.
                </p>
              ) : (
                <p className="text-sm leading-6 text-[color:var(--text-secondary)]">Save to hear when a table opens.</p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {restaurant.isSaved ? (
                  <Button className="min-h-[48px] group-hover:shadow-[0_14px_24px_rgba(242,169,0,0.22)]" onClick={() => onOpenDetails?.(restaurant)}>
                    View venue
                  </Button>
                ) : (
                  <>
                    {onToggleSaved ? (
                      <Button
                        className="min-h-[48px] group-hover:shadow-[0_14px_24px_rgba(242,169,0,0.22)]"
                        disabled={saving}
                        onClick={() => onToggleSaved(restaurant.id, 'save')}
                      >
                        {saving ? 'Saving...' : 'Save venue'}
                      </Button>
                    ) : null}
                    <button
                      className="text-left text-sm font-semibold text-[color:var(--nav-bg)] transition hover:text-[color:var(--accent-strong)]"
                      onClick={() => onOpenDetails?.(restaurant)}
                      type="button"
                    >
                      View venue
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
