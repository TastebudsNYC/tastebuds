import { NextResponse } from 'next/server'

import { requireAdminOrCron } from '@/lib/request-auth'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'
import {
  buildRestaurantGoogleUpdate,
  buildVenueTraitsUpsert,
  deriveVenueTraits,
  fetchVenueEnrichment,
} from '@/lib/venues/enrichment'
import type { RestaurantVenueInput } from '@/lib/venues/types'

type RestaurantPlaceRow = {
  cuisines: string[] | null
  formatted_address: string | null
  google_business_status: string | null
  google_last_synced_at: string | null
  google_live_music: boolean | null
  google_maps_uri: string | null
  google_outdoor_seating: boolean | null
  google_photo_refs: string[] | null
  google_place_id: string | null
  google_price_level: string | null
  google_primary_type: string | null
  google_rating: number | null
  google_types: string[] | null
  google_user_ratings_total: number | null
  google_website_uri: string | null
  id: number
  name: string
  neighbourhood: string | null
  subregion: string
  venue_crowd: string[] | null
  venue_energy: string | null
  venue_formats: string[] | null
  venue_good_for_casual_meetups: boolean | null
  venue_good_for_conversation: boolean | null
  venue_group_friendly: boolean | null
  venue_indoor_outdoor: string[] | null
  venue_latitude?: number
  venue_longitude?: number
  venue_noise_level: string | null
  venue_price: string | null
  venue_scene: string[] | null
  venue_setting: string[] | null
  venue_vibes: string[] | null
}

const REFRESH_LIMIT = 100

async function refreshGooglePlaces(request: Request) {
  const auth = await requireAdminOrCron(request, {
    allowAdmin: true,
    allowCron: true,
  })

  if ('error' in auth) {
    return auth.error
  }

  try {
    const adminClient = createServerSupabaseAdminClient()
    const { data: restaurants, error } = await adminClient
      .from('restaurants')
      .select(
        'cuisines, formatted_address, google_business_status, google_last_synced_at, google_live_music, google_maps_uri, google_outdoor_seating, google_photo_refs, google_place_id, google_price_level, google_primary_type, google_rating, google_types, google_user_ratings_total, google_website_uri, id, name, neighbourhood, subregion, venue_crowd, venue_energy, venue_formats, venue_good_for_casual_meetups, venue_good_for_conversation, venue_group_friendly, venue_indoor_outdoor, venue_latitude, venue_longitude, venue_noise_level, venue_price, venue_scene, venue_setting, venue_vibes'
      )
      .is('archived_at', null)
      .not('google_place_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(REFRESH_LIMIT)
      .returns<RestaurantPlaceRow[]>()

    if (error) {
      throw new Error(error.message)
    }

    const failures: { error: string; restaurantId: number }[] = []
    let updated = 0

    for (const restaurant of restaurants ?? []) {
      const placeId = restaurant.google_place_id

      if (!placeId) {
        continue
      }

      try {
        const enrichment = await fetchVenueEnrichment(placeId)
        const update = buildRestaurantGoogleUpdate(enrichment)

        const { error: restaurantUpdateError } = await adminClient
          .from('restaurants')
          .update(update)
          .eq('id', restaurant.id)

        if (restaurantUpdateError) {
          throw new Error(restaurantUpdateError.message)
        }

        const derivedTraits = deriveVenueTraits({
          ...(restaurant as RestaurantVenueInput),
          google_business_status: enrichment.businessStatus,
          google_maps_uri: enrichment.googleMapsUri,
          google_photo_refs: enrichment.photoRefs,
          google_place_id: enrichment.googlePlaceId,
          google_price_level: enrichment.rawGooglePriceLevel,
          google_primary_type: enrichment.primaryType,
          google_rating: enrichment.googleRating,
          google_types: enrichment.types,
          google_user_ratings_total: enrichment.googleReviewCount,
          google_website_uri: enrichment.websiteUri,
          venue_latitude: enrichment.location?.lat ?? restaurant.venue_latitude ?? null,
          venue_longitude: enrichment.location?.lng ?? restaurant.venue_longitude ?? null,
        })

        const { error: traitsError } = await adminClient
          .from('venue_traits')
          .upsert(buildVenueTraitsUpsert(restaurant.id, derivedTraits), {
            onConflict: 'restaurant_id',
          })

        if (traitsError) {
          throw new Error(traitsError.message)
        }

        updated += 1
      } catch (refreshError) {
        failures.push({
          error:
            refreshError instanceof Error
              ? refreshError.message
              : 'Google refresh failed.',
          restaurantId: restaurant.id,
        })
      }
    }

    return NextResponse.json({
      failed: failures.length,
      failures,
      ok: true,
      updated,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to refresh Google place data.',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  return refreshGooglePlaces(request)
}

export async function POST(request: Request) {
  return refreshGooglePlaces(request)
}
