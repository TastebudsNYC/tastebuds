'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { Button } from '@/components/app/Button'
import { ProfileAvatar } from '@/components/app/ProfileAvatar'
import { useToast } from '@/components/app/ToastProvider'
import {
  LocationSearchField,
  type LocationSuggestion,
} from '@/components/location-search-field'
import { clearAppBootstrapCache, getAppBootstrap } from '@/lib/app/client'
import {
  AGE_RANGE_COMFORT_TAGS,
  CROWD_TAGS,
  CONVERSATION_ACTIVITY_TAGS,
  DIETARY_RESTRICTION_TAGS,
  DRINKING_PREFERENCE_TAGS,
  ENERGY_LEVELS,
  GROUP_SIZE_COMFORT_TAGS,
  MUSIC_TAGS,
  PRICE_TAGS,
  SCENE_TAGS,
  SETTING_TAGS,
  VIBE_TAGS,
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
import { supabase } from '@/lib/supabase/client'

const SUBREGIONS = ['Uptown', 'Midtown', 'Downtown'] as const
const TRAVEL_WINDOWS = [15, 30, 45] as const
const SECTION_LINKS = [
  ['Basics', 'profile-basics'],
  ['Location', 'profile-location'],
  ['Food', 'profile-food'],
  ['Dinner vibe', 'profile-vibe'],
  ['Social', 'profile-social'],
] as const

type ProfileSnapshot = {
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

function getSavedHomeAreaLabel(
  neighbourhood: string | null | undefined,
  subregion: string | null | undefined
) {
  const normalizedNeighbourhood = normalizeSavedNeighbourhood(neighbourhood)

  if (normalizedNeighbourhood) {
    return normalizedNeighbourhood
  }

  if (subregion) {
    return `${subregion}, Manhattan`
  }

  return ''
}

function toggleValue(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value]
}

function isValidProfilePhotoUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function PreferenceGroup({
  description,
  label,
  onToggle,
  options,
  selected,
}: {
  description?: string
  label: string
  onToggle: (value: string) => void
  options: readonly string[]
  selected: string[]
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">{label}</p>
      {description ? <p className="tb-copy text-sm leading-6">{description}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option)

          return (
            <button
              className={
                active
                  ? 'tb-interactive-chip tb-chip-selected rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-[color:var(--accent-text)] shadow-[0_10px_20px_rgba(245,158,11,0.3)] transition'
                  : 'tb-interactive-chip rounded-full border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--text-muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]'
              }
              key={option}
              onClick={() => onToggle(option)}
              type="button"
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProfileSection({
  children,
  description,
  id,
  title,
}: {
  children: React.ReactNode
  description: string
  id: string
  title: string
}) {
  return (
    <section
      className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 shadow-[0_18px_44px_rgba(74,31,20,0.07)]"
      id={id}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">{title}</h2>
      <p className="tb-copy mt-2 text-sm leading-6">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function summarizeTaste(snapshot: ProfileSnapshot) {
  const location = snapshot.neighbourhood || snapshot.subregion
  const vibe = snapshot.preferredVibes[0] ?? snapshot.preferredScene[0] ?? 'social'
  const energy = snapshot.preferredEnergy[0] ?? 'Moderate'
  const cuisine = parseCuisinePreferenceInput(snapshot.cuisinePreferences)[0] ?? 'varied'
  const setting = snapshot.preferredSetting[0] ?? 'Restaurant'
  const vibeLead =
    vibe.toLowerCase() === energy.toLowerCase() ? vibe : `${vibe}, ${energy.toLowerCase()}`

  return `${vibeLead} and ${location}-led. You tend to prefer ${cuisine}, ${setting.toLowerCase()} settings and smaller dinners that still feel easy to say yes to.`
}

function summarizeImpact(snapshot: ProfileSnapshot) {
  const location = snapshot.subregion || 'Midtown'
  const vibe = snapshot.preferredVibes[0] ?? 'relaxed'

  return `This may move more ${vibe.toLowerCase()} ${location} restaurants and hosted tables higher in your matches.`
}

export function ProfileEditor({
  backHref,
  backLabel,
  description,
  embedded = false,
  eyebrow,
  redirectTo,
  title,
}: {
  backHref: string
  backLabel: string
  description: string
  embedded?: boolean
  eyebrow: string
  redirectTo: string
  title: string
}) {
  const router = useRouter()
  const { pushToast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [subregion, setSubregion] = useState<(typeof SUBREGIONS)[number]>('Midtown')
  const [neighbourhood, setNeighbourhood] = useState('')
  const [maxTravelMinutes, setMaxTravelMinutes] = useState<(typeof TRAVEL_WINDOWS)[number]>(30)
  const [homeAnchorQuery, setHomeAnchorQuery] = useState('')
  const [homeLatitude, setHomeLatitude] = useState('')
  const [homeLongitude, setHomeLongitude] = useState('')
  const [preferredEnergy, setPreferredEnergy] = useState<string[]>([])
  const [preferredScene, setPreferredScene] = useState<string[]>([])
  const [preferredCrowd, setPreferredCrowd] = useState<string[]>([])
  const [preferredMusic, setPreferredMusic] = useState<string[]>([])
  const [preferredSetting, setPreferredSetting] = useState<string[]>([])
  const [preferredPrice, setPreferredPrice] = useState<string[]>([])
  const [preferredVibes, setPreferredVibes] = useState<string[]>([])
  const [drinkingPreferences, setDrinkingPreferences] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [conversationPreference, setConversationPreference] = useState<string[]>([])
  const [ageRangeComfort, setAgeRangeComfort] = useState<string[]>([])
  const [groupSizeComfort, setGroupSizeComfort] = useState<string[]>([])
  const [cuisinePreferences, setCuisinePreferences] = useState('')
  const [bio, setBio] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [initialSnapshot, setInitialSnapshot] = useState<ProfileSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  function buildSnapshot(): ProfileSnapshot {
    return {
      ageRangeComfort,
      bio,
      conversationPreference,
      cuisinePreferences,
      dietaryRestrictions,
      displayName,
      drinkingPreferences,
      groupSizeComfort,
      homeAnchorQuery,
      homeLatitude,
      homeLongitude,
      maxTravelMinutes,
      neighbourhood,
      preferredCrowd,
      preferredEnergy,
      preferredMusic,
      preferredPrice,
      preferredScene,
      preferredSetting,
      preferredVibes,
      profilePhotoUrl,
      subregion,
    }
  }

  function applySnapshot(snapshot: ProfileSnapshot) {
    setDisplayName(snapshot.displayName)
    setSubregion(snapshot.subregion)
    setNeighbourhood(snapshot.neighbourhood)
    setMaxTravelMinutes(snapshot.maxTravelMinutes)
    setHomeAnchorQuery(snapshot.homeAnchorQuery)
    setHomeLatitude(snapshot.homeLatitude)
    setHomeLongitude(snapshot.homeLongitude)
    setPreferredEnergy(snapshot.preferredEnergy)
    setPreferredScene(snapshot.preferredScene)
    setPreferredCrowd(snapshot.preferredCrowd)
    setPreferredMusic(snapshot.preferredMusic)
    setPreferredSetting(snapshot.preferredSetting)
    setPreferredPrice(snapshot.preferredPrice)
    setPreferredVibes(snapshot.preferredVibes)
    setDrinkingPreferences(snapshot.drinkingPreferences)
    setDietaryRestrictions(snapshot.dietaryRestrictions)
    setConversationPreference(snapshot.conversationPreference)
    setAgeRangeComfort(snapshot.ageRangeComfort)
    setGroupSizeComfort(snapshot.groupSizeComfort)
    setCuisinePreferences(snapshot.cuisinePreferences)
    setBio(snapshot.bio)
    setProfilePhotoUrl(snapshot.profilePhotoUrl)
  }

  useEffect(() => {
    let active = true

    async function loadProfile() {
      let bootstrap

      try {
        bootstrap = await getAppBootstrap()
      } catch {
        if (active) {
          router.replace('/login')
        }
        return
      }

      if (!active) {
        return
      }

      setUserId(bootstrap.userId)

      const profile = bootstrap.profile
      if (profile) {
        const nextSnapshot = {
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
        } satisfies ProfileSnapshot

        applySnapshot(nextSnapshot)
        setInitialSnapshot(nextSnapshot)
      }

      setLoading(false)
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [router])

  function applyHomeAnchorSuggestion(suggestion: LocationSuggestion) {
    setHomeAnchorQuery(suggestion.label)
    setHomeLatitude(String(suggestion.latitude))
    setHomeLongitude(String(suggestion.longitude))
    setNeighbourhood(suggestion.neighbourhood ?? '')
    setSubregion(suggestion.subregion)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) {
      setError('You need to be logged in before saving a profile.')
      return
    }

    if (
      preferredEnergy.length === 0 ||
      preferredScene.length === 0 ||
      preferredCrowd.length === 0 ||
      preferredMusic.length === 0 ||
      preferredSetting.length === 0 ||
      preferredPrice.length === 0 ||
      preferredVibes.length === 0 ||
      drinkingPreferences.length === 0 ||
      dietaryRestrictions.length === 0 ||
      conversationPreference.length === 0 ||
      ageRangeComfort.length === 0 ||
      groupSizeComfort.length === 0
    ) {
      setError('Complete each section before saving your taste profile.')
      return
    }

    const parsedHomeLatitude = Number(homeLatitude)
    const parsedHomeLongitude = Number(homeLongitude)

    if (
      !Number.isFinite(parsedHomeLatitude) ||
      parsedHomeLatitude < -90 ||
      parsedHomeLatitude > 90 ||
      !Number.isFinite(parsedHomeLongitude) ||
      parsedHomeLongitude < -180 ||
      parsedHomeLongitude > 180
    ) {
      setError('Choose a valid home area from the location search before saving.')
      return
    }

    const trimmedProfilePhotoUrl = profilePhotoUrl.trim()

    if (trimmedProfilePhotoUrl && !isValidProfilePhotoUrl(trimmedProfilePhotoUrl)) {
      setError('Profile photo must use a valid http or https image URL.')
      return
    }

    setSaving(true)
    setError('')
    setSaveMessage('')

    const { error: upsertError } = await supabase.from('profiles').upsert({
      age_range_comfort: ageRangeComfort,
      id: userId,
      bio: bio.trim() || null,
      city: 'New York City',
      conversation_preference: conversationPreference,
      cuisine_preferences: parseCuisinePreferenceInput(cuisinePreferences),
      dietary_restrictions: dietaryRestrictions,
      display_name: displayName.trim(),
      drinking_preferences: drinkingPreferences,
      group_size_comfort: groupSizeComfort,
      home_latitude: parsedHomeLatitude,
      home_longitude: parsedHomeLongitude,
      intent: 'friendship',
      max_travel_minutes: maxTravelMinutes,
      neighbourhood: neighbourhood.trim() || null,
      preferred_crowd: preferredCrowd,
      preferred_energy: preferredEnergy,
      preferred_music: preferredMusic,
      preferred_price: preferredPrice,
      preferred_scene: preferredScene,
      preferred_setting: preferredSetting,
      preferred_vibes: preferredVibes,
      profile_photo_url: trimmedProfilePhotoUrl || null,
      region: 'Manhattan',
      subregion,
    })

    setSaving(false)

    if (upsertError) {
      setError(upsertError.message)
      return
    }

    const nextSnapshot = buildSnapshot()
    setInitialSnapshot(nextSnapshot)
    setSaveMessage(summarizeImpact(nextSnapshot))
    clearAppBootstrapCache()
    pushToast({
      description: 'Your matches have been retuned.',
      title: 'Profile saved.',
    })

    if (redirectTo !== '/profile') {
      router.replace(redirectTo)
    }
  }

  if (loading) {
    if (!embedded) {
      return <AppPageSkeleton currentPath="/profile" title="Profile" variant="form" />
    }

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="tb-skeleton h-4 w-20 rounded-full" />
          <div className="tb-skeleton h-12 w-72 rounded-2xl" />
          <div className="tb-skeleton h-4 w-full max-w-2xl rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="tb-skeleton hidden h-56 rounded-2xl lg:block" />
          <div className="space-y-6">
            <div className="tb-skeleton h-40 rounded-2xl" />
            <div className="tb-skeleton h-80 rounded-2xl" />
            <div className="tb-skeleton h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const snapshot = buildSnapshot()
  const hasUnsavedChanges =
    initialSnapshot !== null && JSON.stringify(snapshot) !== JSON.stringify(initialSnapshot)

  const content = (
    <>
      <div className="max-w-3xl">
        <p className="tb-label text-sm font-semibold uppercase tracking-[0.2em]">{eyebrow}</p>
        <h1 className="mt-3 text-[2.5rem] font-bold leading-none tracking-[-0.04em] text-[color:var(--foreground)] sm:text-[3.25rem]">
          {title}
        </h1>
        <p className="tb-copy mt-4 max-w-2xl text-base leading-7">{description}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              Sections
            </p>
            <nav className="mt-4 space-y-2">
              {SECTION_LINKS.map(([label, id]) => (
                <a
                  className="block rounded-full px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-soft)]"
                  href={`#${id}`}
                  key={id}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-6 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                  Your current taste
                </p>
                <p className="mt-3 text-lg leading-8 text-[color:var(--foreground)]">
                  {summarizeTaste(snapshot)}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
                  {summarizeImpact(snapshot)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="#profile-basics" variant="secondary">
                  Edit basics
                </Button>
                <Button href="/restaurants" variant="secondary">
                  Preview matches
                </Button>
              </div>
            </div>
          </section>

          <form className="space-y-8" onSubmit={handleSave}>
            <ProfileSection
              description="Set the basics that shape how your profile reads back to you."
              id="profile-basics"
              title="Basics"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Display name</span>
                  <input
                    className="tb-input"
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Alex"
                    required
                    value={displayName}
                  />
                </label>

                <div className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Current mode</span>
                  <div className="tb-input flex items-center bg-[color:var(--surface-soft)] text-[color:var(--foreground)]">
                    Friendship
                  </div>
                  <span className="tb-label text-xs">
                    This affects the kind of tables and groups we prioritise.
                  </span>
                </div>

                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Profile photo</span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <ProfileAvatar
                      className="h-16 w-16"
                      displayName={displayName.trim() || 'You'}
                      photoUrl={profilePhotoUrl}
                      textClassName="text-lg font-semibold"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        className="tb-input"
                        onChange={(event) => setProfilePhotoUrl(event.target.value)}
                        placeholder="https://example.com/your-photo.jpg"
                        value={profilePhotoUrl}
                      />
                      <span className="tb-label text-xs">Paste image URL for now.</span>
                    </div>
                  </div>
                </label>

                <label className="block space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    A quick line about your ideal night
                  </span>
                  <textarea
                    className="tb-input min-h-28 rounded-3xl"
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="Low-key dinner, good food, easy conversation."
                    value={bio}
                  />
                  <span className="tb-label text-xs">
                    Optional. Helps explain your matches.
                  </span>
                </label>
              </div>
            </ProfileSection>

            <ProfileSection
              description="Use a rough home area so nearby tables are weighted properly."
              id="profile-location"
              title="Location and travel"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <LocationSearchField
                  description="Search a Manhattan address or neighbourhood. Picking a result fills the nearby area and map point."
                  label="Home area"
                  onPick={applyHomeAnchorSuggestion}
                  placeholder="77 Bedford St, West Village"
                  query={homeAnchorQuery}
                  setQuery={setHomeAnchorQuery}
                />

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Neighbourhood</span>
                  <input
                    className="tb-input"
                    onChange={(event) => setNeighbourhood(event.target.value)}
                    placeholder="Long Island City"
                    value={neighbourhood}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Preferred area</span>
                  <select
                    className="tb-input"
                    onChange={(event) => setSubregion(event.target.value as (typeof SUBREGIONS)[number])}
                    value={subregion}
                  >
                    {SUBREGIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Willingness to travel</span>
                  <select
                    className="tb-input"
                    onChange={(event) =>
                      setMaxTravelMinutes(Number(event.target.value) as (typeof TRAVEL_WINDOWS)[number])
                    }
                    value={maxTravelMinutes}
                  >
                    {TRAVEL_WINDOWS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </ProfileSection>

            <ProfileSection
              description="Tell us what you actually like eating and what feels comfortable to spend."
              id="profile-food"
              title="Food preferences"
            >
              <div className="space-y-6">
                <PreferenceGroup
                  description="Pick one or more price bands that feel right for a normal dinner out."
                  label="Price comfort"
                  onToggle={(value) => setPreferredPrice((current) => toggleValue(current, value))}
                  options={PRICE_TAGS}
                  selected={preferredPrice}
                />

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">Preferred cuisines</span>
                  <input
                    className="tb-input"
                    onChange={(event) => setCuisinePreferences(event.target.value)}
                    placeholder="Italian, French, Thai"
                    value={cuisinePreferences}
                  />
                  <span className="tb-label text-xs">
                    Add the cuisines you would genuinely be happy to book.
                  </span>
                </label>

                <PreferenceGroup
                  description="Add any dietary needs that should materially change what rises to the top."
                  label="Dietary requirements"
                  onToggle={(value) =>
                    setDietaryRestrictions((current) => toggleValue(current, value))
                  }
                  options={DIETARY_RESTRICTION_TAGS}
                  selected={dietaryRestrictions}
                />

                <PreferenceGroup
                  description="Useful for sorting out the right table tone around the meal."
                  label="Drinks"
                  onToggle={(value) =>
                    setDrinkingPreferences((current) => toggleValue(current, value))
                  }
                  options={DRINKING_PREFERENCE_TAGS}
                  selected={drinkingPreferences}
                />
              </div>
            </ProfileSection>

            <ProfileSection
              description="These choices shape the room and pace more than the menu."
              id="profile-vibe"
              title="Dinner vibe"
            >
              <div className="grid gap-6">
                <PreferenceGroup
                  description="Quiet catch-up, moderate room, or something louder."
                  label="Energy"
                  onToggle={(value) => setPreferredEnergy((current) => toggleValue(current, value))}
                  options={ENERGY_LEVELS}
                  selected={preferredEnergy}
                />
                <PreferenceGroup
                  description="The kind of plan you are usually in the mood for."
                  label="Scene"
                  onToggle={(value) => setPreferredScene((current) => toggleValue(current, value))}
                  options={SCENE_TAGS}
                  selected={preferredScene}
                />
                <PreferenceGroup
                  description="How much music you want around the table."
                  label="Music"
                  onToggle={(value) => setPreferredMusic((current) => toggleValue(current, value))}
                  options={MUSIC_TAGS}
                  selected={preferredMusic}
                />
                <PreferenceGroup
                  description="The spaces that usually fit your best nights."
                  label="Setting"
                  onToggle={(value) => setPreferredSetting((current) => toggleValue(current, value))}
                  options={SETTING_TAGS}
                  selected={preferredSetting}
                />
                <PreferenceGroup
                  description="The overall feeling once food, crowd and setting come together."
                  label="Atmosphere and occasion"
                  onToggle={(value) => setPreferredVibes((current) => toggleValue(current, value))}
                  options={VIBE_TAGS}
                  selected={preferredVibes}
                />
              </div>
            </ProfileSection>

            <ProfileSection
              description="The goal is a table that feels comfortable, not just an address that looks good."
              id="profile-social"
              title="Social preferences"
            >
              <div className="grid gap-6">
                <PreferenceGroup
                  description="Who usually feels most comfortable around the table."
                  label="Comfort level"
                  onToggle={(value) => setPreferredCrowd((current) => toggleValue(current, value))}
                  options={CROWD_TAGS}
                  selected={preferredCrowd}
                />
                <PreferenceGroup
                  description="Whether you want easier chat, more active energy, or something balanced."
                  label="Conversation style"
                  onToggle={(value) =>
                    setConversationPreference((current) => toggleValue(current, value))
                  }
                  options={CONVERSATION_ACTIVITY_TAGS}
                  selected={conversationPreference}
                />
                <PreferenceGroup
                  description="What table size usually feels right."
                  label="Preferred group size"
                  onToggle={(value) => setGroupSizeComfort((current) => toggleValue(current, value))}
                  options={GROUP_SIZE_COMFORT_TAGS}
                  selected={groupSizeComfort}
                />
                <PreferenceGroup
                  description="Keep this broad. It should guide matching without becoming too precious."
                  label="Age mix"
                  onToggle={(value) => setAgeRangeComfort((current) => toggleValue(current, value))}
                  options={AGE_RANGE_COMFORT_TAGS}
                  selected={ageRangeComfort}
                />
              </div>
            </ProfileSection>

            {error ? (
              <div className="rounded-3xl border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-4 text-sm text-[color:var(--accent-strong)]">
                {error}
              </div>
            ) : null}

            {saveMessage ? (
              <div className="tb-inline-note rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-4 text-sm text-[color:var(--foreground)]">
                {saveMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={saving} type="submit">
                {saving ? 'Saving profile...' : 'Save profile'}
              </Button>
              <Button href={backHref} variant="secondary">
                {backLabel}
              </Button>
            </div>

            {hasUnsavedChanges ? (
              <div className="fixed inset-x-0 bottom-20 z-30 px-4 sm:bottom-6">
                <div className="tb-inline-note mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-4 shadow-[0_20px_50px_rgba(74,31,20,0.18)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">Unsaved changes</p>
                    <p className="mt-1 text-sm text-[color:var(--text-muted)]">{summarizeImpact(snapshot)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        if (initialSnapshot) {
                          applySnapshot(initialSnapshot)
                          setError('')
                        }
                      }}
                      variant="secondary"
                    >
                      Discard
                    </Button>
                    <Button disabled={saving} type="submit">
                      {saving ? 'Saving profile...' : 'Save profile'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </>
  )

  return embedded ? (
    <div className="mx-auto w-full max-w-6xl">{content}</div>
  ) : (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-8 py-16">{content}</main>
  )
}
