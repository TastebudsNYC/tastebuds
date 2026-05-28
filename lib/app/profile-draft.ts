import type { SupabaseClient } from '@supabase/supabase-js'

import {
  normalizeAgeRangeComfortList,
  normalizeConversationPreferenceList,
  normalizeCrowdList,
  normalizeDietaryRestrictionList,
  normalizeDrinkingPreferenceList,
  normalizeEnergyList,
  normalizeGroupSizeComfortList,
  normalizeMusicList,
  normalizePriceList,
  normalizeSceneList,
  normalizeSettingList,
  normalizeVibeList,
  parseCuisinePreferenceInput,
} from '@/lib/events'
import type { Profile } from '@/lib/app/types'

export const SUBREGIONS = ['Uptown', 'Midtown', 'Downtown'] as const
export const TRAVEL_WINDOWS = [15, 30, 45] as const

export type ProfileDraft = {
  ageRangeComfort: string[]
  bio: string
  conversationPreference: string[]
  cuisinePreferences: string
  dietaryRestrictions: string[]
  displayName: string
  drinkingPreferences: string[]
  groupSizeComfort: string[]
  homeAnchorQuery: string
  homeLatitude: string
  homeLongitude: string
  maxTravelMinutes: (typeof TRAVEL_WINDOWS)[number]
  neighbourhood: string
  preferredCrowd: string[]
  preferredEnergy: string[]
  preferredMusic: string[]
  preferredPrice: string[]
  preferredScene: string[]
  preferredSetting: string[]
  preferredVibes: string[]
  profilePhotoUrl: string
  subregion: (typeof SUBREGIONS)[number]
}

function normalizeSavedNeighbourhood(value: string | null | undefined) {
  const normalized = value?.trim() || ''

  if (['manhattan', 'new york', 'new york county'].includes(normalized.toLowerCase())) {
    return ''
  }

  return normalized
}

export function getSavedHomeAreaLabel(
  neighbourhood: string | null | undefined,
  subregion: string | null | undefined
) {
  const normalizedNeighbourhood = normalizeSavedNeighbourhood(neighbourhood)

  if (normalizedNeighbourhood) {
    return normalizedNeighbourhood
  }

  if (subregion) {
    return subregion
  }

  return ''
}

export function createEmptyProfileDraft(): ProfileDraft {
  return {
    ageRangeComfort: [],
    bio: '',
    conversationPreference: [],
    cuisinePreferences: '',
    dietaryRestrictions: ['No dietary restrictions'],
    displayName: '',
    drinkingPreferences: [],
    groupSizeComfort: [],
    homeAnchorQuery: '',
    homeLatitude: '',
    homeLongitude: '',
    maxTravelMinutes: 30,
    neighbourhood: '',
    preferredCrowd: [],
    preferredEnergy: [],
    preferredMusic: [],
    preferredPrice: [],
    preferredScene: [],
    preferredSetting: [],
    preferredVibes: [],
    profilePhotoUrl: '',
    subregion: 'Midtown',
  }
}

export function profileToDraft(profile: Profile | null | undefined): ProfileDraft {
  if (!profile) {
    return createEmptyProfileDraft()
  }

  return {
    ageRangeComfort: normalizeAgeRangeComfortList(profile.age_range_comfort),
    bio: profile.bio ?? '',
    conversationPreference: normalizeConversationPreferenceList(
      profile.conversation_preference
    ),
    cuisinePreferences: (profile.cuisine_preferences ?? []).join(', '),
    dietaryRestrictions: normalizeDietaryRestrictionList(profile.dietary_restrictions),
    displayName: profile.display_name ?? '',
    drinkingPreferences: normalizeDrinkingPreferenceList(profile.drinking_preferences),
    groupSizeComfort: normalizeGroupSizeComfortList(profile.group_size_comfort),
    homeAnchorQuery: getSavedHomeAreaLabel(profile.neighbourhood, profile.subregion),
    homeLatitude:
      profile.home_latitude === null || profile.home_latitude === undefined
        ? ''
        : String(profile.home_latitude),
    homeLongitude:
      profile.home_longitude === null || profile.home_longitude === undefined
        ? ''
        : String(profile.home_longitude),
    maxTravelMinutes:
      profile.max_travel_minutes &&
      TRAVEL_WINDOWS.includes(profile.max_travel_minutes as (typeof TRAVEL_WINDOWS)[number])
        ? (profile.max_travel_minutes as (typeof TRAVEL_WINDOWS)[number])
        : 30,
    neighbourhood: normalizeSavedNeighbourhood(profile.neighbourhood),
    preferredCrowd: normalizeCrowdList(profile.preferred_crowd),
    preferredEnergy: normalizeEnergyList(profile.preferred_energy),
    preferredMusic: normalizeMusicList(profile.preferred_music),
    preferredPrice: normalizePriceList(profile.preferred_price),
    preferredScene: normalizeSceneList(profile.preferred_scene),
    preferredSetting: normalizeSettingList(profile.preferred_setting),
    preferredVibes: normalizeVibeList(profile.preferred_vibes),
    profilePhotoUrl: profile.profile_photo_url ?? '',
    subregion:
      profile.subregion && SUBREGIONS.includes(profile.subregion as (typeof SUBREGIONS)[number])
        ? (profile.subregion as (typeof SUBREGIONS)[number])
        : 'Midtown',
  }
}

export function summarizeProfileDraft(draft: ProfileDraft) {
  const area = draft.homeAnchorQuery.trim() || draft.subregion
  const cuisine = parseCuisinePreferenceInput(draft.cuisinePreferences)[0] ?? 'good food'
  const setting = draft.preferredSetting[0] ?? 'Restaurant'
  const groupSize = draft.groupSizeComfort[0] ?? '2-4'
  const lead =
    draft.preferredVibes[0] ??
    draft.preferredScene[0] ??
    draft.preferredEnergy[0] ??
    'Easy'

  return `${lead} and ${area}-led. You tend to prefer ${cuisine}, ${setting.toLowerCase()} settings and ${groupSize} tables that feel easy to say yes to.`
}

export function validateCoordinates(draft: ProfileDraft) {
  const latitude = Number(draft.homeLatitude)
  const longitude = Number(draft.homeLongitude)

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  return { latitude, longitude }
}

export async function saveProfileDraft(
  supabase: SupabaseClient,
  userId: string,
  draft: ProfileDraft
) {
  const coordinates = validateCoordinates(draft)

  if (!coordinates) {
    throw new Error(
      'We couldn’t find that area. Try a nearby city, neighbourhood or fuller address.'
    )
  }

  const { error } = await supabase.from('profiles').upsert({
    age_range_comfort: draft.ageRangeComfort,
    bio: draft.bio.trim() || null,
    conversation_preference: draft.conversationPreference,
    cuisine_preferences: parseCuisinePreferenceInput(draft.cuisinePreferences),
    dietary_restrictions: draft.dietaryRestrictions,
    display_name: draft.displayName.trim(),
    drinking_preferences: draft.drinkingPreferences,
    group_size_comfort: draft.groupSizeComfort,
    home_latitude: coordinates.latitude,
    home_longitude: coordinates.longitude,
    id: userId,
    intent: 'friendship',
    max_travel_minutes: draft.maxTravelMinutes,
    neighbourhood: draft.neighbourhood.trim() || null,
    preferred_crowd: draft.preferredCrowd,
    preferred_energy: draft.preferredEnergy,
    preferred_music: draft.preferredMusic,
    preferred_price: draft.preferredPrice,
    preferred_scene: draft.preferredScene,
    preferred_setting: draft.preferredSetting,
    preferred_vibes: draft.preferredVibes,
    profile_photo_url: draft.profilePhotoUrl.trim() || null,
    subregion: draft.subregion,
  })

  if (error) {
    throw new Error(error.message)
  }
}
