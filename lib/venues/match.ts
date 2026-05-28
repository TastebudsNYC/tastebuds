import {
  buildVenueMatchBreakdown,
  calculateRestaurantMatchScore,
  type EventForScoring,
  type ProfileForScoring,
} from '@/lib/events'
import type {
  RestaurantVenueInput,
  VenueDataModel,
  VenueMatchResult,
  VenueTraitsModel,
} from '@/lib/venues/types'

const FACTOR_LABELS = {
  conversation: 'conversation',
  crowd: 'crowd',
  cuisine: 'cuisine',
  dietary: 'dietary fit',
  drinking: 'drinks',
  energy: 'vibe',
  groupSize: 'group fit',
  location: 'location',
  music: 'music',
  price: 'price',
  quality: 'quality',
  scene: 'social vibe',
  setting: 'setting',
  vibe: 'vibe',
} as const

type VenueReasonType = VenueMatchResult['reasonType']

function toScoringVenue(
  profile: ProfileForScoring,
  restaurant: RestaurantVenueInput,
  traits: VenueTraitsModel
): EventForScoring {
  return {
    google_good_for_groups: restaurant.google_good_for_groups ?? null,
    google_live_music: restaurant.google_live_music ?? null,
    google_outdoor_seating: restaurant.google_outdoor_seating ?? null,
    google_price_level: restaurant.google_price_level,
    google_rating: restaurant.google_rating,
    google_review_count: restaurant.google_user_ratings_total,
    intent: profile.intent ?? 'friendship',
    menu_experience_tags: traits.socialFitTags,
    restaurant_cuisines: traits.cuisineTags,
    restaurant_subregion: restaurant.subregion,
    venue_crowd: restaurant.venue_crowd,
    venue_energy: restaurant.venue_energy,
    venue_formats: restaurant.venue_formats ?? null,
    venue_good_for_casual_meetups: restaurant.venue_good_for_casual_meetups ?? null,
    venue_good_for_conversation: restaurant.venue_good_for_conversation ?? null,
    venue_group_friendly: restaurant.venue_group_friendly ?? null,
    venue_indoor_outdoor: restaurant.venue_indoor_outdoor ?? null,
    venue_latitude: restaurant.venue_latitude,
    venue_longitude: restaurant.venue_longitude,
    venue_music: null,
    venue_noise_level: restaurant.venue_noise_level ?? null,
    venue_price: traits.priceBand ?? restaurant.venue_price,
    venue_scene: restaurant.venue_scene,
    venue_setting: traits.settingTags.length > 0 ? traits.settingTags : restaurant.venue_setting,
    venue_vibes: traits.vibeTags,
  }
}

function titleCase(value: string) {
  return value
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ')
}

function listHasValue(values: string[] | null | undefined, expected: string) {
  return values?.some((value) => value.toLowerCase() === expected.toLowerCase()) ?? false
}

function compactTags(values: string[]) {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of values) {
    const next = value.trim()

    if (!next) {
      continue
    }

    const key = next.toLowerCase()

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    normalized.push(next)
  }

  return normalized
}

function buildAreaLabel(
  venue: VenueDataModel,
  topMatchFactors: string[],
  profile: ProfileForScoring
) {
  if (
    topMatchFactors.includes('location') &&
    venue.neighbourhood &&
    profile.subregion &&
    venue.neighbourhood.toLowerCase() === profile.subregion.toLowerCase()
  ) {
    return venue.neighbourhood
  }

  return null
}

function buildPlaceLabel(traits: VenueTraitsModel, areaLabel: string | null) {
  const vibeTags = new Set(traits.vibeTags.map((tag) => tag.toLowerCase()))
  const settingTags = new Set(traits.settingTags.map((tag) => tag.toLowerCase()))

  const tone =
    vibeTags.has('upscale') ? 'Polished' :
    vibeTags.has('casual') || vibeTags.has('chill') ? 'Casual' :
    vibeTags.has('high-energy') ? 'Lively' :
    vibeTags.has('cozy') ? 'Cozy' :
    settingTags.has('restaurant') ? 'Focused' :
    'Good'

  const setting =
    settingTags.has('lounge') ? 'lounge' :
    settingTags.has('bar') ? 'bar spot' :
    settingTags.has('restaurant') ? 'dinner spot' :
    'spot'

  return `${tone}${areaLabel ? ` ${areaLabel}` : ''} ${setting}`.replace(/\s+/g, ' ').trim()
}

function buildUserStyle(profile: ProfileForScoring) {
  const style = [
    listHasValue(profile.preferred_vibes, 'Chill') || listHasValue(profile.preferred_vibes, 'Casual')
      ? 'relaxed'
      : null,
    listHasValue(profile.preferred_scene, 'Social') ? 'social' : null,
    listHasValue(profile.preferred_setting, 'Restaurant') ? 'dinner' : null,
  ].filter((value): value is string => Boolean(value))

  return style.length > 0 ? style.join(', ') : 'vibe and setting'
}

function getVenueSignals(
  profile: ProfileForScoring,
  venue: VenueDataModel,
  traits: VenueTraitsModel,
  topMatchFactors: string[],
  availableEventCount: number
) {
  const vibeTags = new Set(traits.vibeTags.map((tag) => tag.toLowerCase()))
  const socialTags = new Set(traits.socialFitTags.map((tag) => tag.toLowerCase()))
  const settingTags = new Set(traits.settingTags.map((tag) => tag.toLowerCase()))
  const cuisinePreferences = (profile.cuisine_preferences ?? []).map((value) => value.toLowerCase())
  const venueCuisines = traits.cuisineTags.map((value) => value.toLowerCase())
  const cuisineOverlap = venueCuisines.some((value) => cuisinePreferences.includes(value))
  const areaLabel = buildAreaLabel(venue, topMatchFactors, profile)

  return {
    areaLabel,
    availableEventCount,
    cuisineOverlap,
    placeLabel: buildPlaceLabel(traits, areaLabel),
    prefersSocial: listHasValue(profile.preferred_scene, 'Social'),
    prefersUpscale: listHasValue(profile.preferred_vibes, 'Upscale'),
    priceBand: traits.priceBand,
    settingTags,
    socialTags,
    styleLabel: buildUserStyle(profile),
    topMatchFactors,
    vibeTags,
  }
}

function pickReasonType(
  profile: ProfileForScoring,
  venue: VenueDataModel,
  traits: VenueTraitsModel,
  topMatchFactors: string[],
  availableEventCount: number
) {
  const signals = getVenueSignals(profile, venue, traits, topMatchFactors, availableEventCount)

  if (availableEventCount > 0) {
    return 'saved_with_live_event' satisfies VenueReasonType
  }

  if (
    (signals.vibeTags.has('upscale') || signals.prefersUpscale) &&
    (signals.priceBand === '$$$' || signals.priceBand === '$$$$')
  ) {
    return 'premium_social_fit' satisfies VenueReasonType
  }

  if (
    (signals.vibeTags.has('casual') || signals.vibeTags.has('chill')) &&
    (signals.socialTags.has('social') || signals.prefersSocial)
  ) {
    return 'casual_group_fit' satisfies VenueReasonType
  }

  if (topMatchFactors[0] === 'location' && signals.areaLabel) {
    return 'location_match' satisfies VenueReasonType
  }

  if (topMatchFactors[0] === 'price') {
    return 'price_match' satisfies VenueReasonType
  }

  if (
    !signals.cuisineOverlap &&
    (topMatchFactors.includes('vibe') ||
      topMatchFactors.includes('setting') ||
      topMatchFactors.includes('conversation'))
  ) {
    return 'outside_cuisine_but_vibe_match' satisfies VenueReasonType
  }

  if (topMatchFactors[0] === 'vibe' || topMatchFactors[0] === 'setting') {
    return 'vibe_match' satisfies VenueReasonType
  }

  if (
    topMatchFactors.includes('conversation') ||
    topMatchFactors.includes('social vibe') ||
    signals.socialTags.has('professional') ||
    signals.settingTags.has('restaurant')
  ) {
    return 'occasion_match' satisfies VenueReasonType
  }

  return 'fallback' satisfies VenueReasonType
}

function buildExplanationCandidates(
  reasonType: VenueReasonType,
  profile: ProfileForScoring,
  venue: VenueDataModel,
  traits: VenueTraitsModel,
  topMatchFactors: string[],
  availableEventCount: number
) {
  const signals = getVenueSignals(profile, venue, traits, topMatchFactors, availableEventCount)
  const areaBit = signals.areaLabel ? ` ${signals.areaLabel}` : ''
  const liveCount = `${availableEventCount} hosted ${availableEventCount === 1 ? 'table is' : 'tables are'} live now`

  const candidatesByType: Record<VenueReasonType, string[]> = {
    casual_group_fit: [
      `Bright, casual and social - useful when you want the night to feel easy.`,
      `Casual and easygoing${areaBit ? ` ${signals.areaLabel}` : ''} spot - good for low-pressure group meals when you want the plan to stay easy.`,
      `Casual${areaBit ? ` ${signals.areaLabel}` : ''} pick - good for easy first meets when you want people to say yes without overthinking it.`,
      `${signals.placeLabel} - good for social dinner plans when you want something unfussy and easy to step into.`,
    ],
    fallback: [
      `Worth saving for the overall fit on vibe, setting and price.`,
      `Close enough to your usual save pattern to keep on the list.`,
      `A reasonable fit for the kind of dinner plans you usually keep watching.`,
    ],
    location_match: [
      `Close enough for your ${signals.areaLabel ?? profile.subregion ?? 'current'} search, with the sit-down feel you usually save.`,
      `${signals.placeLabel} - good when location is doing most of the work and you still want the room to feel right.`,
      `Shown because it stays close to your current area focus and still fits the dinner style you tend to save.`,
    ],
    occasion_match: [
      `${signals.placeLabel} - good for ${signals.socialTags.has('professional') ? 'more put-together group dinners' : 'dinner-led catch-ups'} when you want the table to carry the night.`,
      `Better for a more deliberate dinner plan - the kind of place where the night feels anchored by the table.`,
      `A steadier sit-down pick when you want the dinner itself to shape the night.`,
    ],
    outside_cuisine_but_vibe_match: [
      `Not a direct cuisine match, but it fits the relaxed, sit-down pace you tend to go for.`,
      `Outside your usual cuisine picks, but the vibe and setting line up with what you normally save.`,
      `Not a direct cuisine match, but it lands on the room, pace and setting you tend to go for.`,
    ],
    premium_social_fit: [
      `More formal and old-school - better when you want the night to feel properly put together.`,
      `${signals.placeLabel} - good for a more deliberate dinner when you want to spend up a little.`,
      `A sharper dinner-room fit when you want more occasion and less accidental group meal energy.`,
    ],
    price_match: [
      `${signals.placeLabel} - good when spend matters and you still want the night to feel like your kind of place.`,
      `Close to your usual price comfort, without giving up the social shape you tend to save.`,
      `An easier price-fit for the way you usually choose dinner plans.`,
    ],
    saved_with_live_event: [
      `Already on your list, and ${liveCount}.`,
      `Saved already, with ${liveCount} - the match is now secondary to availability.`,
      `You already saved this one, and ${liveCount}.`,
    ],
    vibe_match: [
      `${signals.placeLabel} - good for ${signals.socialTags.has('social') ? 'social dinner plans' : 'the kind of dinner plans you usually save'} when you want ${signals.vibeTags.has('casual') ? 'the group plan to stay easy' : 'the room to feel a little more considered'}.`,
      `${signals.placeLabel} - a better fit on room and setting than on cuisine alone.`,
      `Shown mostly for the feel of the place - it matches the room, pace and setting you tend to prefer.`,
    ],
  }

  return candidatesByType[reasonType]
}

export function pickDistinctExplanation(
  used: Set<string>,
  result: VenueMatchResult,
  context: {
    availableEventCount: number
    profile: ProfileForScoring
    traits: VenueTraitsModel
    venue: VenueDataModel
  }
) {
  const candidates = buildExplanationCandidates(
    result.reasonType,
    context.profile,
    context.venue,
    context.traits,
    result.topMatchFactors,
    context.availableEventCount
  )

  for (const candidate of candidates) {
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
  }

  const fallback = candidates[candidates.length - 1] ?? result.shortMatchReason
  used.add(fallback)
  return fallback
}

export function buildVenueMatchResult(input: {
  availableEventCount: number
  profile: ProfileForScoring
  restaurant: RestaurantVenueInput
  traits: VenueTraitsModel
  venue: VenueDataModel
}): VenueMatchResult {
  const scoringVenue = toScoringVenue(input.profile, input.restaurant, input.traits)
  const score = calculateRestaurantMatchScore(input.profile, scoringVenue)
  const breakdown = buildVenueMatchBreakdown(input.profile, scoringVenue)
  const sortedFactors = Object.entries(breakdown)
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => FACTOR_LABELS[key as keyof typeof FACTOR_LABELS])
  const topMatchFactors = compactTags(sortedFactors).slice(0, 3)
  const matchTags = compactTags([
    ...input.traits.cuisineTags.map(titleCase),
    input.venue.neighbourhood ? titleCase(input.venue.neighbourhood) : null,
    ...input.traits.vibeTags.map(titleCase),
    input.traits.priceBand === '$$' ? 'Moderate' : input.traits.priceBand,
  ].filter((value): value is string => Boolean(value))).slice(0, 4)
  const reasonType = pickReasonType(
    input.profile,
    input.venue,
    input.traits,
    topMatchFactors,
    input.availableEventCount
  )
  const initialReason =
    buildExplanationCandidates(
      reasonType,
      input.profile,
      input.venue,
      input.traits,
      topMatchFactors,
      input.availableEventCount
    )[0] ?? 'Matches enough of your taste profile to be worth saving.'

  return {
    matchScore: score,
    matchTags,
    reasonType,
    shortMatchReason: initialReason,
    topMatchFactors,
  }
}
