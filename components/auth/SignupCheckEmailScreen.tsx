'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/app/Button'
import { TastebudsLogo } from '@/components/TastebudsLogo'
import {
  buildAuthCallbackUrl,
  clearPendingSignup,
  clearSignupConfirmationSignal,
  getPendingSignup,
  getPostAuthRoute,
  getSignupConfirmationSignal,
} from '@/lib/auth/onboarding'
import { supabase } from '@/lib/supabase/client'

export function SignupCheckEmailScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const email = searchParams.get('email')?.trim() || getPendingSignup()?.email || ''

  useEffect(() => {
    let active = true

    async function continueAfterVerification(emailFromSignal?: string | null) {
      if (!active) {
        return
      }

      setVerifying(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      clearSignupConfirmationSignal()

      if (session) {
        router.replace(await getPostAuthRoute())
        return
      }

      const nextEmail = emailFromSignal ?? email
      router.replace(
        nextEmail
          ? `/signup/continue?email=${encodeURIComponent(nextEmail)}`
          : '/signup/continue'
      )
    }

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (active && user) {
        router.replace(await getPostAuthRoute())
        return
      }

      const existingSignal = getSignupConfirmationSignal()

      if (existingSignal) {
        await continueAfterVerification(existingSignal.email)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || !session) {
        return
      }

      clearSignupConfirmationSignal()
      void getPostAuthRoute().then((route) => router.replace(route))
    })

    function handleStorage(event: StorageEvent) {
      if (event.key === 'tastebuds:signup-confirmation-signal' && event.newValue) {
        const signal = getSignupConfirmationSignal()
        if (signal) {
          void continueAfterVerification(signal.email)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    void loadUser()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
      window.removeEventListener('storage', handleStorage)
    }
  }, [email, router])

  async function handleResend() {
    if (!email) {
      setError('Missing email address. Go back to sign up and try again.')
      return
    }

    setResending(true)
    setError('')
    setMessage('')

    const { error: resendError } = await supabase.auth.resend({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(appUrl, 'signup'),
      },
      type: 'signup',
    })

    setResending(false)

    if (resendError) {
      setError(resendError.message)
      return
    }

    setMessage('Confirmation email resent.')
  }

  async function handleContinueSetup() {
    const nextEmail = email

    setContinuing(true)
    setError('')
    setMessage('')

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    setContinuing(false)

    if (sessionError) {
      setError(sessionError.message)
      return
    }

    if (session) {
      router.replace(await getPostAuthRoute())
      return
    }

    router.replace(
      nextEmail ? `/signup/continue?email=${encodeURIComponent(nextEmail)}` : '/signup/continue'
    )
  }

  function handleBackToSignup() {
    clearPendingSignup()
    router.replace('/signup')
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] px-6 py-5 text-white shadow-[0_18px_42px_rgba(0,20,38,0.18)]">
          <TastebudsLogo showTagline size="sm" theme="dark" />
        </div>

        <section className="mt-6 rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 shadow-[0_24px_56px_rgba(0,20,38,0.08)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
            Email confirmation
          </p>
          <h1 className="mt-3 text-[2.5rem] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
            Check your email
          </h1>
          <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)]">
            We&apos;ve sent you a confirmation link. Open it to continue setting up your
            Tastebuds profile.
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            If it does not arrive, check your spam folder.
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
            If you already clicked the email in another tab, come back here and continue.
          </p>

          {email ? (
            <p className="mt-5 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)]">
              Sent to {email}
            </p>
          ) : null}

          {verifying ? (
            <p className="mt-5 rounded-[1.5rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)]">
              Email verified. Continuing your onboarding...
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button disabled={continuing || verifying} onClick={() => void handleContinueSetup()}>
              {continuing ? 'Checking confirmation...' : 'I’ve verified my email'}
            </Button>
            <Button disabled={resending || verifying || !email} onClick={() => void handleResend()}>
              {resending ? 'Resending...' : 'Resend email'}
            </Button>
            <Button disabled={verifying || continuing} onClick={handleBackToSignup} variant="secondary">
              Back to sign up
            </Button>
          </div>

          {error ? (
            <p className="mt-4 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-3 text-sm text-[color:var(--accent-strong)]">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="mt-4 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-3 text-sm text-[color:var(--foreground)]">
              {message}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  )
}
