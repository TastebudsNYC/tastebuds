import Link from 'next/link'

import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { formatDistanceMiles } from '@/lib/app/format'
import type { DashboardEvent } from '@/lib/app/types'

const EVENT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDqYWhd6CM0ja06fxxtGnrn-4gj2rJVjMEzPPAOzzyCNV05xUzS1i0rvjhfOFFbDniolswf3SLzB7QetHgaiH8UN9QWWN9wmtAnwLlXKLA2r-JGAr9DXLUN-FwLD_RiJcXVM8D0wwVokUfryW29TwmiZGmwJbLav9xiQSoHnGMiTPx3CQC82QPicuBDljcSBEJPOmDGwE3pEa-c6p5KFZkmbQ0V6U4AOygft8A2_Y1D6E4jUv1JcwVw_CFF9Mc9czMgDYSC7zoADxFy',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqL25hEDVJv9pN6Zjs2G2TZpmVWjMIFv-OpmSYKCvu0eyrh3F9GhwQk9ZaWR2q7OlehbXZMd2CrViUaNbHp4wL3RnOThQf28i4tcy4QFtSiddzWQNTpcV6j3Pct_FxUjVjSuGeUile0FLHm17i2yNXaMj9z74GrLizBt7x3SNmO1mwugeE6Wl5u7G_Dgj37zhoULyZUeFJFsXvdx2JayLb22Co6BZzBvR70FXOf0ggxi2hGt_S0JMVwEc4cBWONW_uMA8xEJN8ru8B',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCygTik5ExFv6d7QT2oGaLcpDJDr8C4Tte6UAOHLM8J9XSVspf3cV2m9S5-nQp9zTL50-_IUuNNTBCkkDHmWn8tTh-dEqVQsfnWqcW_AoOPIaBF8nset8-4AYSeqnpZ9lpsDXDSnBmU2DTWyIs3R7K8GShwB9wJew46FIsu7_S68vJaX70JM_yIrO0DnN7moy8nH6WuMW8IwZAVI83ZVGXZKoBxDeJrmmgAE1kzube4go9GkuP2XlEHgfEzTspjq0vlUt8xRBJyARE1',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCxNfyXjpd5uXbtI5ZwNkfFjXFXvmQ7j2g_YUjKIEmetFmNaMFFqHcBniBnsT17KEBNJa4VNYO9VaQHJCr7SA2WqF0p0AP3uAJqq3AVBdqra9EkmMxwFVsxcACH2dlTC2xTVssN_zHAXQN05iisrUID5xsa8M-o4IyRlhWHPKslpQ1f0LPR0SvjqNavrPIxTf_GNplbRltlI_sEYTtCUrzlxMymtLdIxGCZaC3d1wi4v3RnRJ8Zyq9bbwpNK-0zVNZz8F0zlJ0rlCM3',
] as const

function getEventImage(index: number) {
  return EVENT_IMAGES[index % EVENT_IMAGES.length] ?? EVENT_IMAGES[0]!
}

function getEventDateBadge(value: string) {
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

function formatEventWindow(event: DashboardEvent) {
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

function getMetadataLine(event: DashboardEvent) {
  const area =
    event.restaurant_neighbourhood && event.restaurant_neighbourhood !== event.restaurant_subregion
      ? `${event.restaurant_neighbourhood}, ${event.restaurant_subregion}`
      : event.restaurant_subregion

  return [event.restaurant_name, area, formatDistanceMiles(event.venueDistanceKm)].filter(
    (value): value is string => Boolean(value)
  )
}

function getBestForLine(event: DashboardEvent) {
  const tags = [
    ...(event.venueMatchFactors ?? []),
    event.restaurant_cuisines?.[0] ?? null,
    ...(event.venue_vibes ?? []),
  ].filter((value): value is string => Boolean(value))

  return Array.from(new Set(tags)).slice(0, 4).join(', ')
}

function getAvailabilityLabel(event: DashboardEvent) {
  if (event.status !== 'open' || event.spotsLeft === 0) {
    return 'Table full'
  }

  if (event.attendeeCount === 0) {
    return `${event.capacity} seats available`
  }

  if (event.spotsLeft <= 3) {
    return 'Few seats left'
  }

  return `${event.spotsLeft} seats available`
}

export function HomeEventTile({
  event,
  index,
}: {
  event: DashboardEvent
  index: number
}) {
  const badge = getEventDateBadge(event.starts_at)
  const metadata = getMetadataLine(event)
  const matchPercentage = getMatchPercentage(event.projectedRestaurantScore)
  const matchLabel = getMatchLabel(event.projectedRestaurantScore)
  const bestForLine = getBestForLine(event)

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-[color:var(--border-soft)] bg-white shadow-[0_18px_44px_rgba(12,18,32,0.08)]">
      <div className="grid xl:grid-cols-[280px_minmax(0,1fr)_220px]">
        <div className="relative min-h-[240px] overflow-hidden xl:min-h-full">
          <GooglePlacePhoto
            alt={event.restaurant_name}
            attributionClassName="absolute bottom-3 left-3 z-[2] rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white"
            fallbackSrc={getEventImage(index)}
            imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            placeId={event.restaurantGooglePlaceId}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className="absolute left-4 top-4 rounded-[1rem] bg-white/92 px-3 py-2 text-center shadow-[0_10px_24px_rgba(12,18,32,0.12)] backdrop-blur">
            <span className="block text-xl font-bold leading-none text-[color:var(--foreground)]">{badge.day}</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              {badge.month}
            </span>
          </div>
        </div>

        <div className="min-w-0 px-5 py-5 md:px-6 md:py-6 xl:pr-4">
          <h3 className="text-[1.8rem] font-semibold tracking-[-0.03em] text-[color:var(--foreground)] md:text-[2.05rem]">
            {event.title}
          </h3>
          {metadata.length > 0 ? (
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {metadata.join(' / ')}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{formatEventWindow(event)}</p>
          <p className="mt-4 text-[1.02rem] leading-7 text-[color:var(--foreground)]">
            {event.personalMatchSummary ?? event.venueMatchSummary}
          </p>
          {bestForLine ? (
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
              Best for: {bestForLine}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">
            Hosted by {event.restaurant_name}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-6 border-t border-[color:var(--border-soft)] bg-white px-5 py-5 md:px-6 xl:border-l xl:border-t-0 xl:px-5 xl:py-6">
          <div className="space-y-4">
            <div>
              <p className="text-[1.35rem] font-semibold tracking-[-0.02em] text-[color:var(--nav-bg)] [text-shadow:0_0_18px_rgba(245,158,11,0.18),0_1px_0_rgba(255,255,255,0.55)]">
                {matchPercentage !== null ? `${matchPercentage}% Match` : 'Match pending'}
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--accent-strong)]">{matchLabel}</p>
            </div>
            <div className="space-y-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              <p className="font-medium text-[color:var(--foreground)]">{getAvailabilityLabel(event)}</p>
              <p>Table for {event.capacity}</p>
              <p>Hosted by {event.restaurant_name}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="min-h-[48px] w-full" href="/events">
              Join table
            </Button>
            <Button className="min-h-[48px] w-full" href="/events" variant="secondary">
              See details
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
