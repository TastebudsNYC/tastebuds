'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { Button } from '@/components/app/Button'
import { PageHeader } from '@/components/app/PageHeader'
import { TasteTag } from '@/components/app/TasteTag'
import { fetchNotifications, getAppBootstrap, logout } from '@/lib/app/client'
import { describeMatchStrength } from '@/lib/app/format'
import type { NotificationSummary, Profile } from '@/lib/app/types'

function AboutSection({
  children,
  heading,
}: {
  children: ReactNode
  heading: string
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-[1.45rem] font-semibold tracking-tight text-[color:var(--foreground)] sm:text-[1.7rem]">
        {heading}
      </h2>
      {children}
    </section>
  )
}

function SoftCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`tb-panel-soft rounded-[1.75rem] p-6 ${className}`}>{children}</div>
}

function QuietCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`tb-panel-quiet p-5 ${className}`}>{children}</div>
}

function SectionLead({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-3xl text-sm leading-7 text-[color:var(--text-secondary)] sm:text-base">
      {children}
    </p>
  )
}

function AboutBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
      NYC launch
    </span>
  )
}

function HowItWorksCard({
  body,
  heading,
  step,
}: {
  body: string
  heading: string
  step: string
}) {
  return (
    <SoftCard>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
        {step}
      </p>
      <h3 className="mt-3 text-xl font-semibold text-[color:var(--foreground)]">{heading}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">{body}</p>
    </SoftCard>
  )
}

function MockTasteMatchCard() {
  const mockScore = 69

  return (
    <div className="tb-panel overflow-hidden rounded-[1.85rem]">
      <div className="border-b border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,246,233,0.92)_0%,rgba(255,255,255,1)_100%)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="inline-flex min-w-[11rem] flex-col rounded-[1.15rem] border border-[color:var(--accent-border)] bg-[linear-gradient(180deg,var(--accent-softer)_0%,var(--accent-soft)_100%)] px-4 py-4 text-[color:var(--accent-strong)] shadow-[0_10px_24px_rgba(245,158,11,0.16)]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Taste Match</span>
            <span className="mt-2 text-4xl font-semibold leading-none">{mockScore}/100</span>
            <span className="mt-1 text-sm font-semibold">{describeMatchStrength(mockScore)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-strong)]">
              Joined
            </span>
            <span className="rounded-full bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-secondary)]">
              Feedback due
            </span>
          </div>
        </div>
        <h3 className="mt-5 text-[1.9rem] font-semibold tracking-tight text-[color:var(--foreground)]">
          Sample table
        </h3>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          Illustrative only. This is the shape of the table detail, not a live event.
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-2">
        {[
          ['Why this fits you', 'Shared cuisine preferences, budget range, social pace, and distance all push the fit upward.'],
          ['What to expect', 'A small venue-hosted dinner with enough context to tell whether the night is relaxed, lively, or somewhere in between.'],
          ['At a glance', 'Time, table size, status, and venue details are surfaced early so you can decide quickly.'],
          ['Attendee preview', 'You get a read on who is joining without turning the page into a social feed.'],
        ].map(([heading, body]) => (
          <QuietCard key={heading}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              {heading}
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--foreground)]">{body}</p>
          </QuietCard>
        ))}
      </div>
    </div>
  )
}

export default function AboutPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadPage() {
      try {
        const bootstrap = await getAppBootstrap()
        const notificationResponse = await fetchNotifications(bootstrap.userId)

        if (!active) {
          return
        }

        if (notificationResponse.error) {
          throw new Error(notificationResponse.error.message)
        }

        setProfile(bootstrap.profile)
        setNotifications(notificationResponse.data ?? [])
        setLoading(false)
      } catch {
        if (active) {
          router.replace('/login')
        }
      }
    }

    void loadPage()

    return () => {
      active = false
    }
  }, [router])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  )

  if (loading) {
    return <AppPageSkeleton currentPath="/about" title="About Tastebuds" variant="detail" />
  }

  return (
    <AppShell currentPath="/about" onLogout={handleLogout} profile={profile} unreadCount={unreadCount}>
      <PageHeader
        action={<AboutBadge />}
        description="Tastebuds helps people find places to eat, join small tables, and meet others with similar taste and vibe."
        title="About Tastebuds"
      />

      <div className="space-y-10">
        <SoftCard className="bg-[linear-gradient(180deg,rgba(255,246,233,0.42)_0%,rgba(255,255,255,1)_100%)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
            Find the table that fits
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.8fr)] lg:items-end">
            <SectionLead>
              Tastebuds is built around small, venue-hosted tables. You can discover restaurants, join events, and be matched with people based on food preferences, social style, budget, neighbourhood, and vibe.
            </SectionLead>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <TasteTag>Taste match</TasteTag>
              <TasteTag>Small tables</TasteTag>
              <TasteTag>Venue-hosted</TasteTag>
            </div>
          </div>
        </SoftCard>

        <AboutSection heading="How it works">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HowItWorksCard
              body="Browse restaurants, neighbourhoods, and upcoming tables. Each event gives you the venue, time, distance, tags, and what to expect."
              heading="Discover places and events"
              step="01"
            />
            <HowItWorksCard
              body="When you RSVP, Tastebuds shows why the table fits you and whether the group is still forming, joined, ended, or ready for feedback."
              heading="Join a table"
              step="02"
            />
            <HowItWorksCard
              body="Your match is based on more than cuisine. We look at budget, social energy, location, preferences, and the kind of night people are after."
              heading="Meet people with similar taste"
              step="03"
            />
            <HowItWorksCard
              body="After the event, you can rate the venue, the group, and whether you would join again. This helps improve future matches."
              heading="Give feedback after dinner"
              step="04"
            />
          </div>
        </AboutSection>

        <AboutSection heading="What your Taste Match means">
          <SectionLead>
            The Taste Match score is a guide to how well a table fits your preferences. It is not a popularity score and it is not a judgement on the restaurant.
          </SectionLead>
          <MockTasteMatchCard />
        </AboutSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <SoftCard>
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-[color:var(--foreground)]">
              Where we are
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
              Tastebuds is launching in NYC only, across all five boroughs. The focus is getting one city right before expanding.
            </p>
          </SoftCard>

          <SoftCard>
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-[color:var(--foreground)]">
              Is it free?
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
              Yes, Tastebuds is free for diners. Venues and event hosts may pay for sponsored placement in the future, but discovery will remain free.
            </p>
          </SoftCard>

          <SoftCard>
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-[color:var(--foreground)]">
              How we choose what to feature
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
              Featured places are shaped by human curation and community signal. Tastebuds does not run pay-to-play reviews.
            </p>
          </SoftCard>

          <SoftCard className="bg-[linear-gradient(180deg,rgba(255,246,233,0.4)_0%,rgba(255,255,255,1)_100%)]">
            <h2 className="text-[1.35rem] font-semibold tracking-tight text-[color:var(--foreground)]">
              The point
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">
              Tastebuds is for finding a good table, not endlessly scrolling restaurant lists. Pick a place, join the right group, and let the night happen.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/events">Browse events</Button>
              <Button href="/restaurants" variant="secondary">
                Browse restaurants
              </Button>
            </div>
          </SoftCard>
        </div>
      </div>
    </AppShell>
  )
}
