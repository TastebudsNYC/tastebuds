import { getAppBootstrap } from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'

const PENDING_SIGNUP_KEY = 'tastebuds:pending-signup'
const ONBOARDING_ACTIVATION_KEY = 'tastebuds:onboarding-activation-pending'

type PendingSignupState = {
  email: string
}

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function buildAuthCallbackUrl(
  appUrl: string | null | undefined,
  flow: 'login' | 'signup' = 'login'
) {
  const baseUrl =
    appUrl?.trim().length
      ? appUrl.replace(/\/+$/, '')
      : typeof window !== 'undefined'
        ? window.location.origin
        : ''

  return `${baseUrl}/auth/callback?flow=${flow}`
}

export function setPendingSignup(email: string) {
  if (!canUseStorage()) {
    return
  }

  const payload: PendingSignupState = { email }
  window.localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload))
}

export function getPendingSignup() {
  if (!canUseStorage()) {
    return null
  }

  const rawValue = window.localStorage.getItem(PENDING_SIGNUP_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as PendingSignupState
  } catch {
    return null
  }
}

export function clearPendingSignup() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(PENDING_SIGNUP_KEY)
}

export function setOnboardingActivationPending() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(ONBOARDING_ACTIVATION_KEY, 'pending')
}

export function hasOnboardingActivationPending() {
  if (!canUseStorage()) {
    return false
  }

  return window.localStorage.getItem(ONBOARDING_ACTIVATION_KEY) === 'pending'
}

export function clearOnboardingActivationPending() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(ONBOARDING_ACTIVATION_KEY)
}

export async function getPostAuthRoute() {
  const bootstrap = await getAppBootstrap()

  return isProfileComplete(bootstrap.profile) && !hasOnboardingActivationPending()
    ? '/dashboard'
    : '/onboarding'
}
