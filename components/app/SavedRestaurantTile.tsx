import type { DashboardRestaurant } from '@/lib/app/types'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'

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
    ? ` (${restaurant.googleUserRatingsTotal} reviews)`
    : ''

  return `${restaurant.googleRating.toFixed(1)}${reviews}`
}

function getRestaurantImage(index: number) {
  return RESTAURANT_IMAGES[index % RESTAURANT_IMAGES.length] ?? RESTAURANT_IMAGES[0]!
}

function getRestaurantReason(restaurant: DashboardRestaurant) {
  const normalizedName = restaurant.name.toLowerCase()

  if (normalizedName.includes('banter')) {
    return 'Easy first-table energy: bright room, casual crowd, brunch-safe.'
  }

  if (normalizedName.includes('gallagher')) {
    return 'Polished, old-school, better for a confident dinner group.'
  }

  if (restaurant.venue_good_for_conversation || restaurant.venue_good_for_casual_meetups) {
    return 'Good for a relaxed first group dinner.'
  }

  if (restaurant.venue_energy || restaurant.venue_price || restaurant.venue_scene?.length) {
    return 'Strong match on energy, price and scene.'
  }

  if (restaurant.restaurant_cuisines?.[0]) {
    return `${restaurant.restaurant_cuisines[0]} with the right room for a social night.`
  }

  return 'You saved this - we will tell you when a table opens.'
}

function getMatchMetadata(restaurant: DashboardRestaurant) {
  const normalizedName = restaurant.name.toLowerCase()

  if (normalizedName.includes('banter')) {
    return 'Match: energy / price / brunch'
  }

  if (normalizedName.includes('gallagher')) {
    return 'Match: energy / price / scene'
  }

  return 'Match: energy / price / scene'
}

function formatMatchScore(score: number | null | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return null
  }

  return Math.max(0, Math.min(100, Math.round(score)))
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
  const supportNote = getMatchMetadata(restaurant)

  return (
    <article className={`transition ${active ? 'bg-[color:var(--surface-soft)]' : ''}`}>
      <div className="grid gap-5 border-b border-[color:var(--border-soft)] p-5 last:border-b-0 lg:grid-cols-[11.75rem_minmax(20rem,1fr)_15rem] lg:items-center">
        <GooglePlacePhoto
          alt={restaurant.name}
          enableCarousel={false}
          fallbackSrc={getRestaurantImage(index)}
          imageClassName="h-48 w-full rounded-lg object-cover shadow-[0_10px_24px_rgba(74,31,20,0.12)] lg:h-34"
          placeId={restaurant.googlePlaceId}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-bold leading-7 text-[color:var(--foreground)]">
            {restaurant.name}
          </h3>
          {formatRating(restaurant) ? (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[color:var(--accent-strong)]">
              <svg aria-hidden="true" className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3.6 14.9 9l5.9.8-4.3 4.2 1 5.8L12 17l-5.5 2.8 1-5.8L3.2 9.8 9.1 9 12 3.6Z" />
              </svg>
              <span>{formatRating(restaurant)}</span>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <span className="inline-flex min-w-[94px] flex-col justify-center rounded-[0.95rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-3 py-3 text-[color:var(--accent-strong)] shadow-[0_10px_24px_rgba(74,31,20,0.06)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent-deep)]">
                Match
              </span>
              <span className="mt-2 flex items-end gap-1">
                <span className="text-[1.9rem] font-black leading-none">
                  {formatMatchScore(restaurant.matchScore) ?? '-'}
                </span>
                <span className="pb-0.5 text-[11px] font-semibold tracking-[0.02em] text-[color:var(--accent-strong)]">
                  /100
                </span>
              </span>
            </span>
            <div className="min-w-[15rem] flex-1">
              <p className="max-w-xl text-[0.98rem] font-semibold leading-6 text-[color:var(--foreground)]">
                {getRestaurantReason(restaurant)}
              </p>
              <p className="mt-1 max-w-xl text-xs leading-5 text-[color:var(--text-secondary)]">
                {supportNote}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 lg:flex-col lg:items-stretch lg:justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-md bg-[color:var(--status-bg)] px-3.5 py-2.5 text-xs font-semibold text-[color:var(--status-text)]">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
            </svg>
            Watching for hosted events
          </span>
          <button
            className="rounded-md bg-[color:var(--accent)] px-5 py-3 text-center text-sm font-bold text-[color:var(--accent-text)] shadow-[0_10px_20px_rgba(242,169,0,0.2)] transition hover:bg-[color:var(--accent-hover)]"
            onClick={onOpenDetails}
            type="button"
          >
            View venue
          </button>
          <button
            className="text-sm font-semibold text-[color:var(--nav-bg)] hover:underline lg:hidden"
            onClick={onSelect}
            type="button"
          >
            Map
          </button>
        </div>
      </div>
    </article>
  )
}
