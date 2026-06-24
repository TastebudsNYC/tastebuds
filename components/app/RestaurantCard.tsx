import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { cx, formatDistanceMiles, formatGooglePriceLevel } from '@/lib/app/format'
import type { DashboardRestaurant } from '@/lib/app/types'

const RESTAURANT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCoHML1D-nS9Lpd8JQsgkHZQy7xiCa4Cx9EeNcbmIe5Kp0jdxofD_dVVn6Ze22xEPoZgJTuKre5B1fsb1Pbbme3gUS-P9eUKSbS3DQQs4TkPqXXH3lEx8hArTWwf3eLo4jmiZBqoc5svsyFDFqKkvvC_rj4reYIojqZPtWbKTLiBugXIwtxa9qGGkVZ1Qvn7lEgs5cvkJpPYEypfeu3_hwcW_FJI1Rnh9Ib_QPpp-r_W-cmqmkxuliA_xVq0jvZHb9l0FtG2aimNlH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAslHXH8KjoZPnFH9tLgGOz8rpffzYp31oJCQ03BpWAGdwlFuUFHoISTgdAoZH_NjW-csUz083j3OW2m7Eg3SuZatWjxorJGliozLUIdLQ8c8z6hpL2bj-HYYYYraZ1M28INpoA-BFsk74mlHt5pUxujHqONyF7wwIBG2LeEI48EBwtXkT82xYxLlx3ZfU9xA0fKFD9uG5VwLYImjp2Ds_E_MAAvem_kn52S1La_X3JIpw26-1BtApNmFDKsn5tXXeqRiG9EglOZ9X-',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANwT_OCTmuJC4naZhU3nuu-_tl7nhx6boXESOu4GLp5ZWE2QupS8HMNQ8yy0ZzGILo9KDGkmYrfwOLwnmf-PZa_KNHdtjFKXI3pdft5g3EDqysljfjWnmqJQWnFOECkd1pt8ssY2BZq9Y5OJu_J9oiPE-ORo3hrHoDFk9xM-r8zFq_WS3azkfo5wzdoYL0xRq9J7_gQ0fi_xMOec9JpOSZFaAFZtm5hw0wQLDQAfNvmSuc06elFW9SCXwRrjWPtLEmFN4LjA5o3yx8',
] as const

function getRestaurantImage(restaurant: DashboardRestaurant) {
  return RESTAURANT_IMAGES[restaurant.id % RESTAURANT_IMAGES.length] ?? RESTAURANT_IMAGES[0]!
}

function getMatchPercentage(score: number | null | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return null
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function getMatchLabel(score: number | null | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 'Worth a look'
  }

  if (score >= 80) {
    return 'Excellent fit'
  }

  if (score >= 70) {
    return 'Strong fit'
  }

  if (score >= 60) {
    return 'Worth a look'
  }

  return 'Maybe'
}

function getStatusBadge(restaurant: DashboardRestaurant) {
  if (restaurant.isSaved && restaurant.availableEventCount > 0) {
    return 'Saved & watching'
  }

  if (restaurant.isSaved) {
    return 'Watching'
  }

  if (restaurant.availableEventCount > 0) {
    return restaurant.availableEventCount === 1 ? 'Live table' : 'Live tables'
  }

  return null
}

function getReasonChips(restaurant: DashboardRestaurant) {
  const values = [
    ...(restaurant.topMatchFactors ?? []),
    ...(restaurant.matchTags ?? []),
    restaurant.restaurant_cuisines?.[0] ?? null,
    ...(restaurant.venue_vibes ?? []),
  ].filter((value): value is string => Boolean(value))

  return Array.from(new Set(values)).slice(0, 4)
}

function getMetadataItems(restaurant: DashboardRestaurant) {
  const areaLabel =
    restaurant.neighbourhood && restaurant.neighbourhood !== restaurant.subregion
      ? restaurant.neighbourhood
      : restaurant.subregion
  const distanceLabel = formatDistanceMiles(restaurant.venueDistanceKm)
  const cuisineLabel = restaurant.restaurant_cuisines?.[0] ?? null
  const priceLabel = formatGooglePriceLevel(restaurant.venue_price ?? restaurant.googlePriceLevel)

  return [areaLabel, distanceLabel, cuisineLabel, priceLabel].filter(
    (value): value is string => Boolean(value)
  )
}

function getSupportingCopy(restaurant: DashboardRestaurant) {
  if (restaurant.isSaved && restaurant.availableEventCount > 0) {
    return `${restaurant.availableEventCount} live table${
      restaurant.availableEventCount === 1 ? '' : 's'
    } ready to open.`
  }

  if (restaurant.isSaved) {
    return 'No live table yet.'
  }

  if (restaurant.availableEventCount > 0) {
    return `${restaurant.availableEventCount} live table${
      restaurant.availableEventCount === 1 ? '' : 's'
    } already open if you want to jump in now.`
  }

  return 'Save it to hear when a table opens.'
}

export function RestaurantCard({
  flashState,
  highlighted = false,
  onHighlightChange,
  onOpenDetails,
  onToggleSaved,
  promotionDisclosure,
  restaurant,
  saving,
}: {
  flashState?: 'removed' | 'saved' | null
  highlighted?: boolean
  onHighlightChange?: (restaurantId: number | null) => void
  onOpenDetails?: (restaurant: DashboardRestaurant) => void
  onToggleSaved?: (restaurantId: number, action: 'save' | 'unsave') => void
  promotionDisclosure?: 'Founding Partner' | 'Sponsored' | null
  restaurant: DashboardRestaurant
  saving?: boolean
}) {
  const metadataItems = getMetadataItems(restaurant)
  const reasonChips = getReasonChips(restaurant)
  const matchPercentage = getMatchPercentage(restaurant.matchScore)
  const matchLabel = getMatchLabel(restaurant.matchScore)
  const statusBadge = getStatusBadge(restaurant)
  const supportingCopy = getSupportingCopy(restaurant)
  const description =
    restaurant.venueMatchSummary ||
    restaurant.googleEditorialSummary ||
    'Matches enough of your taste profile to be worth a closer look.'

  return (
    <article
      className={cx(
        'group overflow-hidden rounded-[1.75rem] border border-[color:var(--border-soft)] bg-white shadow-[0_18px_44px_rgba(12,18,32,0.08)] tb-card-interactive',
        highlighted ? 'border-[color:var(--accent-border)] shadow-[0_22px_50px_rgba(255,193,67,0.18)]' : '',
        flashState === 'saved' ? 'tb-card-flash' : ''
      )}
      onMouseEnter={() => onHighlightChange?.(restaurant.id)}
      onMouseLeave={() => onHighlightChange?.(null)}
    >
      <div className="grid md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_190px]">
        <div className="relative min-h-[220px] overflow-hidden md:row-span-2 md:min-h-full xl:row-span-1">
          <GooglePlacePhoto
            alt={restaurant.name}
            attributionClassName="absolute bottom-3 left-3 z-[2] rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white"
            enableCarousel={false}
            fallbackSrc={getRestaurantImage(restaurant)}
            imageClassName="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            placeId={restaurant.googlePlaceId}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          {statusBadge ? (
            <div className="absolute left-4 top-4 z-[2]">
              <span className="inline-flex rounded-full border border-white/35 bg-white/88 px-3 py-1 text-xs font-semibold text-[color:var(--nav-bg)] shadow-[0_10px_24px_rgba(12,18,32,0.12)] backdrop-blur-sm">
                {statusBadge}
              </span>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 px-5 py-5 md:px-6 md:py-6 xl:pr-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-[color:var(--foreground)] md:text-[2.15rem]">
                {restaurant.name}
              </h2>
              {metadataItems.length > 0 ? (
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {metadataItems.join(' / ')}
                </p>
              ) : null}
              {promotionDisclosure ? (
                <p className="mt-3 text-sm font-semibold tracking-[0.06em] text-[color:var(--foreground)]/78">
                  {promotionDisclosure}
                </p>
              ) : null}
            </div>
            {statusBadge ? (
              <span className="inline-flex rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--status-text)] md:hidden">
                {statusBadge}
              </span>
            ) : null}
          </div>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-7 text-[color:var(--foreground)] md:text-[1.08rem]">
            {description}
          </p>

          {reasonChips.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {reasonChips.map((value) => (
                <span
                  className="inline-flex rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-secondary)]"
                  key={`${restaurant.id}-${value}`}
                >
                  {value}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className="flex flex-col justify-between gap-5 border-t border-[color:var(--border-soft)] px-5 py-5 md:col-start-2 md:px-6 md:pt-0 xl:col-start-auto xl:border-l xl:border-t-0 xl:px-5 xl:py-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-3 xl:items-end xl:text-right">
            <div>
              <p className="text-[1.35rem] font-semibold tracking-[-0.02em] text-[color:var(--nav-bg)] [text-shadow:0_0_18px_rgba(245,158,11,0.18),0_1px_0_rgba(255,255,255,0.55)]">
                {matchPercentage !== null ? `${matchPercentage}% Match` : 'Match pending'}
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--accent-strong)]">
                {matchLabel}
              </p>
            </div>
            <p className="max-w-[18rem] text-sm leading-6 text-[color:var(--text-secondary)]">
              {supportingCopy}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              className="min-h-[48px] group-hover:shadow-[0_14px_24px_rgba(242,169,0,0.22)]"
              onClick={() => onOpenDetails?.(restaurant)}
              variant={restaurant.isSaved ? 'primary' : 'secondary'}
            >
              View venue
            </Button>

            {restaurant.isSaved ? (
              onToggleSaved ? (
                <Button
                  className="min-h-[48px]"
                  disabled={saving}
                  onClick={() => onToggleSaved(restaurant.id, 'unsave')}
                  variant="secondary"
                >
                  {saving ? 'Updating...' : 'Unsave'}
                </Button>
              ) : null
            ) : onToggleSaved ? (
              <Button
                className="min-h-[48px]"
                disabled={saving}
                onClick={() => onToggleSaved(restaurant.id, 'save')}
              >
                {saving ? 'Saving...' : 'Save venue'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
