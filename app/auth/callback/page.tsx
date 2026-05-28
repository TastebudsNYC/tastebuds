'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/app/Button'
import { TastebudsLogo } from '@/components/TastebudsLogo'
import { clearAppBootstrapCache } from '@/lib/app/client'
import {
  getPendingSignup,
  getPostAuthRoute,
  setSignupConfirmationSignal,
} from '@/lib/auth/onboarding'
import { supabase } from '@/lib/supabase/client'

type CallbackState = 'working' | 'verified' | 'needs-login' | 'error'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSignupFlow = searchParams.get('flow') === 'signup'
  const [error, setError] = useState('')
  const [status, setStatus] = useState<CallbackState>('working')
  const [continueHref, setContinueHref] = useState('/signup/continue')
  const pendingEmail = useMemo(() => getPendingSignup()?.email ?? null, [])

  useEffect(() => {
    let active = true

    async function finishAuth() {
      const params = new URLSearchParams(window.location.search)
      const authCode = params.get('code')
      const authError = params.get('error_description') ?? params.get('error')

      if (authError) {
        if (active) {
          setError(decodeURIComponent(authError))
          setStatus('error')
        }
        return
      }

      if (authCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)

        if (exchangeError) {
          if (active) {
            setError(exchangeError.message)
            setStatus('error')
          }
          return
        }
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        if (active) {
          setError(sessionError.message)
          setStatus('error')
        }
        return
      }

      const fallbackHref = pendingEmail
        ? `/signup/continue?email=${encodeURIComponent(pendingEmail)}`
        : '/signup/continue'

      if (!session) {
        if (active) {
          if (isSignupFlow) {
            setContinueHref(fallbackHref)
            setSignupConfirmationSignal({
              confirmedAt: Date.now(),
              email: pendingEmail,
              route: fallbackHref,
            })
            setStatus('needs-login')
            return
          }

          setError('No active session was found. Try logging in again.')
          setStatus('error')
        }
        return
      }

      clearAppBootstrapCache()
      const nextRoute = await getPostAuthRoute()

      if (!active) {
        return
      }

      setContinueHref(nextRoute)

      if (isSignupFlow) {
        setSignupConfirmationSignal({
          confirmedAt: Date.now(),
          email: session.user.email ?? pendingEmail,
          route: nextRoute,
        })
        setStatus('verified')
        return
      }

      router.replace(nextRoute)
    }

    void finishAuth()

    return () => {
      active = false
    }
  }, [isSignupFlow, pendingEmail, router])

  const title =
    status === 'verified'
      ? 'Email verified'
      : status === 'needs-login'
        ? 'Email confirmed'
        : status === 'error'
          ? 'Authentication issue'
          : 'Finishing sign-in'

  const description =
    status === 'verified'
      ? 'Your Tastebuds account is confirmed. You can return to your original tab to keep setting up your profile.'
      : status === 'needs-login'
        ? 'Your email is confirmed. Return to your original tab, or continue onboarding here if that session does not move forward.'
        : status === 'error'
          ? error
          : 'Restoring your confirmation and preparing the next onboarding step.'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <section className="w-full max-w-xl rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 text-center shadow-[0_24px_56px_rgba(0,20,38,0.08)] sm:p-10">
        <div className="flex justify-center">
          <TastebudsLogo showTagline size="sm" theme="light" />
        </div>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
          Email confirmation
        </p>
        <h1 className="mt-3 text-[2.35rem] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)]">
          {description}
        </p>

        {status === 'working' ? (
          <p className="mt-8 text-sm font-medium text-[color:var(--text-secondary)]">
            Verifying your account...
          </p>
        ) : null}

        {status === 'verified' ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={continueHref}>Continue here instead</Button>
          </div>
        ) : null}

        {status === 'needs-login' ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={continueHref}>Continue onboarding here</Button>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={isSignupFlow ? continueHref : '/login'}>
              {isSignupFlow ? 'Continue onboarding' : 'Go to login'}
            </Button>
          </div>
        ) : null}
      </section>
    </main>
  )
}
