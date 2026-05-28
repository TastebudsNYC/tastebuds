'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthShell } from '@/components/app/AuthShell'
import { Button } from '@/components/app/Button'
import { TastebudsLogo } from '@/components/TastebudsLogo'
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

  if (variant === 'login') {
    return (
      <main className="min-h-screen bg-[color:var(--background)]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.48fr_0.52fr]">
          <section className="relative overflow-hidden bg-[color:var(--nav-bg)] text-white">
            <div className="absolute inset-0">
              <Image
                alt="Warm restaurant table lighting"
                className="h-full w-full object-cover"
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                src="/assets/landing/pexels-isabeu-18556882.jpg"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,36,0.38),rgba(11,19,36,0.88)),radial-gradient(circle_at_78%_82%,rgba(255,193,67,0.2),transparent_0_24%),radial-gradient(circle_at_18%_18%,rgba(255,193,67,0.12),transparent_0_20%)]" />
            <div className="relative flex min-h-[34vh] flex-col px-6 py-8 sm:px-8 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12">
              <div className="flex items-start justify-between gap-4">
                <TastebudsLogo showTagline={false} size="sm" theme="dark" />
                <Link
                  className="inline-flex rounded-full border border-white/14 px-5 py-2.5 text-sm font-semibold text-white/76 transition hover:border-white/24 hover:bg-white/6 hover:text-white lg:hidden"
                  href="/signup"
                >
                  Create profile
                </Link>
              </div>

              <div className="mt-12 max-w-[30rem] lg:mt-auto lg:mb-10">
                <h1 className="text-[2.9rem] leading-[0.94] font-bold tracking-[-0.06em] text-white sm:text-[3.6rem] lg:text-[4.8rem]">
                  Welcome back to Tastebuds
                </h1>
                <p className="mt-6 max-w-[26rem] text-lg leading-8 text-white/74">
                  Saved places, live tables and dinner plans — all in one place.
                </p>

                <div className="mt-8 h-px w-full max-w-[22rem] bg-white/12 lg:mt-10" />

                <div className="mt-8 space-y-7 lg:mt-10">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_18px_rgba(255,193,67,0.5)]" />
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                        Find your saved spots
                      </h2>
                      <p className="mt-2 text-base leading-7 text-white/66">
                        All your favourite places in one place.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_18px_rgba(255,193,67,0.5)]" />
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                        Jump into upcoming tables
                      </h2>
                      <p className="mt-2 text-base leading-7 text-white/66">
                        Live events and dinner plans.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)] shadow-[0_0_18px_rgba(255,193,67,0.5)]" />
                    <div>
                      <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                        Keep discovering places
                      </h2>
                      <p className="mt-2 text-base leading-7 text-white/66">
                        Curated for your taste and vibe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[66vh] bg-[color:var(--background)] px-6 py-8 sm:px-8 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12">
            <div className="flex w-full flex-col">
              <div className="hidden items-center justify-end lg:flex">
                <Link
                  className="inline-flex rounded-full border border-[color:var(--border-soft)] bg-white px-6 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[0_12px_28px_rgba(11,19,36,0.06)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-soft)]"
                  href="/signup"
                >
                  Create profile
                </Link>
              </div>

              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-[31rem]">
                  <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:rgba(255,255,255,0.72)] p-7 shadow-[0_18px_44px_rgba(74,31,20,0.06)] backdrop-blur-[2px] sm:p-9 lg:p-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
                      {copy.eyebrow}
                    </p>
                    <h2 className="mt-4 text-[2.45rem] font-bold tracking-[-0.055em] text-[color:var(--foreground)] sm:text-[3rem]">
                      {copy.heading}
                    </h2>
                    <p className="mt-4 max-w-[24rem] text-base leading-7 text-[color:var(--text-secondary)]">
                      Get back to your saved places, live tables and dinner plans.
                    </p>

                    <form className="mt-9 space-y-5" onSubmit={handleLogin}>
                      <label className="block space-y-2.5">
                        <span className="text-sm font-semibold text-[color:var(--foreground)]">
                          Email
                        </span>
                        <input
                          autoComplete="email"
                          className="tb-input rounded-[1.15rem] border-[color:var(--border-soft)] bg-white/94 px-4 py-[0.95rem]"
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          required
                          type="email"
                          value={email}
                        />
                      </label>

                      <label className="block space-y-2.5">
                        <span className="text-sm font-semibold text-[color:var(--foreground)]">
                          Password
                        </span>
                        <input
                          autoComplete="current-password"
                          className="tb-input rounded-[1.15rem] border-[color:var(--border-soft)] bg-white/94 px-4 py-[0.95rem]"
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

                    <p className="mt-7 text-sm text-[color:var(--text-secondary)]">
                      New to Tastebuds?{' '}
                      <Link
                        className="font-semibold text-[color:var(--foreground)] underline underline-offset-2"
                        href={copy.secondaryHref}
                      >
                        {copy.secondaryLabel}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    )
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
