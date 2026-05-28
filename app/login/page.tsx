'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/app/Button'
import { TastebudsLogo } from '@/components/TastebudsLogo'
import { getAppBootstrap } from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'
import { supabase } from '@/lib/supabase/client'

async function getPostAuthRoute() {
  const bootstrap = await getAppBootstrap()
  return isProfileComplete(bootstrap.profile) ? '/dashboard' : '/onboarding'
}

function WaitingRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
      <span className="text-sm font-medium text-white">{children}</span>
      <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

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

    router.replace(await getPostAuthRoute())
  }

  async function handleGoogleLogin() {
    setOauthLoading(true)
    setError('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setOauthLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="w-full border-b border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] text-white shadow-[0_18px_42px_rgba(0,20,38,0.16)]">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <TastebudsLogo showTagline size="sm" theme="dark" />
            <p className="mt-1 text-lg font-semibold text-white">Log in</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              href="/login"
              variant="ghost"
            >
              Log in
            </Button>
            <Button href="/signup">Sign up</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] p-8 text-white shadow-[0_24px_60px_rgba(0,20,38,0.18)] lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                Existing account
              </p>
              <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-[-0.04em] text-white">
                Welcome back to Tastebuds.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-[#d8e2ec]">
                Your saved venues, live tables and dinner updates are waiting.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f8dfba]">
                    Waiting for you
                  </p>
                  <div className="mt-4 space-y-3">
                    <WaitingRow>Saved venues</WaitingRow>
                    <WaitingRow>Hosted tables</WaitingRow>
                    <WaitingRow>Dinner reminders</WaitingRow>
                    <WaitingRow>Taste profile</WaitingRow>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[color:var(--accent-border)] bg-[color:var(--surface-soft)] p-5 text-[color:var(--foreground)] shadow-[0_14px_34px_rgba(74,31,20,0.12)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                      Status
                    </p>
                    <p className="mt-3 text-xl font-semibold">1 live table at a saved venue</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      Your watchlist is ready when you are.
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 text-[#d8e2ec]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f8dfba]">
                      Tonight
                    </p>
                    <p className="mt-3 text-base font-semibold text-white">Curry Night</p>
                    <p className="mt-1 text-sm text-[#d8e2ec]">Paisley · Midtown</p>
                    <p className="mt-2 text-sm text-[#d8e2ec]">Fri, May 15 · Table for 6</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-7 shadow-[0_20px_50px_rgba(74,31,20,0.12)] sm:p-8">
            <p className="tb-label text-sm font-medium uppercase tracking-[0.2em]">Log in</p>
            <h2 className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">Log in</h2>
            <p className="tb-copy mt-3 text-sm leading-6">
              Access your saved venues, joined tables and dinner updates.
            </p>

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

              <div className="pt-2">
                <Button className="w-full" disabled={loading || oauthLoading} type="submit">
                  {loading ? 'Logging in...' : 'Log in'}
                </Button>
              </div>
            </form>

            <Button
              className="mt-4 w-full"
              disabled={loading || oauthLoading}
              onClick={handleGoogleLogin}
              type="button"
              variant="secondary"
            >
              {oauthLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </Button>

            {error ? (
              <p className="mt-4 rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-3 text-sm text-[color:var(--accent-strong)]">
                {error}
              </p>
            ) : null}

            <div className="mt-6 border-t border-[color:var(--border-soft)] pt-5">
              <p className="tb-copy text-sm">
                New here?{' '}
                <Link className="font-medium text-[color:var(--foreground)] underline" href="/signup">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
