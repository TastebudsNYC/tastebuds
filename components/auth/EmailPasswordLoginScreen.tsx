'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthShell } from '@/components/app/AuthShell'
import { Button } from '@/components/app/Button'
import { clearAppBootstrapCache } from '@/lib/app/client'
import { clearPendingSignup, getPostAuthRoute } from '@/lib/auth/onboarding'
import { supabase } from '@/lib/supabase/client'

type LoginScreenVariant = 'continue' | 'login'

const SCREEN_COPY: Record<
  LoginScreenVariant,
  {
    asideBody: string
    asideHeading: string
    body: string
    eyebrow: string
    heading: string
    secondaryHref: string
    secondaryLabel: string
    submitLabel: string
  }
> = {
  continue: {
    asideBody:
      'Your email is confirmed. Sign in once to carry on from the next incomplete onboarding step.',
    asideHeading: 'Continue onboarding',
    body: 'Use the email and password for the account you just confirmed.',
    eyebrow: 'Continue setup',
    heading: 'Continue onboarding',
    secondaryHref: '/signup',
    secondaryLabel: 'Back to sign up',
    submitLabel: 'Continue onboarding',
  },
  login: {
    asideBody: 'Get back to your saved places, live tables and dinner plans.',
    asideHeading: 'Log in to Tastebuds',
    body: '',
    eyebrow: 'Login',
    heading: 'Log in to Tastebuds',
    secondaryHref: '/signup',
    secondaryLabel: 'Create a profile',
    submitLabel: 'Log in',
  },
}

export function EmailPasswordLoginScreen({
  initialEmail = '',
  variant,
}: {
  initialEmail?: string
  variant: LoginScreenVariant
}) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const copy = SCREEN_COPY[variant]

  useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

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

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    clearAppBootstrapCache()
    clearPendingSignup()
    router.replace(await getPostAuthRoute())
  }

  return (
    <AuthShell
      aside={
        <>
          <h1 className="mt-4 text-5xl font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
            {copy.asideHeading}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--text-secondary)]">
            {copy.asideBody}
          </p>
        </>
      }
      asideTitle={variant === 'continue' ? 'Continue setup' : 'Returning users'}
      title={variant === 'continue' ? 'Continue setup' : 'Log in'}
    >
      {copy.body ? <p className="tb-copy text-sm leading-6">{copy.body}</p> : null}
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 text-[2.4rem] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
        {copy.heading}
      </h1>
      <form className="mt-8 space-y-4" onSubmit={handleLogin}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Email</span>
          <input
            autoComplete="email"
            className="tb-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Password</span>
          <input
            autoComplete="current-password"
            className="tb-input"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <Button className="mt-2 w-full" disabled={loading} type="submit">
          {loading ? 'Logging in...' : copy.submitLabel}
        </Button>
      </form>

      {error ? (
        <p className="mt-4 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-3 text-sm text-[color:var(--accent-strong)]">
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
        {variant === 'continue' ? 'Need a different route? ' : 'New to Tastebuds? '}
        <Link
          className="font-semibold text-[color:var(--foreground)] underline"
          href={copy.secondaryHref}
        >
          {copy.secondaryLabel}
        </Link>
      </p>
    </AuthShell>
  )
}
