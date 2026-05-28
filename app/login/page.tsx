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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <main className="min-h-screen bg-[color:var(--background)] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col gap-6 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between gap-4 rounded-[2rem] border border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] px-5 py-4 text-white shadow-[0_18px_42px_rgba(0,20,38,0.18)]">
          <TastebudsLogo showTagline size="sm" theme="dark" />
          <Button href="/signup">Create profile</Button>
        </header>

        <section className="grid flex-1 items-center gap-6 lg:grid-cols-[1fr_480px]">
          <div className="hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.07)] lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
              Returning users
            </p>
            <h1 className="mt-4 text-5xl font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
              Log in to Tastebuds
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--text-secondary)]">
              Get back to your saved places, live tables and dinner plans.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6 shadow-[0_24px_56px_rgba(0,20,38,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
              Login
            </p>
            <h1 className="mt-3 text-[2.4rem] font-bold tracking-[-0.05em] text-[color:var(--foreground)]">
              Log in to Tastebuds
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
                {loading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>

            {error ? (
              <p className="mt-4 rounded-[1.5rem] border border-[color:color-mix(in_srgb,var(--accent)_28%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface))] p-3 text-sm text-[color:var(--accent-strong)]">
                {error}
              </p>
            ) : null}

            <p className="mt-6 text-sm text-[color:var(--text-secondary)]">
              New to Tastebuds?{' '}
              <Link
                className="font-semibold text-[color:var(--foreground)] underline"
                href="/signup"
              >
                Create a profile
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
