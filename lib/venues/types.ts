import type { ProfileForScoring } from '@/lib/events'

export type VenueDataModel = {
  businessStatus: string | null
  formattedAddress: string | null
  googleMapsUri: string | null
  googlePlaceId: string | null
  googleRating: number | null
  googleReviewCount: number | null
  lastSyncedAt: string | null
  location: { lat: number; lng: number } | null
  name: string
  neighbourhood: string | null
  photoRefs: string[]
  priceLevel: string | null
  primaryType: string | null
  types: string[]
  websiteUri: string | null
}

export type VenueTraitsModel = {
  confidenceScore: number
  cuisineTags: string[]
  generatedAt: string
  priceBand: string | null
  settingTags: string[]
  socialFitTags: string[]
  source: string
  vibeTags: string[]
}

export type VenueMatchResult = {
  matchScore: number
  matchTags: string[]
  reasonType:
    | 'vibe_match'
    | 'occasion_match'
    | 'location_match'
    | 'price_match'
    | 'saved_with_live_event'
    | 'outside_cuisine_but_vibe_match'
    | 'casual_group_fit'
    | 'premium_social_fit'
    | 'fallback'
  shortMatchReason: string
  topMatchFactors: string[]
}

export type RestaurantVenueInput = {
  cuisines: string[] | null
  formatted_address: string | null
  google_business_status?: string | null
  google_editorial_summary?: string | null
  google_good_for_groups?: boolean | null
  google_live_music?: boolean | null
  google_maps_uri: string | null
  google_outdoor_seating?: boolean | null
  google_photo_refs?: string[] | null
  google_place_id: string | null
  google_price_level: string | null
  google_primary_type?: string | null
  google_rating: number | null
  google_types?: string[] | null
  google_user_ratings_total: number | null
  google_website_uri: string | null
  name: string
  neighbourhood: string | null
  subregion: string
  venue_crowd: string[] | null
  venue_energy: string | null
  venue_formats?: string[] | null
  venue_good_for_casual_meetups?: boolean | null
  venue_good_for_conversation?: boolean | null
  venue_group_friendly?: boolean | null
  venue_indoor_outdoor?: string[] | null
  venue_latitude: number | null
  venue_longitude: number | null
  venue_noise_level?: string | null
  venue_price: string | null
  venue_scene: string[] | null
  venue_setting: string[] | null
  venue_vibes?: string[] | null
}

export type VenueTraitsRow = {
  confidence_score: number | null
  cuisine_tags: string[] | null
  generated_at: string
  price_band: string | null
  restaurant_id: number
  setting_tags: string[] | null
  social_fit_tags: string[] | null
  source: string | null
  vibe_tags: string[] | null
}

export type VenueEnrichmentContext = {
  availableEventCount?: number
  profile: ProfileForScoring
  traits: VenueTraitsModel
  venue: VenueDataModel
}
