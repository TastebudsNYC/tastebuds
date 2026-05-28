'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthShell } from '@/components/app/AuthShell'
import { Button } from '@/components/app/Button'
import { clearAppBootstrapCache } from '@/lib/app/client'
import {
  clearPendingSignup,
  getPendingSignup,
  getPostAuthRoute,
} from '@/lib/auth/onboarding'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const isSignupFlow = searchParams.get('flow') === 'signup'

  useEffect(() => {
    let active = true

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active && session) {
          clearAppBootstrapCache()
          clearPendingSignup()
          void getPostAuthRoute().then((route) => router.replace(route))
        }
      }
    )

    async function finishAuth() {
      const searchParams = new URLSearchParams(window.location.search)
      const authCode = searchParams.get('code')
      const authError =
        searchParams.get('error_description') ?? searchParams.get('error')
      const isSignupFlow = searchParams.get('flow') === 'signup'

      if (authError) {
        if (active) {
          setError(decodeURIComponent(authError))
        }
        return
      }

      if (authCode) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(authCode)

        if (exchangeError) {
          if (active) {
            setError(exchangeError.message)
          }
          return
        }

        if (active) {
          clearAppBootstrapCache()
          clearPendingSignup()
          router.replace(await getPostAuthRoute())
        }
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        if (active) {
          setError(sessionError.message)
        }
        return
      }

      if (session) {
        clearAppBootstrapCache()
        clearPendingSignup()
        router.replace(await getPostAuthRoute())
        return
      }

      if (active && isSignupFlow) {
        const pendingEmail = getPendingSignup()?.email
        router.replace(
          pendingEmail
            ? `/signup/continue?email=${encodeURIComponent(pendingEmail)}`
            : '/signup/continue'
        )
        return
      }

      if (active) {
        setError('No active session was found. Try logging in again.')
      }
    }

    void finishAuth()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [router])

  return (
    <AuthShell
      aside={
        <>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Finishing sign-in.
          </h1>
          <p className="tb-copy mt-6 max-w-xl text-lg leading-8">
            We&apos;re restoring your account, then sending you back to your saved venues, live tables and profile.
          </p>
        </>
      }
      asideTitle="Authentication"
      title="Authentication"
    >
      <p className="tb-label text-sm font-medium uppercase tracking-[0.2em]">
        Authentication
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
        Finishing sign-in
      </h1>
      <p className="tb-copy mt-4 text-sm leading-6">
        Completing the redirect and restoring your session.
      </p>

      {error ? (
        <div className="mt-6 space-y-4 rounded-3xl border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-5 text-sm text-[color:var(--accent-strong)]">
          <p>{error}</p>
          <Button href={isSignupFlow ? '/signup/continue' : '/login'} variant="secondary">
            {isSignupFlow ? 'Continue onboarding' : 'Go back to login'}
          </Button>
        </div>
      ) : (
        <p className="tb-copy mt-6 text-sm">Signing you in...</p>
      )}
    </AuthShell>
  )
}
