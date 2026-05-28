'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/app/Button'
import { clearAppBootstrapCache } from '@/lib/app/client'
import {
  getPendingSignup,
  getPostAuthRoute,
  setSignupConfirmationSignal,
} from '@/lib/auth/onboarding'
import { supabase } from '@/lib/supabase/client'

function hasAuthPayload(url: URL) {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))

  return (
    url.searchParams.has('code') ||
    url.searchParams.has('token_hash') ||
    url.searchParams.has('type') ||
    hashParams.has('access_token') ||
    hashParams.has('refresh_token') ||
    hashParams.has('type')
  )
}

export function LandingAuthConfirmation() {
  const [visible] = useState(() =>
    typeof window !== 'undefined' ? hasAuthPayload(new URL(window.location.href)) : false
  )
  const [message, setMessage] = useState('Verifying your email confirmation...')
  const [continueHref, setContinueHref] = useState('/signup/continue')

  useEffect(() => {
    let active = true

    async function hydrateFromLanding() {
      const url = new URL(window.location.href)

      if (!hasAuthPayload(url)) {
        return
      }

      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const pendingEmail = getPendingSignup()?.email ?? null
      const fallbackHref = pendingEmail
        ? `/signup/continue?email=${encodeURIComponent(pendingEmail)}`
        : '/signup/continue'

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error && active) {
          setMessage('Email confirmed. Return to your original tab, or continue here if needed.')
          setContinueHref(fallbackHref)
          setSignupConfirmationSignal({
            confirmedAt: Date.now(),
            email: pendingEmail,
            route: fallbackHref,
          })
          return
        }
      }

      const authCode = url.searchParams.get('code')

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode)

        if (error && active) {
          setMessage('Email confirmed. Return to your original tab, or continue here if needed.')
          setContinueHref(fallbackHref)
          setSignupConfirmationSignal({
            confirmedAt: Date.now(),
            email: pendingEmail,
            route: fallbackHref,
          })
          return
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (session) {
        clearAppBootstrapCache()
        const nextRoute = await getPostAuthRoute()
        setMessage(
          'Your email is verified. Return to your original tab to continue, or keep going here if that tab does not update.'
        )
        setContinueHref(nextRoute)
        setSignupConfirmationSignal({
          confirmedAt: Date.now(),
          email: session.user.email ?? pendingEmail,
          route: nextRoute,
        })
      } else {
        setMessage('Email confirmed. Return to your original tab, or continue here if needed.')
        setContinueHref(fallbackHref)
        setSignupConfirmationSignal({
          confirmedAt: Date.now(),
          email: pendingEmail,
          route: fallbackHref,
        })
      }

      const cleanUrl = `${url.origin}${url.pathname}`
      window.history.replaceState({}, '', cleanUrl)
    }

    void hydrateFromLanding()

    return () => {
      active = false
    }
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[color:var(--background)]/96 px-4">
      <section className="w-full max-w-xl rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-8 text-center shadow-[0_24px_56px_rgba(0,20,38,0.12)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
          Email confirmation
        </p>
        <h1 className="mt-3 text-[2.35rem] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
          Email verified
        </h1>
        <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)]">
          {message}
        </p>
        <div className="mt-8 flex justify-center">
          <Button href={continueHref}>Continue here instead</Button>
        </div>
      </section>
    </div>
  )
}
