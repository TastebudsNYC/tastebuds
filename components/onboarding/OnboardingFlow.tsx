'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type CSSProperties } from 'react'

import { Button } from '@/components/app/Button'
import { GooglePlacePhoto } from '@/components/app/GooglePlacePhoto'
import { RestaurantDetailsModal } from '@/components/app/RestaurantDetailsModal'
import { TasteTag } from '@/components/app/TasteTag'
import { TastebudsLogo } from '@/components/TastebudsLogo'
import {
  LocationSearchField,
  type LocationSuggestion,
} from '@/components/location-search-field'
import {
  clearAppBootstrapCache,
  fetchRestaurants,
  getAppBootstrap,
  setSavedRestaurant,
} from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'
import {
  buildAuthCallbackUrl,
  clearOnboardingActivationPending,
  clearPendingSignup,
  clearSignupConfirmationSignal,
  getPostAuthRoute,
  hasOnboardingActivationPending,
  setOnboardingActivationPending,
  setPendingSignup,
} from '@/lib/auth/onboarding'
import {
  AGE_RANGE_COMFORT_TAGS,
  CONVERSATION_ACTIVITY_TAGS,
  CROWD_TAGS,
  DIETARY_RESTRICTION_TAGS,
  DRINKING_PREFERENCE_TAGS,
  ENERGY_LEVELS,
  GROUP_SIZE_COMFORT_TAGS,
  MUSIC_TAGS,
  PRICE_TAGS,
  SCENE_TAGS,
  SETTING_TAGS,
  VIBE_TAGS,
  parseCuisinePreferenceInput,
} from '@/lib/events'
import {
  createEmptyProfileDraft,
  profileToDraft,
  saveProfileDraft,
  SUBREGIONS,
  TRAVEL_WINDOWS,
  type ProfileDraft,
} from '@/lib/app/profile-draft'
import type { DashboardRestaurant } from '@/lib/app/types'
import { supabase } from '@/lib/supabase/client'

type FlowMode = 'resume' | 'signup'

type StageId =
  | 'welcome-1'
  | 'welcome-2'
  | 'welcome-3'
  | 'account-email'
  | 'account-password'
  | 'display-name'
  | 'bio'
  | 'home-area'
  | 'preferred-area'
  | 'travel'
  | 'price'
  | 'cuisines'
  | 'dietary'
  | 'drinks'
  | 'energy-scene'
  | 'music-setting'
  | 'vibes'
  | 'crowd-conversation'
  | 'group-age'
  | 'restaurants'
  | 'finish'

const ONBOARDING_RESTAURANT_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDCoHML1D-nS9Lpd8JQsgkHZQy7xiCa4Cx9EeNcbmIe5Kp0jdxofD_dVVn6Ze22xEPoZgJTuKre5B1fsb1Pbbme3gUS-P9eUKSbS3DQQs4TkPqXXH3lEx8hArTWwf3eLo4jmiZBqoc5svsyFDFqKkvvC_rj4reYIojqZPtWbKTLiBugXIwtxa9qGGkVZ1Qvn7lEgs5cvkJpPYEypfeu3_hwcW_FJI1Rnh9Ib_QPpp-r_W-cmqmkxuliA_xVq0jvZHb9l0FtG2aimNlH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAslHXH8KjoZPnFH9tLgGOz8rpffzYp31oJCQ03BpWAGdwlFuUFHoISTgdAoZH_NjW-csUz083j3OW2m7Eg3SuZatWjxorJGliozLUIdLQ8c8z6hpL2bj-HYYYYraZ1M28INpoA-BFsk74mlHt5pUxujHqONyF7wwIBG2LeEI48EBwtXkT82xYxLlx3ZfU9xA0fKFD9uG5VwLYImjp2Ds_E_MAAvem_kn52S1La_X3JIpw26-1BtApNmFDKsn5tXXeqRiG9EglOZ9X-',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANwT_OCTmuJC4naZhU3nuu-_tl7nhx6boXESOu4GLp5ZWE2QupS8HMNQ8yy0ZzGILo9KDGkmYrfwOLwnmf-PZa_KNHdtjFKXI3pdft5g3EDqysljfjWnmqJQWnFOECkd1pt8ssY2BZq9Y5OJu_J9oiPE-ORo3hrHoDFk9xM-r8zFq_WS3azkfo5wzdoYL0xRq9J7_gQ0fi_xMOec9JpOSZFaAFZtm5hw0wQLDQAfNvmSuc06elFW9SCXwRrjWPtLEmFN4LjA5o3yx8',
] as const

const SIGNUP_STAGE_SEQUENCE: StageId[] = [
  'welcome-1',
  'welcome-2',
  'welcome-3',
  'account-email',
  'account-password',
  'display-name',
  'bio',
  'home-area',
  'preferred-area',
  'travel',
  'price',
  'cuisines',
  'dietary',
  'drinks',
  'energy-scene',
  'music-setting',
  'vibes',
  'crowd-conversation',
  'group-age',
  'restaurants',
  'finish',
]

const PROFILE_STAGE_SEQUENCE: StageId[] = [
  'display-name',
  'bio',
  'home-area',
  'preferred-area',
  'travel',
  'price',
  'cuisines',
  'dietary',
  'drinks',
  'energy-scene',
  'music-setting',
  'vibes',
  'crowd-conversation',
  'group-age',
  'restaurants',
  'finish',
]

function StageShell({
  children,
  currentStep,
  direction,
  footer,
  progressTotal,
  showLoginLink = true,
  stageId,
}: {
  children: React.ReactNode
  currentStep: number
  direction: -1 | 1
  footer: React.ReactNode
  progressTotal: number
  showLoginLink?: boolean
  stageId: StageId | 'loading'
}) {
  const progress = progressTotal <= 1 ? 1 : currentStep / progressTotal
  const stageAccent = getStageAccentClass(stageId)

  return (
    <main className={`tb-onboarding-shell ${stageAccent}`}>
      <div className="tb-onboarding-backdrop" />
      <div className="relative min-h-screen">
        <header className="tb-onboarding-header">
          <div className="tb-onboarding-logo-lockup">
            <TastebudsLogo showTagline={false} size="sm" theme="dark" />
          </div>
          <div className="tb-onboarding-progress-meta">
            {showLoginLink ? (
              <Link
                className="text-sm font-semibold text-white/68 transition hover:text-white"
                href="/login"
              >
                Log in
              </Link>
            ) : (
              <span className="h-5" />
            )}
            <div className="w-full">
              <div className="text-right text-sm font-semibold tracking-[-0.01em] text-[color:var(--nav-bg)]">
                Step {currentStep} of {progressTotal}
              </div>
            </div>
          </div>
        </header>

        <div className="tb-onboarding-progress-track">
          <div
            className="tb-onboarding-progress-bar"
            style={{ width: `${Math.max(progress, 0.06) * 100}%` }}
          />
        </div>

        <section className="tb-onboarding-main">
          <div
            className={`tb-onboarding-step ${
              direction < 0 ? 'tb-onboarding-step-back' : 'tb-onboarding-step-forward'
            }`}
            key={stageId}
          >
            <div className="tb-onboarding-content">
              {children}
            </div>
          </div>
        </section>

        <footer className="tb-onboarding-footer">
          <div className="tb-onboarding-footer-inner">{footer}</div>
        </footer>
      </div>
    </main>
  )
}

function StageHeading({
  eyebrow,
  heading,
  subtext,
}: {
  eyebrow?: string
  heading: string
  subtext: string
}) {
  return (
    <div className="space-y-4 text-center">
      {eyebrow ? (
        <p className="hidden text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[3rem] font-bold leading-[0.92] tracking-[-0.07em] text-[color:var(--foreground)] sm:text-[3.8rem] lg:text-[4.85rem]">
        {heading}
      </h1>
      <p className="mx-auto max-w-[46rem] text-lg leading-8 text-[color:var(--text-secondary)] lg:text-[1.35rem]">
        {subtext}
      </p>
    </div>
  )
}

function ChoiceChip({
  active,
  children,
  onClick,
  style,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  style?: CSSProperties
}) {
  return (
    <button
      className={
        active
          ? 'tb-onboarding-choice min-h-[5.5rem] rounded-[1.6rem] border border-[color:var(--accent)] bg-[color:var(--accent)] px-5 py-4 text-left text-base font-semibold text-[color:var(--accent-text)] shadow-[0_16px_30px_rgba(245,158,11,0.24)]'
          : 'tb-onboarding-choice min-h-[5.5rem] rounded-[1.6rem] border border-[color:var(--border-soft)] bg-white px-5 py-4 text-left text-base font-medium text-[color:var(--foreground)] hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-soft)]'
      }
      onClick={onClick}
      style={style}
      type="button"
    >
      {children}
    </button>
  )
}

function ChoiceGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  onToggle: (value: string) => void
  options: readonly string[]
  selected: string[]
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--text-secondary)]">
        {label}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option, index) => (
          <ChoiceChip
            active={selected.includes(option)}
            key={option}
            onClick={() => onToggle(option)}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            {option}
          </ChoiceChip>
        ))}
      </div>
    </div>
  )
}

function getStageAccentClass(stage: StageId | 'loading') {
  if (stage.startsWith('welcome') || stage === 'loading') {
    return 'tb-onboarding-theme-welcome'
  }

  if (stage.startsWith('account')) {
    return 'tb-onboarding-theme-account'
  }

  if (stage === 'restaurants' || stage === 'finish') {
    return 'tb-onboarding-theme-activation'
  }

  return 'tb-onboarding-theme-profile'
}

function formatRestaurantMeta(restaurant: DashboardRestaurant) {
  const bits = [restaurant.subregion]

  if (restaurant.restaurant_cuisines?.[0]) {
    bits.push(restaurant.restaurant_cuisines[0])
  }

  if (restaurant.venue_price) {
    bits.push(restaurant.venue_price)
  }

  return bits.join(' · ')
}

function getRestaurantFallbackImage(index: number) {
  return (
    ONBOARDING_RESTAURANT_IMAGES[index % ONBOARDING_RESTAURANT_IMAGES.length] ??
    ONBOARDING_RESTAURANT_IMAGES[0]!
  )
}

function toggleValue(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value]
}

function toggleDietaryValue(current: string[], value: string) {
  if (value === 'No dietary restrictions') {
    return current.includes(value) ? [] : ['No dietary restrictions']
  }

  const next = current.filter((entry) => entry !== 'No dietary restrictions')
  return next.includes(value)
    ? next.filter((entry) => entry !== value)
    : [...next, value]
}

function getProfileStartStage(draft: ProfileDraft) {
  if (!draft.displayName.trim()) {
    return 'display-name'
  }

  if (!draft.homeAnchorQuery.trim() || !draft.homeLatitude || !draft.homeLongitude) {
    return 'home-area'
  }

  if (!draft.preferredPrice.length) {
    return 'price'
  }

  if (!parseCuisinePreferenceInput(draft.cuisinePreferences).length) {
    return 'cuisines'
  }

  if (!draft.dietaryRestrictions.length) {
    return 'dietary'
  }

  if (!draft.preferredEnergy.length || !draft.preferredScene.length) {
    return 'energy-scene'
  }

  if (!draft.preferredMusic.length || !draft.preferredSetting.length) {
    return 'music-setting'
  }

  if (!draft.preferredVibes.length) {
    return 'vibes'
  }

  if (!draft.preferredCrowd.length || !draft.conversationPreference.length) {
    return 'crowd-conversation'
  }

  if (!draft.groupSizeComfort.length || !draft.ageRangeComfort.length) {
    return 'group-age'
  }

  return 'finish'
}

function isStageComplete(stage: StageId, draft: ProfileDraft) {
  switch (stage) {
    case 'welcome-1':
    case 'welcome-2':
    case 'welcome-3':
    case 'drinks':
    case 'bio':
    case 'finish':
      return true
    case 'account-email':
      return false
    case 'account-password':
      return false
    case 'display-name':
      return draft.displayName.trim().length > 0
    case 'home-area':
      return (
        draft.homeAnchorQuery.trim().length > 0 &&
        draft.homeLatitude.trim().length > 0 &&
        draft.homeLongitude.trim().length > 0
      )
    case 'preferred-area':
      return draft.subregion.length > 0
    case 'travel':
      return draft.maxTravelMinutes > 0
    case 'price':
      return draft.preferredPrice.length > 0
    case 'cuisines':
      return parseCuisinePreferenceInput(draft.cuisinePreferences).length > 0
    case 'dietary':
      return draft.dietaryRestrictions.length > 0
    case 'energy-scene':
      return draft.preferredEnergy.length > 0 && draft.preferredScene.length > 0
    case 'music-setting':
      return draft.preferredMusic.length > 0 && draft.preferredSetting.length > 0
    case 'vibes':
      return draft.preferredVibes.length > 0
    case 'crowd-conversation':
      return draft.preferredCrowd.length > 0 && draft.conversationPreference.length > 0
    case 'group-age':
      return draft.groupSizeComfort.length > 0 && draft.ageRangeComfort.length > 0
    default:
      return true
  }
}

export function OnboardingFlow({ mode }: { mode: FlowMode }) {
  const router = useRouter()
  const [draft, setDraft] = useState<ProfileDraft>(createEmptyProfileDraft())
  const [stage, setStage] = useState<StageId>(mode === 'signup' ? 'welcome-1' : 'display-name')
  const [sessionChecked, setSessionChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [restaurants, setRestaurants] = useState<DashboardRestaurant[]>([])
  const [restaurantsLoading, setRestaurantsLoading] = useState(false)
  const [restaurantActionLoadingId, setRestaurantActionLoadingId] = useState<number | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<DashboardRestaurant | null>(null)

  function resetSignupState() {
    clearAppBootstrapCache()
    clearPendingSignup()
    clearSignupConfirmationSignal()
    clearOnboardingActivationPending()
    setDraft(createEmptyProfileDraft())
    setUserId(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRestaurants([])
    setSelectedRestaurant(null)
    setStage('welcome-1')
    setAuthenticated(false)
  }

  useEffect(() => {
    let active = true

    async function bootstrapFlow() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (userError || !user || !session?.user || user.id !== session.user.id) {
        await supabase.auth.signOut()

        if (!active) {
          return
        }

        if (mode === 'resume') {
          router.replace('/login')
          return
        }

        resetSignupState()
        setSessionChecked(true)
        return
      }

      const bootstrap = await getAppBootstrap()

      if (!active) {
        return
      }

      const activationPending = hasOnboardingActivationPending()

      if (isProfileComplete(bootstrap.profile)) {
        if (!activationPending) {
          router.replace(await getPostAuthRoute())
          return
        }
      }

      const nextDraft = profileToDraft(bootstrap.profile)
      setDraft(nextDraft)
      setUserId(bootstrap.userId)
      setAuthenticated(true)
      setSessionChecked(true)

      if (activationPending && isProfileComplete(bootstrap.profile)) {
        try {
          const payload = await fetchRestaurants(bootstrap.accessToken)
          if (!active) {
            return
          }

          const nextRestaurants = payload.restaurants ?? []
          setRestaurants(nextRestaurants)
          setStage(
            nextRestaurants.filter((restaurant) => restaurant.isSaved).length >= 2
              ? 'finish'
              : 'restaurants'
          )
          return
        } catch {
          if (!active) {
            return
          }
        }
      }

      setStage(getProfileStartStage(nextDraft))
    }

    void bootstrapFlow().catch(async () => {
      if (active) {
        if (mode === 'resume') {
          router.replace('/login')
          return
        }

        await supabase.auth.signOut()
        resetSignupState()
        setSessionChecked(true)
      }
    })

    return () => {
      active = false
    }
  }, [mode, router])

  const visibleStages = authenticated ? PROFILE_STAGE_SEQUENCE : SIGNUP_STAGE_SEQUENCE
  const currentStageIndex = Math.max(visibleStages.indexOf(stage), 0)
  const currentStep = currentStageIndex + 1
  const canGoBack = currentStageIndex > 0

  function goBack() {
    if (!canGoBack) {
      return
    }

    setDirection(-1)
    setError('')
    setMessage('')
    setStage(visibleStages[currentStageIndex - 1] ?? visibleStages[0]!)
  }

  function continueTo(nextStage?: StageId) {
    setDirection(1)
    setError('')
    setMessage('')

    if (nextStage) {
      setStage(nextStage)
      return
    }

    const candidate = visibleStages[currentStageIndex + 1]
    if (candidate) {
      setStage(candidate)
    }
  }

  async function handleCreateAccount() {
    if (!email.trim()) {
      setError('Enter your email to continue.')
      return
    }

    if (!password || password.length < 6) {
      setError('Use a password with at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    setPendingSignup(email.trim())

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(process.env.NEXT_PUBLIC_APP_URL, 'signup'),
      },
    })

    setLoading(false)

    if (signUpError) {
      clearPendingSignup()
      setError(signUpError.message)
      return
    }

    if (!data.session?.user) {
      router.replace(`/signup/check-email?email=${encodeURIComponent(email.trim())}`)
      return
    }

    clearAppBootstrapCache()
    clearPendingSignup()
    setAuthenticated(true)
    setUserId(data.session.user.id)
    setDirection(1)
    setStage('display-name')
  }

  async function handleFinishSetup() {
    if (!userId) {
      setError('Missing active session. Log in again to continue.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await saveProfileDraft(supabase, userId, draft)
      clearAppBootstrapCache()
      setOnboardingActivationPending()

      setRestaurantsLoading(true)
      const payload = await fetchRestaurants()
      const nextRestaurants = payload.restaurants ?? []
      setRestaurants(nextRestaurants)
      setDirection(1)
      setStage('restaurants')
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : 'Could not save your profile.'

      if (
        message.includes('profiles_id_fkey') ||
        message.includes('violates foreign key constraint')
      ) {
        await supabase.auth.signOut()
        resetSignupState()
        setSessionChecked(true)
        setError('Your previous signup session is no longer valid. Start again to create a new account.')
        return
      }

      setError(
        message
      )
    } finally {
      setRestaurantsLoading(false)
      setLoading(false)
    }
  }

  async function handleToggleSavedRestaurant(
    restaurantId: number,
    action: 'save' | 'unsave'
  ) {
    setRestaurantActionLoadingId(restaurantId)
    setError('')

    const previousRestaurants = restaurants

    const optimisticRestaurants = restaurants.map((restaurant) =>
      restaurant.id === restaurantId
        ? { ...restaurant, isSaved: action === 'save' }
        : restaurant
    )

    setRestaurants(optimisticRestaurants)

    try {
      await setSavedRestaurant(restaurantId, action)
      const payload = await fetchRestaurants()
      const nextRestaurants = payload.restaurants ?? optimisticRestaurants
      setRestaurants(nextRestaurants)
    } catch (nextError) {
      setRestaurants(previousRestaurants)
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Could not update saved restaurants.'
      )
    } finally {
      setRestaurantActionLoadingId(null)
    }
  }

  function handleActivationContinue() {
    clearOnboardingActivationPending()

    setDirection(1)
    setStage('finish')
  }

  if (!sessionChecked) {
    return (
      <StageShell
        currentStep={1}
        direction={1}
        footer={<div />}
        progressTotal={visibleStages.length}
        showLoginLink={!authenticated}
        stageId="loading"
      >
        <StageHeading
          heading="Preparing your setup"
          subtext="Loading your account and profile so you can carry on where you left off."
        />
      </StageShell>
    )
  }

  const disableContinue = !isStageComplete(stage, draft)
  const savedRestaurantCount = restaurants.filter((restaurant) => restaurant.isSaved).length
  const restaurantSelectionRequired = restaurants.length >= 2
  const onboardingRestaurants = restaurants.slice(0, 3)
  const activationProgressText = restaurantSelectionRequired
    ? savedRestaurantCount >= 2
      ? `${savedRestaurantCount} saved`
      : 'Save 2 to continue'
    : `${savedRestaurantCount} saved`
  const inputClassName =
    'tb-input min-h-[4.65rem] rounded-[1.6rem] border-[color:var(--border-soft)] bg-white/94 px-5 py-4 text-lg shadow-[0_10px_26px_rgba(11,19,36,0.05)]'
  const backButtonClass =
    'h-14 min-w-[7.75rem] px-8 text-base shadow-[0_12px_28px_rgba(11,19,36,0.08)]'
  const primaryButtonClass =
    'h-14 min-w-[10rem] px-10 text-base shadow-[0_18px_34px_rgba(245,158,11,0.24)]'
  const secondaryActionButtonClass =
    'h-14 min-w-[10rem] px-8 text-base shadow-[0_12px_28px_rgba(11,19,36,0.08)]'
  const canContinueFromFooter =
    stage === 'drinks'
      ? true
      : stage === 'account-email'
        ? email.trim().length > 0
        : !disableContinue

  const footer = (
    <div className="tb-onboarding-actions">
      <div className="tb-onboarding-actions-left">
        {canGoBack ? (
          <Button className={backButtonClass} onClick={goBack} variant="secondary">
            Back
          </Button>
        ) : (
          <span />
        )}
        {stage === 'bio' ? (
          <Button className="h-14 px-8 text-base" onClick={() => continueTo()} variant="ghost">
            Skip for now
          </Button>
        ) : null}
        {stage === 'restaurants' ? (
          <Button className="h-14 px-8 text-base" onClick={handleActivationContinue} variant="ghost">
            Skip for now
          </Button>
        ) : null}
      </div>

      <div className="tb-onboarding-actions-right">
        {stage === 'account-email' ? (
          <Link
            className="text-sm font-semibold text-[color:var(--text-secondary)] underline underline-offset-2"
            href="/login"
          >
            Already have an account? Log in
          </Link>
        ) : null}

        {stage === 'finish' ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className={secondaryActionButtonClass} href="/profile" variant="secondary">
              Edit full profile
            </Button>
            <Button className={primaryButtonClass} href="/dashboard">
              See my dashboard
            </Button>
          </div>
        ) : stage === 'account-password' ? (
          <Button className={primaryButtonClass} disabled={loading} onClick={() => void handleCreateAccount()}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        ) : stage === 'group-age' ? (
          <Button className={primaryButtonClass} disabled={loading || disableContinue} onClick={() => void handleFinishSetup()}>
            {loading ? 'Saving profile...' : 'Continue'}
          </Button>
        ) : stage === 'restaurants' ? (
          <Button
            className={primaryButtonClass}
            disabled={restaurantSelectionRequired && savedRestaurantCount < 2}
            onClick={handleActivationContinue}
          >
            Continue
          </Button>
        ) : (
          <Button
            className={primaryButtonClass}
            disabled={!canContinueFromFooter}
            onClick={() => continueTo()}
          >
            {stage === 'welcome-1' || stage === 'welcome-2'
              ? 'Next'
              : stage === 'welcome-3'
                ? 'Create my profile'
                : 'Continue'}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <StageShell
      currentStep={currentStep}
      direction={direction}
      footer={footer}
      progressTotal={visibleStages.length}
      showLoginLink={!authenticated}
      stageId={stage}
    >
      {stage === 'welcome-1' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Welcome"
            heading="Meet people through places"
            subtext="Tastebuds helps you find people who want the same kind of night out."
          />
        </div>
      ) : null}

      {stage === 'welcome-2' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="How it works"
            heading="Pick your vibe"
            subtext="Cosy dinner, cocktails, casual bite, big group energy — tell us what actually sounds good."
          />
        </div>
      ) : null}

      {stage === 'welcome-3' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Matching"
            heading="Get matched for real plans"
            subtext="We suggest people, places and times that fit how you like to go out."
          />
        </div>
      ) : null}

      {stage === 'account-email' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Create account"
            heading="What’s your email?"
            subtext="We’ll use this to create your Tastebuds account."
          />
          <label className="block space-y-3">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Email</span>
            <input
              autoComplete="email"
              className={inputClassName}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
        </div>
      ) : null}

      {stage === 'account-password' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Create account"
            heading="Create a password"
            subtext="Keep it secure. You’ll use this to log back in."
          />
          <div className="space-y-5">
            <label className="block space-y-3">
              <span className="text-sm font-medium text-[color:var(--foreground)]">Password</span>
              <input
                autoComplete="new-password"
                className={inputClassName}
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                type="password"
                value={password}
              />
            </label>
            <label className="block space-y-3">
              <span className="text-sm font-medium text-[color:var(--foreground)]">
                Confirm password
              </span>
              <input
                autoComplete="new-password"
                className={inputClassName}
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                type="password"
                value={confirmPassword}
              />
            </label>
          </div>
        </div>
      ) : null}

      {stage === 'display-name' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Basics"
            heading="What should people call you?"
            subtext="This is the name people will see when you’re matched."
          />
          <label className="block space-y-3">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Display name</span>
            <input
              autoComplete="name"
              className={inputClassName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, displayName: event.target.value }))
              }
              placeholder="Alex"
              value={draft.displayName}
            />
          </label>
        </div>
      ) : null}

      {stage === 'bio' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Basics"
            heading="Describe your ideal night out"
            subtext="One quick line to help people get your vibe."
          />
          <label className="block space-y-3">
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              Quick line about your ideal night
            </span>
            <textarea
              className="tb-input min-h-44 rounded-[1.8rem] px-5 py-5 text-lg shadow-[0_10px_26px_rgba(11,19,36,0.04)]"
              onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
              placeholder="Cosy table, good food, easy conversation."
              value={draft.bio}
            />
          </label>
        </div>
      ) : null}

      {stage === 'home-area' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Location"
            heading="Where should we start looking?"
            subtext="Add your rough home area so nearby tables rise to the top."
          />
          <LocationSearchField
            description="Choose a suggested area so we can keep nearby tables realistic."
            label="Home area"
            onPick={(suggestion: LocationSuggestion) =>
              setDraft((current) => ({
                ...current,
                homeAnchorQuery: suggestion.label,
                homeLatitude: String(suggestion.latitude),
                homeLongitude: String(suggestion.longitude),
                neighbourhood: suggestion.neighbourhood ?? '',
                subregion: suggestion.subregion,
              }))
            }
            placeholder="Upper West Side, Harlem, East Village..."
            query={draft.homeAnchorQuery}
            setQuery={(value) =>
              setDraft((current) => ({
                ...current,
                homeAnchorQuery: value,
                homeLatitude: '',
                homeLongitude: '',
              }))
            }
          />
        </div>
      ) : null}

      {stage === 'preferred-area' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Location"
            heading="Where do you usually like going out?"
            subtext="Choose the area you’d most happily travel to for a good plan."
          />
          <ChoiceGroup
            label="Preferred area"
            onToggle={(value) =>
              setDraft((current) => ({
                ...current,
                subregion: value as (typeof SUBREGIONS)[number],
              }))
            }
            options={SUBREGIONS}
            selected={[draft.subregion]}
          />
        </div>
      ) : null}

      {stage === 'travel' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Location"
            heading="How far would you travel for the right table?"
            subtext="We’ll keep suggestions realistic."
          />
          <div className="flex flex-wrap gap-3">
            {TRAVEL_WINDOWS.map((minutes) => (
              <ChoiceChip
                active={draft.maxTravelMinutes === minutes}
                key={minutes}
                onClick={() =>
                  setDraft((current) => ({ ...current, maxTravelMinutes: minutes }))
                }
              >
                {minutes} minutes
              </ChoiceChip>
            ))}
          </div>
        </div>
      ) : null}

      {stage === 'price' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Food"
            heading="What feels like a normal spend?"
            subtext="Pick the price bands you’d happily book for an ordinary night out."
          />
          <ChoiceGroup
            label="Price comfort"
            onToggle={(value) =>
              setDraft((current) => ({
                ...current,
                preferredPrice: toggleValue(current.preferredPrice, value),
              }))
            }
            options={PRICE_TAGS}
            selected={draft.preferredPrice}
          />
        </div>
      ) : null}

      {stage === 'cuisines' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Food"
            heading="What food are you actually up for?"
            subtext="Add cuisines you’d genuinely be happy to book."
          />
          <label className="block space-y-3">
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              Preferred cuisines
            </span>
            <input
              className={inputClassName}
              onChange={(event) =>
                setDraft((current) => ({ ...current, cuisinePreferences: event.target.value }))
              }
              placeholder="Italian, French, Thai, Japanese..."
              value={draft.cuisinePreferences}
            />
          </label>
        </div>
      ) : null}

      {stage === 'dietary' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Food"
            heading="Anything we should avoid?"
            subtext="We’ll use this to keep unsuitable places out of your suggestions."
          />
          <ChoiceGroup
            label="Dietary requirements"
            onToggle={(value) =>
              setDraft((current) => ({
                ...current,
                dietaryRestrictions: toggleDietaryValue(
                  current.dietaryRestrictions,
                  value
                ),
              }))
            }
            options={DIETARY_RESTRICTION_TAGS}
            selected={draft.dietaryRestrictions}
          />
        </div>
      ) : null}

      {stage === 'drinks' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Food"
            heading="What kind of drinks fit the plan?"
            subtext="This helps shape the tone of the table."
          />
          <ChoiceGroup
            label="Drinks"
            onToggle={(value) =>
              setDraft((current) => ({
                ...current,
                drinkingPreferences: toggleValue(current.drinkingPreferences, value),
              }))
            }
            options={DRINKING_PREFERENCE_TAGS}
            selected={draft.drinkingPreferences}
          />
        </div>
      ) : null}

      {stage === 'energy-scene' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Dinner vibe"
            heading="What kind of energy feels right?"
            subtext="Quiet catch-up, something lively, or somewhere in between."
          />
          <div className="space-y-6">
            <ChoiceGroup
              label="Energy"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  preferredEnergy: toggleValue(current.preferredEnergy, value),
                }))
              }
              options={ENERGY_LEVELS}
              selected={draft.preferredEnergy}
            />
            <ChoiceGroup
              label="Scene"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  preferredScene: toggleValue(current.preferredScene, value),
                }))
              }
              options={SCENE_TAGS}
              selected={draft.preferredScene}
            />
          </div>
        </div>
      ) : null}

      {stage === 'music-setting' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Dinner vibe"
            heading="What should the place feel like?"
            subtext="Choose the spaces and sound level that fit your kind of night."
          />
          <div className="space-y-6">
            <ChoiceGroup
              label="Music"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  preferredMusic: toggleValue(current.preferredMusic, value),
                }))
              }
              options={MUSIC_TAGS}
              selected={draft.preferredMusic}
            />
            <ChoiceGroup
              label="Setting"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  preferredSetting: toggleValue(current.preferredSetting, value),
                }))
              }
              options={SETTING_TAGS}
              selected={draft.preferredSetting}
            />
          </div>
        </div>
      ) : null}

      {stage === 'vibes' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Dinner vibe"
            heading="Pick the overall vibe"
            subtext="These tags help us understand the full table feel."
          />
          <ChoiceGroup
            label="Atmosphere and occasion"
            onToggle={(value) =>
              setDraft((current) => ({
                ...current,
                preferredVibes: toggleValue(current.preferredVibes, value),
              }))
            }
            options={VIBE_TAGS}
            selected={draft.preferredVibes}
          />
        </div>
      ) : null}

      {stage === 'crowd-conversation' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Social"
            heading="Who do you usually feel comfortable around?"
            subtext="The goal is a table that feels comfortable, not just a place that looks good."
          />
          <div className="space-y-6">
            <ChoiceGroup
              label="Comfort level"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  preferredCrowd: toggleValue(current.preferredCrowd, value),
                }))
              }
              options={CROWD_TAGS}
              selected={draft.preferredCrowd}
            />
            <ChoiceGroup
              label="Conversation style"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  conversationPreference: toggleValue(
                    current.conversationPreference,
                    value
                  ),
                }))
              }
              options={CONVERSATION_ACTIVITY_TAGS}
              selected={draft.conversationPreference}
            />
          </div>
        </div>
      ) : null}

      {stage === 'group-age' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Social"
            heading="What table size feels right?"
            subtext="We’ll use this to guide group suggestions without making it too precious."
          />
          <div className="space-y-6">
            <ChoiceGroup
              label="Preferred group size"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  groupSizeComfort: toggleValue(current.groupSizeComfort, value),
                }))
              }
              options={GROUP_SIZE_COMFORT_TAGS}
              selected={draft.groupSizeComfort}
            />
            <ChoiceGroup
              label="Age mix"
              onToggle={(value) =>
                setDraft((current) => ({
                  ...current,
                  ageRangeComfort: toggleValue(current.ageRangeComfort, value),
                }))
              }
              options={AGE_RANGE_COMFORT_TAGS}
              selected={draft.ageRangeComfort}
            />
          </div>
        </div>
      ) : null}

      {stage === 'restaurants' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Activation"
            heading="Save a few places you’d actually say yes to"
            subtext="Pick a couple of restaurants so your first dashboard feels personal."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-4 py-3">
            <p className="text-sm font-semibold text-[color:var(--foreground)]">
              {activationProgressText}
            </p>
            <p className="text-sm text-[color:var(--text-secondary)]">
              {restaurantSelectionRequired
                ? 'Choose at least 2 restaurants.'
                : 'Not seeing the right places? You can browse more after setup.'}
            </p>
          </div>

          {restaurantsLoading ? (
            <div className="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--text-secondary)]">
              Loading restaurants...
            </div>
          ) : onboardingRestaurants.length > 0 ? (
            <div className="space-y-4">
              {onboardingRestaurants.map((restaurant, index) => (
                <article
                  className="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] shadow-[0_18px_44px_rgba(74,31,20,0.06)]"
                  key={restaurant.id}
                >
                  <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="relative h-40 overflow-hidden md:h-full">
                      <GooglePlacePhoto
                        alt={restaurant.name}
                        enableCarousel={false}
                        fallbackSrc={getRestaurantFallbackImage(index)}
                        imageClassName="h-full w-full object-cover"
                        placeId={restaurant.googlePlaceId}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[color:var(--text-secondary)]">
                            {formatRestaurantMeta(restaurant)}
                          </p>
                          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[color:var(--foreground)]">
                            {restaurant.name}
                          </h2>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--accent-strong)]">
                            {restaurant.matchScore}/100
                          </span>
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                              restaurant.isSaved
                                ? 'bg-[color:var(--status-bg)] text-[color:var(--status-text)]'
                                : 'bg-[color:var(--surface-soft)] text-[color:var(--text-secondary)]'
                            }`}
                          >
                            {restaurant.isSaved ? 'Saved' : 'Choice'}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
                        {restaurant.venueMatchSummary}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(restaurant.matchTags?.slice(0, 3) ?? []).map((tag) => (
                          <TasteTag key={`${restaurant.id}-${tag}`}>{tag}</TasteTag>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-5 py-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">
                          {restaurant.availableEventCount > 0
                            ? `${restaurant.availableEventCount} live table${restaurant.availableEventCount === 1 ? '' : 's'} available`
                            : 'No live tables yet'}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {restaurant.isSaved
                            ? 'Already saved. This will show up on your dashboard after setup.'
                            : 'Save this if you’d genuinely be happy to book it.'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-3">
                        <Button
                          disabled={restaurantActionLoadingId === restaurant.id}
                          onClick={() =>
                            void handleToggleSavedRestaurant(
                              restaurant.id,
                              restaurant.isSaved ? 'unsave' : 'save'
                            )
                          }
                          variant={restaurant.isSaved ? 'secondary' : 'primary'}
                        >
                          {restaurantActionLoadingId === restaurant.id
                            ? 'Updating...'
                            : restaurant.isSaved
                              ? 'Unsave'
                              : 'Save venue'}
                        </Button>
                        <Button
                          onClick={() => setSelectedRestaurant(restaurant)}
                          variant="secondary"
                        >
                          View venue
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
              <p className="text-lg font-semibold text-[color:var(--foreground)]">
                Not seeing the right places?
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                You can browse more after setup.
              </p>
            </div>
          )}

        </div>
      ) : null}

      {stage === 'finish' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Ready"
            heading="Your Tastebuds profile is ready"
            subtext="You’ve set your vibe and saved a few places to start from."
          />
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-4 text-sm text-[color:var(--accent-strong)]">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-4 text-sm text-[color:var(--foreground)]">
          {message}
        </div>
      ) : null}

      {selectedRestaurant ? (
        <RestaurantDetailsModal
          onClose={() => setSelectedRestaurant(null)}
          onToggleSaved={(restaurantId, action) =>
            void handleToggleSavedRestaurant(restaurantId, action)
          }
          restaurant={
            restaurants.find((restaurant) => restaurant.id === selectedRestaurant.id) ??
            selectedRestaurant
          }
          saving={restaurantActionLoadingId === selectedRestaurant.id}
          showEventsAction={false}
        />
      ) : null}
    </StageShell>
  )
}
