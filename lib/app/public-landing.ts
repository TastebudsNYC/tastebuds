import 'server-only'

import { connection } from 'next/server'

import { createServerSupabaseAdminClient } from '@/lib/supabase/server'

export type PublicLandingTableCard = {
  emoji: string
  meta: string
  status: string
  tagline: string
  title: string
  visualClass:
    | 'landing-event-visual-steak'
    | 'landing-event-visual-brunch'
    | 'landing-event-visual-ramen'
}

type PublicEventRow = {
  capacity: number
  description: string | null
  id: number
  menu_experience_tags: string[] | null
  restaurant_cuisines: string[] | null
  restaurant_name: string
  restaurant_subregion: string
  starts_at: string
  title: string
  venue_energy: string | null
  venue_scene: string[] | null
}

type PublicSignupRow = {
  event_id: number
  status: 'going' | 'cancelled' | 'removed' | 'no_show' | 'attended'
}

const LANDING_CARD_TARGET = 3

const fallbackCards: PublicLandingTableCard[] = [
  {
    emoji: '🥩',
    meta: 'Midtown · Wednesday dinner',
    status: '2 seats left',
    tagline: 'Old-school steakhouse. Big-table dinner energy.',
    title: "Gallagher's Steakhouse",
    visualClass: 'landing-event-visual-steak',
  },
  {
    emoji: '🍸',
    meta: 'Lower East Side · Sunday brunch',
    status: 'open',
    tagline: 'Bright brunch spot. Easy first-table energy.',
    title: 'Banter NYC',
    visualClass: 'landing-event-visual-brunch',
  },
  {
    emoji: '🍜',
    meta: 'Midtown · Friday dinner',
    status: '3 seats left',
    tagline: 'Low-key ramen. Good food, no performance.',
    title: 'Raku',
    visualClass: 'landing-event-visual-ramen',
  },
]

function getMealMomentLabel(startsAt: string) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/New_York',
    }).format(new Date(startsAt))
  )

  if (hour < 11) {
    return 'breakfast'
  }

  if (hour < 15) {
    return 'brunch'
  }

  if (hour < 18) {
    return 'lunch'
  }

  return 'dinner'
}

function formatEventMeta(subregion: string, startsAt: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
  }).format(new Date(startsAt))

  return `${subregion} · ${weekday} ${getMealMomentLabel(startsAt)}`
}

function getStatusLabel(spotsLeft: number, attendeeCount: number) {
  if (spotsLeft <= 0) {
    return 'waitlist'
  }

  if (attendeeCount === 0) {
    return 'open'
  }

  return `${spotsLeft} ${spotsLeft === 1 ? 'seat' : 'seats'} left`
}

function pickVisualTheme(event: PublicEventRow) {
  const tokens = [
    ...(event.restaurant_cuisines ?? []),
    ...(event.menu_experience_tags ?? []),
    ...(event.venue_scene ?? []),
    event.venue_energy ?? '',
    event.title,
    event.description ?? '',
  ]
    .join(' ')
    .toLowerCase()

  if (
    tokens.includes('brunch') ||
    tokens.includes('cocktail') ||
    tokens.includes('wine') ||
    tokens.includes('date')
  ) {
    return {
      emoji: '🍸',
      visualClass: 'landing-event-visual-brunch' as const,
    }
  }

  if (
    tokens.includes('ramen') ||
    tokens.includes('japanese') ||
    tokens.includes('asian') ||
    tokens.includes('noodle')
  ) {
    return {
      emoji: '🍜',
      visualClass: 'landing-event-visual-ramen' as const,
    }
  }

  return {
    emoji: '🥩',
    visualClass: 'landing-event-visual-steak' as const,
  }
}

function buildTagline(event: PublicEventRow) {
  const description = event.description?.trim()
  if (description) {
    return description
  }

  const primaryCuisine = event.restaurant_cuisines?.[0]?.trim()
  const scene = event.venue_scene?.[0]?.trim()
  const energy = event.venue_energy?.trim().toLowerCase()
  const mealMoment = getMealMomentLabel(event.starts_at)

  const firstLine = primaryCuisine
    ? primaryCuisine
    : mealMoment === 'brunch'
      ? 'Brunch spot'
      : 'Hosted table'

  const secondLine = scene
    ? `${scene.toLowerCase()} energy`
    : energy === 'chill'
      ? 'easygoing energy'
      : energy === 'high'
        ? 'high-energy room'
        : 'good table energy'

  return `${firstLine}. ${secondLine.charAt(0).toUpperCase()}${secondLine.slice(1)}.`
}

export async function getPublicLandingTableCards() {
  await connection()

  const adminClient = createServerSupabaseAdminClient()
  const nowIso = new Date().toISOString()

  const { data: events, error: eventsError } = await adminClient
    .from('events')
    .select(
      'capacity, description, id, menu_experience_tags, restaurant_cuisines, restaurant_name, restaurant_subregion, starts_at, status, title, venue_energy, venue_scene'
    )
    .eq('status', 'open')
    .is('archived_at', null)
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true })
    .limit(12)
    .returns<(PublicEventRow & { status: 'open' })[]>()

  if (eventsError || !events?.length) {
    return fallbackCards.slice(0, LANDING_CARD_TARGET)
  }

  const eventIds = events.map((event) => event.id)

  const { data: signups, error: signupsError } = await adminClient
    .from('event_signups')
    .select('event_id, status')
    .in('event_id', eventIds)
    .eq('status', 'going')
    .returns<PublicSignupRow[]>()

  if (signupsError) {
    return fallbackCards.slice(0, LANDING_CARD_TARGET)
  }

  const attendeeCountByEventId = new Map<number, number>()
  for (const signup of signups ?? []) {
    attendeeCountByEventId.set(
      signup.event_id,
      (attendeeCountByEventId.get(signup.event_id) ?? 0) + 1
    )
  }

  const liveCards = events
    .map((event) => {
      const attendeeCount = attendeeCountByEventId.get(event.id) ?? 0
      const spotsLeft = Math.max(0, event.capacity - attendeeCount)
      const visualTheme = pickVisualTheme(event)

      return {
        emoji: visualTheme.emoji,
        meta: formatEventMeta(event.restaurant_subregion, event.starts_at),
        status: getStatusLabel(spotsLeft, attendeeCount),
        tagline: buildTagline(event),
        title: event.restaurant_name,
        visualClass: visualTheme.visualClass,
      } satisfies PublicLandingTableCard
    })
    .slice(0, LANDING_CARD_TARGET)

  if (liveCards.length >= LANDING_CARD_TARGET) {
    return liveCards
  }

  const usedTitles = new Set(liveCards.map((card) => card.title))
  const fillerCards = fallbackCards.filter((card) => !usedTitles.has(card.title))

  return [...liveCards, ...fillerCards].slice(0, LANDING_CARD_TARGET)
}
