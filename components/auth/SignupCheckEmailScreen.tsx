'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthShell } from '@/components/app/AuthShell'
import { Button } from '@/components/app/Button'
import {
  buildAuthCallbackUrl,
  clearPendingSignup,
  getPostAuthRoute,
} from '@/lib/auth/onboarding'
import { supabase } from '@/lib/supabase/client'

export function SignupCheckEmailScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const email = searchParams.get('email')?.trim() ?? ''

  useEffect(() => {
    let active = true

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (active && user) {
        router.replace(await getPostAuthRoute())
      }
    }

    void loadUser()

    return () => {
      active = false
    }
  }, [router])

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

  function handleBackToSignup() {
    clearPendingSignup()
    router.replace('/signup')
  }

  return (
    <AuthShell
      aside={
        <>
          <h1 className="mt-4 text-5xl font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
            Check your email
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--text-secondary)]">
            Open the confirmation link to keep moving through your Tastebuds setup.
          </p>
        </>
      }
      asideTitle="Sign up"
      title="Check your email"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
        Email confirmation
      </p>
      <h1 className="mt-3 text-[2.4rem] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
        Check your email
      </h1>
      <p className="mt-4 text-base leading-7 text-[color:var(--text-secondary)]">
        We&apos;ve sent you a confirmation link. Open it to continue setting up your Tastebuds
        profile.
      </p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        If it does not arrive, check your spam folder.
      </p>
      {email ? (
        <p className="mt-4 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)]">
          Sent to {email}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button disabled={resending || !email} onClick={() => void handleResend()}>
          {resending ? 'Resending...' : 'Resend email'}
        </Button>
        <Button onClick={handleBackToSignup} variant="secondary">
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
    </AuthShell>
  )
}
