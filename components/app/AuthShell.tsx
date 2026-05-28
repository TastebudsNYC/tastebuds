import type { ReactNode } from 'react'

import { Button } from '@/components/app/Button'
import { TastebudsLogo } from '@/components/TastebudsLogo'

export function AuthShell({
  body,
  children,
  aside,
  asideCard,
  asideTitle,
  title,
}: {
  body?: string
  aside?: ReactNode
  asideCard?: ReactNode
  asideTitle?: string
  children: ReactNode
  title?: string
}) {
  return (
    <main className="tb-surface-bg min-h-screen px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col gap-6 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between gap-4 rounded-3xl border border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] px-5 py-4 text-white shadow-[0_18px_42px_rgba(0,20,38,0.18)]">
          <div>
            <TastebudsLogo showTagline size="sm" theme="dark" />
            <p className="mt-1 text-lg font-semibold text-white">
              {title ?? 'Find my night'}
            </p>
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
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {aside ? (
            <section className="hidden rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-8 shadow-[0_18px_44px_rgba(74,31,20,0.07)] lg:flex lg:flex-col lg:justify-between">
              <div>
                {asideTitle ? (
                  <p className="tb-label text-sm font-medium uppercase tracking-[0.24em]">
                    {asideTitle}
                  </p>
                ) : null}
                {aside}
              </div>
              {asideCard ? (
                <div className="mt-8 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-6">
                  {asideCard}
                </div>
              ) : null}
            </section>
          ) : null}
          <section className="tb-panel mx-auto flex w-full max-w-xl flex-col justify-center rounded-3xl px-5 py-8 sm:px-8">
            {body ? <p className="tb-copy text-sm leading-6">{body}</p> : null}
            {children}
          </section>
        </div>
      </div>
    </main>
  )
}
