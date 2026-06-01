'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { fetchNotifications, getAppBootstrap, logout } from '@/lib/app/client'
import type { NotificationSummary, Profile } from '@/lib/app/types'

import styles from './about.module.css'

const steps = [
  {
    number: '01',
    icon: '⌕',
    title: 'Discover',
    body: 'Browse restaurants, neighbourhoods, and upcoming tables.',
  },
  {
    number: '02',
    icon: '♙',
    title: 'Join',
    body: 'RSVP to a small table that fits your taste and vibe.',
  },
  {
    number: '03',
    icon: '♧',
    title: 'Meet',
    body: 'Share dinner with people matched around more than just cuisine.',
  },
  {
    number: '04',
    icon: '☆',
    title: 'Feed back',
    body: 'Rate the venue, the group, and whether you would join again.',
  },
] as const

const matchFactors = [
  'Food preferences',
  'Budget',
  'Distance and neighbourhood',
  'Social energy',
  'Kind of night people are after',
] as const

const infoCards = [
  {
    icon: '⌖',
    title: 'Where we are',
    body: 'Tastebuds is launching in NYC only, across all five boroughs. The focus is getting one city right before expanding.',
    skyline: true,
  },
  {
    icon: '$',
    title: 'Is it free?',
    body: 'Yes, Tastebuds is free for diners. Venues and event hosts may pay for sponsored placement in the future, but discovery will remain free.',
    skyline: false,
  },
  {
    icon: '✧',
    title: 'How we choose what to feature',
    body: 'Featured places are shaped by human curation and community signal. Tastebuds does not run pay-to-play reviews.',
    skyline: false,
  },
] as const

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
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroBackdrop} />

          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>About Tastebuds</p>

            <h1>Find the table that fits.</h1>

            <p className={styles.heroText}>
              Tastebuds helps you discover restaurants, join small venue-hosted tables,
              and meet people with similar taste, budget, neighbourhood, and social
              vibe.
            </p>

            <div className={styles.chipRow}>
              <span className={styles.chip}>◍ Taste Match</span>
              <span className={styles.chip}>♙ Small tables</span>
              <span className={styles.chip}>⌂ Venue-hosted</span>
            </div>
          </div>

          <div aria-hidden="true" className={styles.heroPreviewWrap}>
            <div className={styles.heroPhoto} />

            <article className={styles.eventPreview}>
              <div className={styles.previewTop}>
                <div>
                  <p className={styles.previewLabel}>Taste Match</p>
                  <div className={styles.score}>69/100</div>
                  <p className={styles.goodFit}>Good fit</p>
                </div>

                <div className={styles.foodThumb} />
              </div>

              <div className={styles.scoreBar}>
                <span />
              </div>

              <div className={styles.previewDivider} />

              <h2>Middle Eastern Night</h2>
              <p className={styles.previewVenue}>Le Baobab Gouygui · Midtown</p>
              <p className={styles.previewSmall}>Small venue-hosted table</p>

              <div className={styles.previewPills}>
                <span className={styles.joined}>♧ Joined</span>
                <span className={styles.feedback}>▣ Feedback due</span>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How Tastebuds works</h2>

          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <article className={styles.stepCard} key={step.number}>
                {index < steps.length - 1 && <span className={styles.stepLine} />}

                <p className={styles.stepNumber}>{step.number}</p>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.matchGrid}>
          <article className={styles.matchExplainer}>
            <h2>What your Taste Match means</h2>

            <p>
              Taste Match is a guide to how well a table fits your preferences. It is
              not a popularity score, and it is not a judgement on the restaurant.
            </p>

            <ul>
              {matchFactors.map((factor) => (
                <li key={factor}>
                  <span>✓</span>
                  {factor}
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.whyCard}>
            <div className={styles.heartBadge}>♡</div>

            <div className={styles.whyBlock}>
              <h3>Why this fits you</h3>
              <p>
                You match on casual social energy, similar budget, and an interest in
                West African food.
              </p>
            </div>

            <div className={styles.whyBlock}>
              <h3>What to expect</h3>
              <p>
                A small table for six, hosted by the venue, with feedback afterwards.
              </p>
            </div>

            <div className={styles.whyBlockLast}>
              <h3>At a glance</h3>
              <div className={styles.glance}>
                <span>NYC</span>
                <i />
                <span>Table for 6</span>
                <i />
                <span>Good fit</span>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.infoGrid}>
          {infoCards.map((card) => (
            <article className={styles.infoCard} key={card.title}>
              <div className={styles.infoIcon}>{card.icon}</div>

              <div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </div>

              {card.skyline && <div className={styles.skyline} />}
            </article>
          ))}
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Stop scrolling. Join a table.</h2>
            <p>Pick a place, find a group that fits, and let the night happen.</p>

            <div className={styles.ctaActions}>
              <Link className={styles.primaryButton} href="/events">
                Browse events <span>→</span>
              </Link>

              <Link className={styles.secondaryButton} href="/restaurants">
                Browse restaurants
              </Link>
            </div>
          </div>

          <div aria-hidden="true" className={styles.ctaIllustration}>
            <span className={styles.tableLine} />
            <span className={styles.glassOne} />
            <span className={styles.glassTwo} />
            <span className={styles.bottle} />
            <span className={styles.leafOne} />
            <span className={styles.leafTwo} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
