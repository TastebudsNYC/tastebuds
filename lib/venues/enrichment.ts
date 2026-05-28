import 'server-only'

import { getRestaurantGoogleDetails } from '@/lib/google-places'
import {
  normalizeCuisineList,
  normalizePriceList,
  normalizeSceneList,
  normalizeSettingList,
  normalizeVibeList,
} from '@/lib/events'
import type {
  RestaurantVenueInput,
  VenueDataModel,
  VenueTraitsModel,
  VenueTraitsRow,
} from '@/lib/venues/types'

function mapGooglePriceLevel(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.trim().toUpperCase()
  const mapped: Record<string, '$' | '$$' | '$$$' | '$$$$'> = {
    PRICE_LEVEL_CHEAP: '$',
    PRICE_LEVEL_EXPENSIVE: '$$$',
    PRICE_LEVEL_FREE: '$',
    PRICE_LEVEL_INEXPENSIVE: '$',
    PRICE_LEVEL_MODERATE: '$$',
    PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
  }

  return mapped[normalized] ?? (normalizePriceList([value])[0] ?? null)
}

function compactUnique(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const value of values) {
    const next = value?.trim()

    if (!next) {
      continue
    }

    const lower = next.toLowerCase()

    if (seen.has(lower)) {
      continue
    }

    seen.add(lower)
    normalized.push(next)
  }

  return normalized
}

export function buildVenueDataModel(restaurant: RestaurantVenueInput): VenueDataModel {
  return {
    businessStatus: restaurant.google_business_status ?? null,
    formattedAddress: restaurant.formatted_address,
    googleMapsUri: restaurant.google_maps_uri,
    googlePlaceId: restaurant.google_place_id,
    googleRating: restaurant.google_rating,
    googleReviewCount: restaurant.google_user_ratings_total,
    lastSyncedAt: null,
    location:
      restaurant.venue_latitude !== null && restaurant.venue_longitude !== null
        ? { lat: restaurant.venue_latitude, lng: restaurant.venue_longitude }
        : null,
    name: restaurant.name,
    neighbourhood: restaurant.neighbourhood ?? restaurant.subregion,
    photoRefs: restaurant.google_photo_refs ?? [],
    priceLevel: restaurant.google_price_level,
    primaryType: restaurant.google_primary_type ?? null,
    types: restaurant.google_types ?? [],
    websiteUri: restaurant.google_website_uri,
  }
}

export function deriveVenueTraits(restaurant: RestaurantVenueInput): VenueTraitsModel {
  const cuisineTags = normalizeCuisineList(restaurant.cuisines)
  const vibeTags = compactUnique([
    ...normalizeVibeList(restaurant.venue_vibes),
    restaurant.venue_energy === 'Chill' ? 'Casual' : null,
    restaurant.venue_energy === 'High' ? 'Lively' : null,
    restaurant.google_live_music ? 'Live music' : null,
    restaurant.venue_good_for_casual_meetups ? 'Casual' : null,
  ])
  const settingTags = compactUnique([
    ...normalizeSettingList(restaurant.venue_setting),
    ...(restaurant.venue_formats ?? []),
    ...(restaurant.venue_indoor_outdoor ?? []),
    restaurant.google_outdoor_seating ? 'Outdoor' : null,
  ])
  const socialFitTags = compactUnique([
    ...normalizeSceneList(restaurant.venue_scene),
    ...(restaurant.venue_crowd ?? []),
    restaurant.venue_group_friendly ? 'Group-friendly' : null,
    restaurant.venue_good_for_conversation ? 'Conversation-first' : null,
  ])
  const presentBuckets = [
    cuisineTags.length > 0,
    vibeTags.length > 0,
    settingTags.length > 0,
    socialFitTags.length > 0,
    Boolean(restaurant.venue_price ?? mapGooglePriceLevel(restaurant.google_price_level)),
    Boolean(restaurant.google_rating),
  ].filter(Boolean).length

  return {
    confidenceScore: Math.max(0.2, Math.min(1, presentBuckets / 6)),
    cuisineTags,
    generatedAt: new Date().toISOString(),
    priceBand: restaurant.venue_price ?? mapGooglePriceLevel(restaurant.google_price_level),
    settingTags,
    socialFitTags,
    source: 'google_places+rules',
    vibeTags,
  }
}

export function mapVenueTraitsRow(row: VenueTraitsRow | undefined | null) {
  if (!row) {
    return null
  }

  return {
    confidenceScore: row.confidence_score ?? 0.5,
    cuisineTags: row.cuisine_tags ?? [],
    generatedAt: row.generated_at,
    priceBand: row.price_band,
    settingTags: row.setting_tags ?? [],
    socialFitTags: row.social_fit_tags ?? [],
    source: row.source ?? 'google_places+rules',
    vibeTags: row.vibe_tags ?? [],
  } satisfies VenueTraitsModel
}

export async function fetchVenueEnrichment(placeId: string) {
  const details = await getRestaurantGoogleDetails(placeId)

  return {
    businessStatus: details.businessStatus ?? null,
    formattedAddress: details.formattedAddress,
    googleMapsUri: details.googleMapsUri,
    googlePlaceId: details.id ?? placeId,
    googleRating: details.rating,
    googleReviewCount: details.userRatingCount,
    lastSyncedAt: new Date().toISOString(),
    location:
      typeof details.latitude === 'number' && typeof details.longitude === 'number'
        ? { lat: details.latitude, lng: details.longitude }
        : null,
    name: details.name ?? null,
    photoRefs: details.photoRefs,
    priceLevel: mapGooglePriceLevel(details.priceLevel),
    primaryType: details.primaryType ?? null,
    rawGooglePriceLevel: details.priceLevel ?? null,
    types: details.types,
    websiteUri: details.websiteUri,
  }
}

export function buildRestaurantGoogleUpdate(
  enrichment: Awaited<ReturnType<typeof fetchVenueEnrichment>>
) {
  return {
    formatted_address: enrichment.formattedAddress,
    google_business_status: enrichment.businessStatus,
    google_last_synced_at: enrichment.lastSyncedAt,
    google_maps_uri: enrichment.googleMapsUri,
    google_photo_refs: enrichment.photoRefs,
    google_place_id: enrichment.googlePlaceId,
    google_price_level: enrichment.rawGooglePriceLevel,
    google_primary_type: enrichment.primaryType,
    google_rating: enrichment.googleRating,
    google_types: enrichment.types,
    google_user_ratings_total: enrichment.googleReviewCount,
    google_website_uri: enrichment.websiteUri,
    ...(enrichment.location ? { venue_latitude: enrichment.location.lat } : {}),
    ...(enrichment.location ? { venue_longitude: enrichment.location.lng } : {}),
  }
}

export function buildVenueTraitsUpsert(restaurantId: number, traits: VenueTraitsModel) {
  return {
    confidence_score: Number(traits.confidenceScore.toFixed(2)),
    cuisine_tags: traits.cuisineTags,
    generated_at: traits.generatedAt,
    price_band: traits.priceBand,
    restaurant_id: restaurantId,
    setting_tags: traits.settingTags,
    social_fit_tags: traits.socialFitTags,
    source: traits.source,
    vibe_tags: traits.vibeTags,
  }
}
