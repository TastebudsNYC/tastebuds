'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { ActivityRail } from '@/components/app/AppRails'
import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { Button } from '@/components/app/Button'
import { EmptyState } from '@/components/app/EmptyState'
import { PageHeader } from '@/components/app/PageHeader'
import { PromotionImpressionObserver } from '@/components/app/PromotionImpressionObserver'
import { RestaurantCard } from '@/components/app/RestaurantCard'
import { RestaurantDetailsModal } from '@/components/app/RestaurantDetailsModal'
import { useToast } from '@/components/app/ToastProvider'
import { trackPromotionMetric } from '@/lib/advertising-attribution-client'
import type { PromotionSourceContext } from '@/lib/advertising-attribution'
import { compareEntitiesWithPromotion } from '@/lib/advertising-ordering'
import {
  compareEntitiesOrganically,
  getRestaurantDiscoverySurfaces,
  getRestaurantPromotionDisclosure,
  getRestaurantPromotionSource,
} from '@/lib/advertising-display'
import {
  fetchNotifications,
  fetchRestaurants,
  getAppBootstrap,
  logout,
  setSavedRestaurant,
} from '@/lib/app/client'
import { getTravelRadiusKm } from '@/lib/app/format'
import { runWithViewTransition } from '@/lib/app/motion'
import { usePrefersReducedMotion } from '@/lib/app/use-prefers-reduced-motion'
import type { DashboardRestaurant, NotificationSummary, Profile } from '@/lib/app/types'

type TuneOption =
  | 'casual'
  | 'lively'
  | 'midtown'
  | 'polished'
  | 'quiet'
  | 'surprise'
  | 'under50'

type TravelFilter = 'any' | 'flexible' | 'within15' | 'within30' | 'within45'

const TUNE_OPTIONS = [
  ['casual', 'More casual'],
  ['polished', 'More polished'],
  ['lively', 'Lively'],
  ['quiet', 'Quieter'],
  ['surprise', 'Surprise me'],
] as const

function getUniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((left, right) =>
    left.localeCompare(right)
  )
}

function restaurantSearchText(restaurant: DashboardRestaurant) {
  return [restaurant.name, restaurant.subregion, restaurant.neighbourhood]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getTuneBoost(restaurant: DashboardRestaurant, tune: TuneOption | null) {
  if (!tune) {
    return 0
  }

  const text = [
    restaurant.venue_energy,
    restaurant.venue_noise_level,
    ...(restaurant.venue_scene ?? []),
    ...(restaurant.venue_vibes ?? []),
    ...(restaurant.venue_setting ?? []),
    restaurant.venue_price,
    restaurant.googlePriceLevel,
    restaurant.subregion,
    restaurant.neighbourhood,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (tune === 'casual') {
    return text.includes('casual') || text.includes('relaxed') || text.includes('chill') ? 14 : 0
  }

  if (tune === 'polished') {
    return text.includes('upscale') || text.includes('polished') || text.includes('old-school') ? 14 : 0
  }

  if (tune === 'lively') {
    return text.includes('social') || text.includes('lively') || text.includes('high') ? 14 : 0
  }

  if (tune === 'quiet') {
    return text.includes('quiet') || text.includes('relaxed') || text.includes('conversation') ? 14 : 0
  }

  if (tune === 'under50') {
    const price = restaurant.venue_price ?? restaurant.googlePriceLevel ?? ''
    return price === '$' || price === '$$' || price.toLowerCase().includes('moderate') ? 16 : -6
  }

  if (tune === 'midtown') {
    return restaurant.subregion.toLowerCase().includes('midtown') ||
      (restaurant.neighbourhood ?? '').toLowerCase().includes('midtown')
      ? 16
      : 0
  }

  if (tune === 'surprise') {
    return (restaurant.id % 7) * 3
  }

  return 0
}

function formatLiveTables(count: number) {
  return `${count} live ${count === 1 ? 'table' : 'tables'}`
}

function compareRestaurantsOrganically(
  left: DashboardRestaurant,
  right: DashboardRestaurant,
  input: {
    activeTune: TuneOption | null
    showLiveOnly: boolean
  }
) {
  if (input.showLiveOnly && right.availableEventCount !== left.availableEventCount) {
    return right.availableEventCount - left.availableEventCount
  }

  if (right.availableEventCount !== left.availableEventCount) {
    return right.availableEventCount - left.availableEventCount
  }

  const leftRank = left.matchScore + getTuneBoost(left, input.activeTune)
  const rightRank = right.matchScore + getTuneBoost(right, input.activeTune)

  if (rightRank !== leftRank) {
    return rightRank - leftRank
  }

  return left.name.localeCompare(right.name)
}

function matchesTravelFilter(
  restaurant: DashboardRestaurant,
  profile: Profile | null,
  filter: TravelFilter
) {
  if (filter === 'any') {
    return true
  }

  if (restaurant.venueDistanceKm === null) {
    return filter === 'flexible'
  }

  if (filter === 'within15') {
    return restaurant.venueDistanceKm <= getTravelRadiusKm(15)
  }

  if (filter === 'within30') {
    return restaurant.venueDistanceKm <= getTravelRadiusKm(30)
  }

  if (filter === 'within45') {
    return restaurant.venueDistanceKm <= getTravelRadiusKm(45)
  }

  return restaurant.venueDistanceKm <= getTravelRadiusKm(profile?.max_travel_minutes ?? 30)
}

function compactList(values: string[] | null | undefined, fallback: string[]) {
  const cleaned = values?.filter(Boolean) ?? []
  return cleaned.length > 0 ? cleaned.slice(0, 4) : fallback
}

function RefineMatchesRail({
  activeTune,
  onEditProfile,
  onReset,
  onSetActiveTune,
  onSetArea,
  onSetCuisine,
  onSetPrice,
  onSetTravel,
  onToggleLiveOnly,
  priceOptions,
  profile,
  selectedArea,
  selectedCuisine,
  selectedPrice,
  selectedTravel,
  showLiveOnly,
  areaOptions,
  cuisineOptions,
}: {
  activeTune: TuneOption | null
  areaOptions: string[]
  cuisineOptions: string[]
  onEditProfile: () => void
  onReset: () => void
  onSetActiveTune: (value: TuneOption | null) => void
  onSetArea: (value: string) => void
  onSetCuisine: (value: string) => void
  onSetPrice: (value: string) => void
  onSetTravel: (value: TravelFilter) => void
  onToggleLiveOnly: () => void
  priceOptions: string[]
  profile: Profile | null
  selectedArea: string
  selectedCuisine: string
  selectedPrice: string
  selectedTravel: TravelFilter
  showLiveOnly: boolean
}) {
  const currentTasteTags = [
    ...compactList(profile?.cuisine_preferences, ['Burgers', 'American']),
    ...compactList(profile?.preferred_vibes ?? profile?.preferred_scene, ['Social', 'Casual']),
    ...(profile?.subregion ? [profile.subregion] : []),
  ].slice(0, 6)
  const summary = `${compactList(profile?.preferred_vibes ?? profile?.preferred_scene, ['Casual', 'Social'])
    .slice(0, 2)
    .join(', ')} and ${(profile?.neighbourhood ?? profile?.subregion ?? 'Midtown')}-led.`

  return (
    <aside className="xl:sticky xl:top-28 xl:self-start xl:border-r xl:border-[color:var(--border-soft)] xl:pr-8">
      <div className="border-y border-[color:var(--border-soft)] py-5 xl:border-t-0">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[1.65rem] font-semibold leading-tight text-[color:var(--foreground)]">
            Refine your
            <br />
            matches
          </h2>
          <button
            className="pt-1 text-sm font-semibold text-[color:var(--nav-bg)] hover:underline"
            onClick={onReset}
            type="button"
          >
            Reset
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{summary}</p>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
            Tune
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TUNE_OPTIONS.map(([value, label]) => (
              <button
                className={`tb-interactive-chip rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  activeTune === value
                    ? 'tb-chip-selected border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-text)]'
                    : 'border-[color:var(--border-soft)] bg-[color:var(--surface)] text-[color:var(--nav-bg)] hover:border-[color:var(--border-strong)]'
                }`}
                key={value}
                onClick={() => onSetActiveTune(activeTune === value ? null : value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-[color:var(--border-soft)] pt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
            Filters
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#3c2a20]">Cuisine</span>
            <select className="tb-input" onChange={(event) => onSetCuisine(event.target.value)} value={selectedCuisine}>
              <option value="all">All cuisines</option>
              {cuisineOptions.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#3c2a20]">Price</span>
            <select className="tb-input" onChange={(event) => onSetPrice(event.target.value)} value={selectedPrice}>
              <option value="all">All prices</option>
              {priceOptions.map((price) => (
                <option key={price} value={price}>
                  {price}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#3c2a20]">Area</span>
            <select className="tb-input" onChange={(event) => onSetArea(event.target.value)} value={selectedArea}>
              <option value="all">All areas</option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#3c2a20]">Travel</span>
            <select className="tb-input" onChange={(event) => onSetTravel(event.target.value as TravelFilter)} value={selectedTravel}>
              <option value="any">Any distance</option>
              <option value="within15">Within 15 min</option>
              <option value="within30">Within 30 min</option>
              <option value="within45">Within 45 min</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>
          <button
            className={`tb-interactive-chip w-full rounded-full border px-4 py-3 text-sm font-semibold transition ${
              showLiveOnly
                ? 'tb-chip-selected border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-text)]'
                : 'border-[color:var(--border-soft)] bg-[color:var(--surface)] text-[color:var(--nav-bg)] hover:border-[color:var(--border-strong)]'
            }`}
            onClick={onToggleLiveOnly}
            type="button"
          >
            Live tables only
          </button>
        </div>

        <div className="mt-8 border-t border-[color:var(--border-soft)] pt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
            Current taste
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentTasteTags.map((tag) => (
              <span
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Button
          className="mt-8 w-full"
          onClick={onEditProfile}
          variant="secondary"
        >
          Edit taste profile
        </Button>
      </div>
    </aside>
  )
}

export default function RestaurantsPage() {
  const router = useRouter()
  const { pushToast } = useToast()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [restaurants, setRestaurants] = useState<DashboardRestaurant[]>([])
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [showLiveOnly, setShowLiveOnly] = useState(false)
  const [searchWithinMatches, setSearchWithinMatches] = useState('')
  const [activeTune, setActiveTune] = useState<TuneOption | null>(null)
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedTravel, setSelectedTravel] = useState<TravelFilter>('any')
  const [selectedRestaurant, setSelectedRestaurant] = useState<DashboardRestaurant | null>(null)
  const [selectedRestaurantPromotionSource, setSelectedRestaurantPromotionSource] =
    useState<PromotionSourceContext | null>(null)
  const [highlightedRestaurantId, setHighlightedRestaurantId] = useState<number | null>(null)
  const [restaurantActionLoadingId, setRestaurantActionLoadingId] = useState<number | null>(null)
  const [isRetuning, setIsRetuning] = useState(false)
  const [flashRestaurantId, setFlashRestaurantId] = useState<number | null>(null)
  const retuneTimeoutRef = useRef<number | null>(null)
  const seenPromotionImpressionKeysRef = useRef<Set<string>>(new Set())

  function beginRetuneFeedback() {
    setIsRetuning(true)

    if (retuneTimeoutRef.current !== null) {
      window.clearTimeout(retuneTimeoutRef.current)
    }

    retuneTimeoutRef.current = window.setTimeout(() => {
      setIsRetuning(false)
      retuneTimeoutRef.current = null
    }, 260)
  }

  function runResultsTransition(update: () => void) {
    beginRetuneFeedback()

    const applyUpdate = () => startTransition(update)

    if (prefersReducedMotion) {
      applyUpdate()
      return
    }

    runWithViewTransition(applyUpdate)
  }

  useEffect(() => {
    let active = true

    async function loadPage() {
      try {
        const bootstrap = await getAppBootstrap()

        if (!active) {
          return
        }

        const [payload, notificationResponse] = await Promise.all([
          fetchRestaurants(bootstrap.accessToken),
          fetchNotifications(bootstrap.userId),
        ])

        if (!active) {
          return
        }

        if (notificationResponse.error) {
          setError(notificationResponse.error.message)
          setLoading(false)
          return
        }

        if (payload.onboardingRequired) {
          router.replace('/onboarding')
          return
        }

        setRestaurants(payload.restaurants ?? [])
        setNotifications(notificationResponse.data ?? [])
        setProfile(bootstrap.profile)
        setLoading(false)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Could not load restaurants.')
        setLoading(false)
      }
    }

    void loadPage()

    return () => {
      active = false
      if (retuneTimeoutRef.current !== null) {
        window.clearTimeout(retuneTimeoutRef.current)
      }
    }
  }, [router])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  async function handleToggleSaved(
    restaurantId: number,
    action: 'save' | 'unsave',
    promotionSource?: PromotionSourceContext | null
  ) {
    setError('')
    setRestaurantActionLoadingId(restaurantId)
    const previousRestaurants = restaurants
    const previousSelectedRestaurant = selectedRestaurant
    const targetRestaurant =
      restaurants.find((restaurant) => restaurant.id === restaurantId) ?? selectedRestaurant

    const optimisticRestaurants = restaurants.map((restaurant) =>
      restaurant.id === restaurantId
        ? {
            ...restaurant,
            isSaved: action === 'save',
          }
        : restaurant
    )

    setRestaurants(optimisticRestaurants)

    if (previousSelectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant(
        previousSelectedRestaurant
          ? { ...previousSelectedRestaurant, isSaved: action === 'save' }
          : previousSelectedRestaurant
      )
    }

    try {
      await setSavedRestaurant(restaurantId, action, promotionSource?.surface ?? null)
      const payload = await fetchRestaurants()
      const refreshedRestaurants = payload.restaurants ?? optimisticRestaurants
      setRestaurants(refreshedRestaurants)

      if (selectedRestaurant?.id === restaurantId) {
        setSelectedRestaurant(
          refreshedRestaurants.find((restaurant) => restaurant.id === restaurantId) ??
            selectedRestaurant
        )
      }

      if (action === 'save') {
        setFlashRestaurantId(restaurantId)
        window.setTimeout(() => setFlashRestaurantId((current) => (current === restaurantId ? null : current)), 340)
        pushToast({
          description: `We'll watch ${targetRestaurant?.name ?? 'this venue'} for hosted tables.`,
          title: 'Saved.',
        })
      } else {
        pushToast({
          description: `${targetRestaurant?.name ?? 'This venue'} has been removed from your watchlist.`,
          title: 'Venue removed.',
          tone: 'surface',
        })
      }
    } catch (nextError) {
      setRestaurants(previousRestaurants)
      setSelectedRestaurant(previousSelectedRestaurant)
      setError(
        nextError instanceof Error ? nextError.message : 'Could not update saved restaurants.'
      )
    } finally {
      setRestaurantActionLoadingId(null)
    }
  }

  function handleOpenRestaurantDetails(
    restaurant: DashboardRestaurant,
    promotionSource: PromotionSourceContext | null
  ) {
    setSelectedRestaurantPromotionSource(promotionSource)
    setSelectedRestaurant(restaurant)

    if (promotionSource) {
      void trackPromotionMetric('venue_profile_view', promotionSource)
    }
  }

  function handleRestaurantMenuClick() {
    if (!selectedRestaurantPromotionSource) {
      return
    }

    void trackPromotionMetric('website_click', selectedRestaurantPromotionSource, {
      keepalive: true,
    })
  }

  const cuisineOptions = useMemo(
    () => getUniqueOptions(restaurants.map((restaurant) => restaurant.restaurant_cuisines?.[0])),
    [restaurants]
  )
  const priceOptions = useMemo(
    () => getUniqueOptions(restaurants.map((restaurant) => restaurant.venue_price)),
    [restaurants]
  )
  const areaOptions = useMemo(
    () =>
      getUniqueOptions(
        restaurants.flatMap((restaurant) => [restaurant.subregion, restaurant.neighbourhood])
      ),
    [restaurants]
  )
  const discoveryRestaurantSurfaces = useMemo(
    () =>
      getRestaurantDiscoverySurfaces({
        query: searchWithinMatches.trim().toLowerCase(),
        selectedArea,
        selectedCuisine,
      }),
    [searchWithinMatches, selectedArea, selectedCuisine]
  )
  const visibleRestaurants = useMemo(() => {
    const query = searchWithinMatches.trim().toLowerCase()

    return restaurants
      .filter((restaurant) => !showSavedOnly || restaurant.isSaved)
      .filter((restaurant) => !showLiveOnly || restaurant.availableEventCount > 0)
      .filter((restaurant) => matchesTravelFilter(restaurant, profile, selectedTravel))
      .filter((restaurant) => !query || restaurantSearchText(restaurant).includes(query))
      .filter(
        (restaurant) =>
          selectedCuisine === 'all' || restaurant.restaurant_cuisines?.[0] === selectedCuisine
      )
      .filter((restaurant) => selectedPrice === 'all' || restaurant.venue_price === selectedPrice)
      .filter(
        (restaurant) =>
          selectedArea === 'all' ||
          restaurant.subregion === selectedArea ||
          restaurant.neighbourhood === selectedArea
      )
      .sort((left, right) =>
        compareEntitiesWithPromotion(left, right, {
          organicCompare: (organicLeft, organicRight) =>
            compareRestaurantsOrganically(organicLeft, organicRight, {
              activeTune,
              showLiveOnly,
            }),
          surfaces: discoveryRestaurantSurfaces,
        })
      )
  }, [
    activeTune,
    discoveryRestaurantSurfaces,
    restaurants,
    searchWithinMatches,
    selectedArea,
    selectedCuisine,
    selectedPrice,
    selectedTravel,
    showLiveOnly,
    showSavedOnly,
    profile,
  ])
  const savedRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.isSaved).slice(0, 3),
    [restaurants]
  )
  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  )
  const savedVisibleRestaurants = useMemo(
    () =>
      visibleRestaurants
        .filter((restaurant) => restaurant.isSaved)
        .sort((left, right) =>
          compareEntitiesOrganically(left, right, (organicLeft, organicRight) =>
            compareRestaurantsOrganically(organicLeft, organicRight, {
              activeTune,
              showLiveOnly,
            })
          )
        ),
    [activeTune, showLiveOnly, visibleRestaurants]
  )
  const unsavedVisibleRestaurants = useMemo(
    () =>
      visibleRestaurants
        .filter((restaurant) => !restaurant.isSaved)
        .sort((left, right) =>
          compareEntitiesWithPromotion(left, right, {
            organicCompare: (organicLeft, organicRight) =>
              compareRestaurantsOrganically(organicLeft, organicRight, {
                activeTune,
                showLiveOnly,
              }),
            surfaces: discoveryRestaurantSurfaces,
          })
        ),
    [activeTune, discoveryRestaurantSurfaces, showLiveOnly, visibleRestaurants]
  )
  const liveVisibleCount = useMemo(
    () => visibleRestaurants.filter((restaurant) => restaurant.availableEventCount > 0).length,
    [visibleRestaurants]
  )
  const mapRestaurants = useMemo(
    () =>
      visibleRestaurants
        .filter(
          (restaurant) =>
            restaurant.venue_latitude !== null && restaurant.venue_longitude !== null
        )
        .slice(0, 12),
    [visibleRestaurants]
  )
  const summaryText = showSavedOnly
    ? `${savedVisibleRestaurants.length} saved / ${formatLiveTables(liveVisibleCount)}`
    : `${visibleRestaurants.length} matches / ${savedVisibleRestaurants.length} saved / ${formatLiveTables(liveVisibleCount)}`
  const userMapLocation =
    profile?.home_latitude !== null &&
    profile?.home_latitude !== undefined &&
    profile.home_longitude !== null &&
    profile.home_longitude !== undefined
      ? { lat: profile.home_latitude, lng: profile.home_longitude }
      : null

  function handleSelectRestaurantFromMap(restaurantId: number | null) {
    if (restaurantId === null) {
      setSelectedRestaurantPromotionSource(null)
      setSelectedRestaurant(null)
      return
    }

    const match = restaurants.find((restaurant) => restaurant.id === restaurantId)

    if (match) {
      setSelectedRestaurantPromotionSource(null)
      setSelectedRestaurant(match)
    }
  }

  if (loading) {
    return <AppPageSkeleton currentPath="/restaurants" title="Restaurants" variant="list" />
  }

  return (
    <AppShell
      currentPath="/restaurants"
      onLogout={handleLogout}
      profile={profile}
      unreadCount={unreadNotificationCount}
      wide
    >
      <div className="grid w-full gap-8 xl:grid-cols-[260px_minmax(520px,1fr)_320px]">
        <RefineMatchesRail
          activeTune={activeTune}
          areaOptions={areaOptions}
          cuisineOptions={cuisineOptions}
          onEditProfile={() => router.push('/profile')}
          onReset={() =>
            runResultsTransition(() => {
              setActiveTune(null)
              setSearchWithinMatches('')
              setSelectedArea('all')
              setSelectedCuisine('all')
              setSelectedPrice('all')
              setSelectedTravel('any')
              setShowLiveOnly(false)
              setShowSavedOnly(false)
            })
          }
          onSetActiveTune={(value) => runResultsTransition(() => setActiveTune(value))}
          onSetArea={(value) => runResultsTransition(() => setSelectedArea(value))}
          onSetCuisine={(value) => runResultsTransition(() => setSelectedCuisine(value))}
          onSetPrice={(value) => runResultsTransition(() => setSelectedPrice(value))}
          onSetTravel={(value) => runResultsTransition(() => setSelectedTravel(value))}
          onToggleLiveOnly={() => runResultsTransition(() => setShowLiveOnly((current) => !current))}
          priceOptions={priceOptions}
          profile={profile}
          selectedArea={selectedArea}
          selectedCuisine={selectedCuisine}
          selectedPrice={selectedPrice}
          selectedTravel={selectedTravel}
          showLiveOnly={showLiveOnly}
        />

        <div className="min-w-0 space-y-8">
          <PageHeader
            action={
              <div className="flex gap-2">
                <Button
                  onClick={() => runResultsTransition(() => setShowSavedOnly(false))}
                  size="sm"
                  variant={showSavedOnly ? 'secondary' : 'primary'}
                >
                  All
                </Button>
                <Button
                  onClick={() => runResultsTransition(() => setShowSavedOnly(true))}
                  size="sm"
                  variant={showSavedOnly ? 'primary' : 'secondary'}
                >
                  Saved
                </Button>
              </div>
            }
            description="Ranked by your taste, budget and social vibe - save the ones you'd actually attend."
            title="Places we think you'll say yes to"
          />

          {error ? (
            <div className="rounded-[1.5rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-softer)] p-4 text-sm text-[color:var(--accent-strong)]">
              {error}
            </div>
          ) : null}
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] px-4 py-4 shadow-[0_14px_34px_rgba(74,31,20,0.06)]">
            <label className="w-full max-w-xs space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                Search within matches
              </span>
              <input
                className="tb-input h-11"
                id="restaurant-search-within"
                onChange={(event) => setSearchWithinMatches(event.target.value)}
                placeholder="Search by name"
                value={searchWithinMatches}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-[color:var(--text-secondary)]">{summaryText}</p>
              {isRetuning ? (
                <p className="tb-retuning text-sm font-medium text-[color:var(--accent-strong)]">
                  Retuning your matches…
                </p>
              ) : null}
              <Button href="/events" variant="secondary">
                Browse events
              </Button>
            </div>
          </div>

          {visibleRestaurants.length > 0 ? (
            <div className="space-y-8">
              {!showSavedOnly && unsavedVisibleRestaurants.length > 0 ? (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[color:var(--foreground)]">
                      Your matches
                    </h2>
                    <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                      Matches ranked for the kind of night you actually want.
                    </p>
                  </div>
                  <div className="grid gap-5">
                    {unsavedVisibleRestaurants.map((restaurant) => {
                      const promotionSource = getRestaurantPromotionSource({
                        isSaved: restaurant.isSaved,
                        promotionDisclosures: restaurant.promotionDisclosures,
                        promotionPriorities: restaurant.promotionPriorities,
                        surfaces: discoveryRestaurantSurfaces,
                        targetId: restaurant.id,
                      })

                      return (
                        <PromotionImpressionObserver
                          key={restaurant.id}
                          seenKeysRef={seenPromotionImpressionKeysRef}
                          source={promotionSource}
                        >
                          <RestaurantCard
                            flashState={flashRestaurantId === restaurant.id ? 'saved' : null}
                            highlighted={(highlightedRestaurantId ?? selectedRestaurant?.id ?? null) === restaurant.id}
                            onHighlightChange={setHighlightedRestaurantId}
                            onOpenDetails={(nextRestaurant) =>
                              handleOpenRestaurantDetails(nextRestaurant, promotionSource)
                            }
                            onToggleSaved={(restaurantId, action) =>
                              void handleToggleSaved(restaurantId, action, promotionSource)
                            }
                            promotionDisclosure={getRestaurantPromotionDisclosure({
                              isSaved: restaurant.isSaved,
                              promotionDisclosures: restaurant.promotionDisclosures,
                              promotionPriorities: restaurant.promotionPriorities,
                              surfaces: discoveryRestaurantSurfaces,
                            })}
                            restaurant={restaurant}
                            saving={restaurantActionLoadingId === restaurant.id}
                          />
                        </PromotionImpressionObserver>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              {savedVisibleRestaurants.length > 0 ? (
                <section className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[color:var(--foreground)]">
                      Saved and watching
                    </h2>
                    <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                      These are already on your watchlist for hosted tables.
                    </p>
                  </div>
                  <div className="grid gap-5">
                    {savedVisibleRestaurants.map((restaurant) => (
                      <RestaurantCard
                        flashState={flashRestaurantId === restaurant.id ? 'saved' : null}
                        highlighted={(highlightedRestaurantId ?? selectedRestaurant?.id ?? null) === restaurant.id}
                        key={restaurant.id}
                        onHighlightChange={setHighlightedRestaurantId}
                        onOpenDetails={(nextRestaurant) =>
                          handleOpenRestaurantDetails(nextRestaurant, null)
                        }
                        onToggleSaved={(restaurantId, action) =>
                          void handleToggleSaved(restaurantId, action, null)
                        }
                        promotionDisclosure={null}
                        restaurant={restaurant}
                        saving={restaurantActionLoadingId === restaurant.id}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    runResultsTransition(() => {
                      setActiveTune(null)
                      setSearchWithinMatches('')
                      setSelectedArea('all')
                      setSelectedCuisine('all')
                      setSelectedPrice('all')
                      setSelectedTravel('any')
                      setShowLiveOnly(false)
                      setShowSavedOnly(false)
                    })
                  }}
                  variant="secondary"
                >
                  Reset filters
                </Button>
              }
              description="Try widening cuisine, price, saved status or live-table filters."
              title="No restaurants match these filters"
            />
          )}

          <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-5 shadow-[0_12px_28px_rgba(74,31,20,0.05)]">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Not feeling these?</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              Retune the shortlist or look up a specific place by name without dropping back into a database-style browse.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="/profile" variant="secondary">
                Retune taste profile
              </Button>
              <Button
                onClick={() => {
                  const nextInput = document.getElementById('restaurant-search-within')
                  if (nextInput instanceof HTMLInputElement) {
                    nextInput.focus()
                  }
                }}
                variant="secondary"
              >
                Search by name
              </Button>
            </div>
          </section>
        </div>

        <ActivityRail
          mapAnchorId="restaurants-map"
          mapPrimaryActionLabel="Open venue"
          mapRestaurants={mapRestaurants}
          notifications={notifications}
          onExpandedSelectRestaurant={handleSelectRestaurantFromMap}
          onHighlightRestaurant={setHighlightedRestaurantId}
          onInlineSelectRestaurant={handleSelectRestaurantFromMap}
          onSelectRestaurant={handleSelectRestaurantFromMap}
          restaurants={savedRestaurants}
          selectedRestaurantId={selectedRestaurant?.id ?? null}
          showWatching
          userLocation={userMapLocation}
        />
      </div>

      {selectedRestaurant ? (
        <RestaurantDetailsModal
          onClose={() => {
            setSelectedRestaurant(null)
            setSelectedRestaurantPromotionSource(null)
          }}
          onMenuClick={handleRestaurantMenuClick}
          onToggleSaved={(restaurantId, action) =>
            void handleToggleSaved(restaurantId, action, selectedRestaurantPromotionSource)
          }
          restaurant={
            restaurants.find((restaurant) => restaurant.id === selectedRestaurant.id) ??
            selectedRestaurant
          }
          saving={restaurantActionLoadingId === selectedRestaurant.id}
        />
      ) : null}
    </AppShell>
  )
}
