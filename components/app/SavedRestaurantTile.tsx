import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import type { DashboardRestaurant } from '@/lib/app/types'

const RESTAURANT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCoHML1D-nS9Lpd8JQsgkHZQy7xiCa4Cx9EeNcbmIe5Kp0jdxofD_dVVn6Ze22xEPoZgJTuKre5B1fsb1Pbbme3gUS-P9eUKSbS3DQQs4TkPqXXH3lEx8hArTWwf3eLo4jmiZBqoc5svsyFDFqKkvvC_rj4reYIojqZPtWbKTLiBugXIwtxa9qGGkVZ1Qvn7lEgs5cvkJpPYEypfeu3_hwcW_FJI1Rnh9Ib_QPpp-r_W-cmqmkxuliA_xVq0jvZHb9l0FtG2aimNlH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAslHXH8KjoZPnFH9tLgGOz8rpffzYp31oJCQ03BpWAGdwlFuUFHoISTgdAoZH_NjW-csUz083j3OW2m7Eg3SuZatWjxorJGliozLUIdLQ8c8z6hpL2bj-HYYYYraZ1M28INpoA-BFsk74mlHt5pUxujHqONyF7wwIBG2LeEI48EBwtXkT82xYxLlx3ZfU9xA0fKFD9uG5VwLYImjp2Ds_E_MAAvem_kn52S1La_X3JIpw26-1BtApNmFDKsn5tXXeqRiG9EglOZ9X-',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANwT_OCTmuJC4naZhU3nuu-_tl7nhx6boXESOu4GLp5ZWE2QupS8HMNQ8yy0ZzGILo9KDGkmYrfwOLwnmf-PZa_KNHdtjFKXI3pdft5g3EDqysljfjWnmqJQWnFOECkd1pt8ssY2BZq9Y5OJu_J9oiPE-ORo3hrHoDFk9xM-r8zFq_WS3azkfo5wzdoYL0xRq9J7_gQ0fi_xMOec9JpOSZFaAFZtm5hw0wQLDQAfNvmSuc06elFW9SCXwRrjWPtLEmFN4LjA5o3yx8',
] as const

function formatRating(restaurant: DashboardRestaurant) {
  if (restaurant.googleRating === null) {
    return null
  }

  const reviews = restaurant.googleUserRatingsTotal
    ? ` (${restaurant.googleUserRatingsTotal.toLocaleString()} reviews)`
    : ''

  return `${restaurant.googleRating.toFixed(1)}${reviews}`
}

function getRestaurantImage(index: number) {
  return RESTAURANT_IMAGES[index % RESTAURANT_IMAGES.length] ?? RESTAURANT_IMAGES[0]!
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

function getRestaurantReason(restaurant: DashboardRestaurant) {
  if (restaurant.googleEditorialSummary?.trim()) {
    return restaurant.googleEditorialSummary.trim()
  }

  if (restaurant.venueMatchSummary?.trim()) {
    return restaurant.venueMatchSummary.trim()
  }

  if (restaurant.restaurant_cuisines?.[0]) {
    return `${restaurant.restaurant_cuisines[0]} with the right room for a social night.`
  }

  return 'You saved this because it still looks like a strong candidate for a first Tastebuds plan.'
}

function getWhyItFitsLine(restaurant: DashboardRestaurant) {
  const tags = [
    ...(restaurant.topMatchFactors ?? []),
    ...(restaurant.matchTags ?? []),
    ...(restaurant.venue_vibes ?? []),
    restaurant.restaurant_cuisines?.[0] ?? null,
  ].filter((value): value is string => Boolean(value))

  return Array.from(new Set(tags)).slice(0, 4).join(' / ')
}

export function SavedRestaurantTile({
  active,
  index,
  onOpenDetails,
  onSelect,
  restaurant,
}: {
  active: boolean
  index: number
  onOpenDetails: () => void
  onSelect: () => void
  restaurant: DashboardRestaurant
}) {
  const matchPercentage = getMatchPercentage(restaurant.matchScore)
  const matchLabel = getMatchLabel(restaurant.matchScore)
  const whyItFitsLine = getWhyItFitsLine(restaurant)

  return (
    <article className={`transition ${active ? 'bg-[color:var(--surface-soft)]' : ''}`}>
      <div className="grid gap-0 border-b border-[color:var(--border-soft)] md:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[190px_minmax(0,1fr)_260px]">
        <div className="relative overflow-hidden">
          <GooglePlacePhoto
            alt={restaurant.name}
            enableCarousel={false}
            fallbackSrc={getRestaurantImage(index)}
            imageClassName="h-full min-h-[180px] w-full object-cover md:min-h-full"
            placeId={restaurant.googlePlaceId}
          />
        </div>

        <div className="min-w-0 px-5 py-5 md:px-6 md:py-6 xl:pr-4">
          <h3 className="text-[1.55rem] font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
            {restaurant.name}
          </h3>
          {formatRating(restaurant) ? (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]">
              <svg aria-hidden="true" className="h-4 w-4 fill-current text-[color:var(--accent-strong)]" viewBox="0 0 24 24">
                <path d="M12 3.6 14.9 9l5.9.8-4.3 4.2 1 5.8L12 17l-5.5 2.8 1-5.8L3.2 9.8 9.1 9 12 3.6Z" />
              </svg>
              <span>{formatRating(restaurant)}</span>
            </div>
          ) : null}
          <p className="mt-4 max-w-[42rem] text-[1rem] leading-7 text-[color:var(--foreground)]">
            {getRestaurantReason(restaurant)}
          </p>
          {whyItFitsLine ? (
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
              Why it fits: {whyItFitsLine}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-5 border-t border-[color:var(--border-soft)] bg-white px-5 py-5 md:col-start-2 md:px-6 md:pt-0 xl:col-start-auto xl:border-l xl:border-t-0 xl:px-5 xl:py-6">
          <div className="space-y-3">
            <div>
              <p className="text-[1.3rem] font-semibold tracking-[-0.02em] text-[color:var(--nav-bg)] [text-shadow:0_0_18px_rgba(245,158,11,0.18),0_1px_0_rgba(255,255,255,0.55)]">
                {matchPercentage !== null ? `${matchPercentage}% Match` : 'Match pending'}
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--accent-strong)]">
                {matchLabel}
              </p>
            </div>
            <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
              Watching for hosted events
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button className="min-h-[48px] w-full" onClick={onOpenDetails}>
              View venue
            </Button>
            <Button className="min-h-[48px] w-full" onClick={onSelect} variant="secondary">
              Show on map
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
