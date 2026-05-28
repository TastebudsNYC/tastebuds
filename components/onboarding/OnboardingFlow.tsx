'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/app/Button'
import { TastebudsLogo } from '@/components/TastebudsLogo'
import {
  LocationSearchField,
  type LocationSuggestion,
} from '@/components/location-search-field'
import { clearAppBootstrapCache, getAppBootstrap } from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'
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
  summarizeProfileDraft,
  TRAVEL_WINDOWS,
  type ProfileDraft,
} from '@/lib/app/profile-draft'
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
  | 'finish'

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
  'finish',
]

function StageShell({
  backLabel,
  children,
  currentStep,
  onBack,
  progressTotal,
}: {
  backLabel?: string
  children: React.ReactNode
  currentStep: number
  onBack?: () => void
  progressTotal: number
}) {
  const progress = progressTotal <= 1 ? 1 : currentStep / progressTotal

  return (
    <main className="min-h-screen bg-[color:var(--background)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col gap-6 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between gap-4 rounded-[2rem] border border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] px-5 py-4 text-white shadow-[0_18px_42px_rgba(0,20,38,0.18)]">
          <TastebudsLogo showTagline size="sm" theme="dark" />
          <div className="min-w-[160px]">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f8dfba]">
              <span>Setup</span>
              <span>
                {currentStep}
                {' '}
                /
                {' '}
                {progressTotal}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(progress, 0.06) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[760px] rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 shadow-[0_24px_56px_rgba(0,20,38,0.08)] sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              {onBack ? (
                <button
                  className="text-sm font-semibold text-[color:var(--text-secondary)] transition hover:text-[color:var(--foreground)]"
                  onClick={onBack}
                  type="button"
                >
                  ← {backLabel ?? 'Back'}
                </button>
              ) : (
                <span />
              )}
              <Link
                className="text-sm font-semibold text-[color:var(--text-secondary)] transition hover:text-[color:var(--foreground)]"
                href="/login"
              >
                Log in
              </Link>
            </div>
            {children}
          </div>
        </section>
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
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 text-[2.35rem] font-bold leading-[0.96] tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[3rem]">
        {heading}
      </h1>
      <p className="mt-4 max-w-[36rem] text-base leading-7 text-[color:var(--text-secondary)]">
        {subtext}
      </p>
    </div>
  )
}

function ChoiceChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={
        active
          ? 'rounded-[1.25rem] border border-[color:var(--accent)] bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-[color:var(--accent-text)] shadow-[0_10px_20px_rgba(245,158,11,0.28)] transition'
          : 'rounded-[1.25rem] border border-[color:var(--border-soft)] bg-white px-4 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent-border)] hover:bg-[color:var(--surface-soft)]'
      }
      onClick={onClick}
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
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[color:var(--foreground)]">{label}</p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <ChoiceChip
            active={selected.includes(option)}
            key={option}
            onClick={() => onToggle(option)}
          >
            {option}
          </ChoiceChip>
        ))}
      </div>
    </div>
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  useEffect(() => {
    let active = true

    async function bootstrapFlow() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (!session?.user) {
        if (mode === 'resume') {
          router.replace('/login')
          return
        }

        setAuthenticated(false)
        setSessionChecked(true)
        return
      }

      const bootstrap = await getAppBootstrap()

      if (!active) {
        return
      }

      if (isProfileComplete(bootstrap.profile)) {
        router.replace('/dashboard')
        return
      }

      const nextDraft = profileToDraft(bootstrap.profile)
      setDraft(nextDraft)
      setUserId(bootstrap.userId)
      setAuthenticated(true)
      setSessionChecked(true)
      setStage(getProfileStartStage(nextDraft))
    }

    void bootstrapFlow().catch(() => {
      if (active) {
        if (mode === 'resume') {
          router.replace('/login')
          return
        }

        setAuthenticated(false)
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

  function getAuthRedirectUrl() {
    const baseUrl =
      appUrl.trim().length > 0 ? appUrl.replace(/\/+$/, '') : window.location.origin

    return `${baseUrl}/auth/callback`
  }

  function goBack() {
    if (!canGoBack) {
      return
    }

    setError('')
    setMessage('')
    setStage(visibleStages[currentStageIndex - 1] ?? visibleStages[0]!)
  }

  function continueTo(nextStage?: StageId) {
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (!data.session?.user) {
      setMessage('Check your email to confirm your account, then log in to continue.')
      return
    }

    clearAppBootstrapCache()
    setAuthenticated(true)
    setUserId(data.session.user.id)
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
      setStage('finish')
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Could not save your profile.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (!sessionChecked) {
    return (
      <StageShell currentStep={1} progressTotal={visibleStages.length}>
        <StageHeading
          heading="Preparing your setup"
          subtext="Loading your account and profile so you can carry on where you left off."
        />
      </StageShell>
    )
  }

  const disableContinue = !isStageComplete(stage, draft)

  return (
    <StageShell
      backLabel={stage === 'account-password' ? 'Back' : 'Previous'}
      currentStep={currentStep}
      progressTotal={visibleStages.length}
      {...(canGoBack ? { onBack: goBack } : {})}
    >
      {stage === 'welcome-1' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Welcome"
            heading="Meet people through places"
            subtext="Tastebuds helps you find people who want the same kind of night out."
          />
          <Button className="min-w-36" onClick={() => continueTo()}>
            Next
          </Button>
        </div>
      ) : null}

      {stage === 'welcome-2' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="How it works"
            heading="Pick your vibe"
            subtext="Cosy dinner, cocktails, casual bite, big group energy — tell us what actually sounds good."
          />
          <Button className="min-w-36" onClick={() => continueTo()}>
            Next
          </Button>
        </div>
      ) : null}

      {stage === 'welcome-3' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Matching"
            heading="Get matched for real plans"
            subtext="We suggest people, places and times that fit how you like to go out."
          />
          <Button className="min-w-44" onClick={() => continueTo()}>
            Create my profile
          </Button>
        </div>
      ) : null}

      {stage === 'account-email' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Create account"
            heading="What’s your email?"
            subtext="We’ll use this to create your Tastebuds account."
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Email</span>
            <input
              autoComplete="email"
              className="tb-input"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="min-w-36"
              disabled={!email.trim()}
              onClick={() => continueTo()}
            >
              Continue
            </Button>
            <Link
              className="text-sm font-semibold text-[color:var(--text-secondary)] underline"
              href="/login"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      ) : null}

      {stage === 'account-password' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Create account"
            heading="Create a password"
            subtext="Keep it secure. You’ll use this to log back in."
          />
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--foreground)]">Password</span>
              <input
                autoComplete="new-password"
                className="tb-input"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                type="password"
                value={password}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--foreground)]">
                Confirm password
              </span>
              <input
                autoComplete="new-password"
                className="tb-input"
                minLength={6}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                type="password"
                value={confirmPassword}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="min-w-40" disabled={loading} onClick={() => void handleCreateAccount()}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
            <Button onClick={goBack} variant="secondary">
              Back
            </Button>
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
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Display name</span>
            <input
              autoComplete="name"
              className="tb-input"
              onChange={(event) =>
                setDraft((current) => ({ ...current, displayName: event.target.value }))
              }
              placeholder="Alex"
              value={draft.displayName}
            />
          </label>
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
        </div>
      ) : null}

      {stage === 'bio' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Basics"
            heading="Describe your ideal night out"
            subtext="One quick line to help people get your vibe."
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              Quick line about your ideal night
            </span>
            <textarea
              className="tb-input min-h-28 rounded-[1.5rem]"
              onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
              placeholder="Cosy table, good food, easy conversation."
              value={draft.bio}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button className="min-w-36" onClick={() => continueTo()}>
              Continue
            </Button>
            <Button onClick={() => continueTo()} variant="secondary">
              Skip for now
            </Button>
          </div>
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
            placeholder="Bath, Bristol, Long Island City..."
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
        </div>
      ) : null}

      {stage === 'cuisines' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Food"
            heading="What food are you actually up for?"
            subtext="Add cuisines you’d genuinely be happy to book."
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              Preferred cuisines
            </span>
            <input
              className="tb-input"
              onChange={(event) =>
                setDraft((current) => ({ ...current, cuisinePreferences: event.target.value }))
              }
              placeholder="Italian, French, Thai, Japanese..."
              value={draft.cuisinePreferences}
            />
          </label>
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-36" disabled={disableContinue} onClick={() => continueTo()}>
            Continue
          </Button>
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
          <Button className="min-w-40" disabled={loading || disableContinue} onClick={() => void handleFinishSetup()}>
            {loading ? 'Saving profile...' : 'Continue'}
          </Button>
        </div>
      ) : null}

      {stage === 'finish' ? (
        <div className="space-y-8">
          <StageHeading
            eyebrow="Ready"
            heading="Your Tastebuds profile is ready"
            subtext={summarizeProfileDraft(draft)}
          />
          <div className="flex flex-wrap gap-3">
            <Button className="min-w-44" href="/dashboard">
              See my dashboard
            </Button>
            <Button href="/profile" variant="secondary">
              Edit full profile
            </Button>
          </div>
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
    </StageShell>
  )
}
