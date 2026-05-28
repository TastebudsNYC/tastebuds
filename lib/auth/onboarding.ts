import { getAppBootstrap } from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'

const PENDING_SIGNUP_KEY = 'tastebuds:pending-signup'
const ONBOARDING_ACTIVATION_KEY = 'tastebuds:onboarding-activation-pending'
const SIGNUP_CONFIRMATION_SIGNAL_KEY = 'tastebuds:signup-confirmation-signal'

type PendingSignupState = {
  email: string
}

type SignupConfirmationSignal = {
  confirmedAt: number
  email: string | null
  route: string
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

export function setSignupConfirmationSignal(signal: SignupConfirmationSignal) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(SIGNUP_CONFIRMATION_SIGNAL_KEY, JSON.stringify(signal))
}

export function getSignupConfirmationSignal() {
  if (!canUseStorage()) {
    return null
  }

  const rawValue = window.localStorage.getItem(SIGNUP_CONFIRMATION_SIGNAL_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as SignupConfirmationSignal
  } catch {
    return null
  }
}

export function clearSignupConfirmationSignal() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(SIGNUP_CONFIRMATION_SIGNAL_KEY)
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
