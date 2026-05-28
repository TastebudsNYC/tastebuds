'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AuthShell } from '@/components/app/AuthShell'
import { Button } from '@/components/app/Button'
import { getAppBootstrap } from '@/lib/app/client'
import { isProfileComplete } from '@/lib/app/format'
import { supabase } from '@/lib/supabase/client'

async function getPostAuthRoute() {
  const bootstrap = await getAppBootstrap()
  return isProfileComplete(bootstrap.profile) ? '/dashboard' : '/onboarding'
}

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  function getAuthRedirectUrl() {
    const baseUrl = appUrl.trim().length > 0 ? appUrl.replace(/\/+$/, '') : window.location.origin

    return `${baseUrl}/auth/callback`
  }

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

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name.trim(),
        },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.session) {
      router.replace('/onboarding')
      return
    }

    setMessage('Check your email to confirm your account, then continue into your taste profile.')
  }

  async function handleGoogleSignup() {
    setOauthLoading(true)
    setError('')

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setOauthLoading(false)
    }
  }

  return (
    <AuthShell
      aside={
        <>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Start your taste profile.
          </h1>
          <p className="tb-copy mt-6 max-w-xl text-lg leading-8">
            Tell us the kind of restaurants and tables you&apos;d actually say yes to.
          </p>
        </>
      }
      asideCard={
        <>
          <p className="tb-label text-xs font-medium uppercase tracking-[0.16em]">
            What happens next
          </p>
          <ul className="tb-copy mt-4 space-y-3 text-sm leading-6">
            <li>Set up your taste profile</li>
            <li>Save venues you&apos;d actually attend</li>
            <li>Watch for hosted tables that fit</li>
          </ul>
        </>
      }
      asideTitle="New account"
      title="Sign up"
    >
      <p className="tb-label text-sm font-medium uppercase tracking-[0.2em]">Create account</p>
      <h1 className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">Start your taste profile.</h1>
      <p className="tb-copy mt-3 text-sm leading-6">
        Tell us the kind of restaurants and tables you&apos;d actually say yes to.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSignup}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Name</span>
          <input
            autoComplete="name"
            className="tb-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="Alex"
            required
            type="text"
            value={name}
          />
        </label>

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
            autoComplete="new-password"
            className="tb-input"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            required
            type="password"
            value={password}
          />
        </label>

        <Button className="w-full" disabled={loading || oauthLoading} type="submit">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <Button
        className="mt-4 w-full"
        disabled={loading || oauthLoading}
        onClick={handleGoogleSignup}
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
      {message ? (
        <p className="mt-4 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-3 text-sm text-[color:var(--foreground)]">
          {message}
        </p>
      ) : null}

      <p className="tb-copy mt-6 text-sm">
        Already have an account?{' '}
        <Link className="font-medium text-[color:var(--foreground)] underline" href="/login">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
