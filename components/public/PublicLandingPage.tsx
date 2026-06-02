'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { LandingAuthConfirmation } from '@/components/auth/LandingAuthConfirmation'
import type { PublicLandingTableCard } from '@/lib/app/public-landing'
import { usePrefersReducedMotion } from '@/lib/app/use-prefers-reduced-motion'

const heroSlides = [
  {
    alt: 'Friends sharing dinner at a restaurant table',
    imageSrc: '/assets/landing/pexels-cedric-fauntleroy-7221225.jpg',
    slideClass: 'landing-hero-slide-steakhouse',
  },
  {
    alt: 'People toasting drinks over brunch',
    imageSrc: '/assets/landing/pexels-veneka-dziruni-812159966-36861445.jpg',
    slideClass: 'landing-hero-slide-brunch',
  },
  {
    alt: 'Dining room with food and warm ambient lighting',
    imageSrc: '/assets/landing/pexels-isabeu-18556882.jpg',
    slideClass: 'landing-hero-slide-ramen',
  },
]

const steps = [
  {
    id: 'STEP 1',
    title: 'Build your taste profile',
    copy: 'Tell us what you like, what you spend, and the kind of night you want.',
  },
  {
    id: 'STEP 2',
    title: 'See restaurants that fit',
    copy: 'We match places to your taste, budget and vibe.',
  },
  {
    id: 'STEP 3',
    title: 'Join a hosted table',
    copy: 'Claim a seat with people who said yes to the same place.',
  },
]

const matchingInputs = [
  {
    id: 'FOOD',
    title: 'What you actually want to eat',
    copy: 'Cuisines, cravings and places you would genuinely say yes to.',
  },
  {
    id: 'MOOD',
    title: 'The sort of room you want',
    copy: 'Quiet, lively, polished, casual, first-date-safe, big-table energy.',
  },
  {
    id: 'PLAN',
    title: 'Budget, area and timing',
    copy: 'So the table fits your actual evening, not an imaginary perfect one.',
  },
]

const matchRows = [
  { label: 'Cuisine', value: 95 },
  { label: 'Vibe', value: 90 },
  { label: 'Budget', value: 78 },
  { label: 'Setting', value: 82 },
]

export function PublicLandingPage({
  tableCards,
}: {
  tableCards: PublicLandingTableCard[]
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [activeSlide, setActiveSlide] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [matchBarsActive, setMatchBarsActive] = useState(false)
  const matchSectionRef = useRef<HTMLElement | null>(null)
  const hasAnimatedMatchRef = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 4500)

    return () => window.clearInterval(interval)
  }, [prefersReducedMotion])

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-landing-reveal]')
    )

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -48px 0px' }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [prefersReducedMotion])

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const node = matchSectionRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting || hasAnimatedMatchRef.current) {
          return
        }

        hasAnimatedMatchRef.current = true
        setMatchBarsActive(true)
        const start = performance.now()
        const duration = 1400

        const tick = (timestamp: number) => {
          const progress = Math.min((timestamp - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setMatchCount(Math.floor(83 * eased))

          if (progress < 1) {
            window.requestAnimationFrame(tick)
          }
        }

        window.requestAnimationFrame(tick)
        observer.disconnect()
      },
      { threshold: 0.35 }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [prefersReducedMotion])

  const currentMatchCount = prefersReducedMotion ? 83 : matchCount
  const progressBarsActive = prefersReducedMotion || matchBarsActive

  return (
    <main className="landing-page min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <LandingAuthConfirmation />
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="landing-nav flex h-[72px] items-center px-6 lg:h-[108px] lg:px-[72px]">
          <div className="flex w-full items-center justify-between gap-4">
            <Link aria-label="Tastebuds home" href="/">
              <Image
                alt="Tastebuds"
                className="h-auto w-[148px] lg:w-[220px]"
                height={71}
                priority
                src="/assets/tastebuds_logo_dark_header_transparent.png"
                width={220}
              />
            </Link>
            <div className="flex items-center gap-3">
              <Link className="landing-button landing-button-dark" href="/login">
                Log in
              </Link>
              <Link className="landing-button landing-button-primary" href="/signup">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-white px-6 pt-[132px] pb-16 lg:px-[72px] lg:pt-[140px] lg:pb-0 lg:pr-[60px]">
          <div className="landing-reveal is-visible" data-landing-reveal>
            <h1 className="max-w-[620px] text-[46px] leading-[0.92] font-bold tracking-[-0.075em] text-[#111111] sm:text-[62px] lg:text-[78px]">
              Pick a vibe.
              <br />
              Pick a place.
              <br />
              <span className="italic text-[color:var(--accent-landing)]">
                Find a table.
              </span>
            </h1>
            <p className="mt-7 max-w-[520px] text-[1rem] leading-[1.55] text-[color:var(--landing-secondary)] md:text-[1.125rem]">
              Choose the kind of night you want. Tastebuds finds the restaurants
              {' '}
              &mdash; and the people &mdash;
              {' '}
              to match.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="landing-button landing-button-primary" href="/signup">
                Get started
              </Link>
              <Link className="landing-button landing-button-secondary" href="/login">
                Log in
              </Link>
            </div>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-[color:var(--nav-bg)] pt-[72px] lg:pt-[108px]">
          <div className="landing-hero-fallback absolute inset-0" />
          {heroSlides.map((slide, index) => (
            <div
              aria-hidden="true"
              className={[
                'landing-hero-slide absolute inset-0',
                slide.slideClass,
                index === activeSlide || (prefersReducedMotion && index === 0)
                  ? 'is-active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={slide.imageSrc}
            >
              <Image
                alt={slide.alt}
                className="h-full w-full object-cover"
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                src={slide.imageSrc}
              />
            </div>
          ))}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/25"
          />
        </div>
      </section>

      <section className="bg-[color:var(--nav-bg)] text-white" id="how">
        <div className="mx-auto max-w-[1280px] px-6 py-[88px] lg:px-12">
          <div className="mb-14 landing-reveal" data-landing-reveal>
            <h2 className="landing-section-title max-w-[820px] font-bold">
              Pick your taste. Pick a table. Turn up.
            </h2>
            <p className="mt-5 max-w-[420px] text-[1rem] leading-[1.55] text-white/55 md:text-[1.125rem]">
              Three steps, no group-chat faff.
            </p>
          </div>

          <div className="border-t border-white/10">
            {steps.map((step, index) => (
              <div
                className="landing-reveal grid grid-cols-1 gap-5 border-b border-white/10 py-10 md:grid-cols-[120px_minmax(0,1fr)] md:gap-12"
                data-landing-reveal
                key={step.id}
                style={
                          {
                            transitionDelay: prefersReducedMotion
                              ? '0ms'
                              : `${index * 90}ms`,
                          } as CSSProperties
                        }
                      >
                <div className="text-sm font-bold text-[color:var(--accent-landing)]">
                  {step.id}
                </div>
                <div className="max-w-[640px]">
                  <h3 className="text-[30px] leading-[1.02] font-bold tracking-tight md:text-[42px]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.6] text-white/58">
                    {step.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[color:var(--background)]">
        <div className="mx-auto max-w-[1280px] px-6 py-[88px] lg:px-12">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="landing-reveal lg:sticky lg:top-24" data-landing-reveal>
              <h2 className="landing-section-title max-w-[700px] font-bold text-[#111111]">
                Tell us what kind of night you want.
              </h2>
              <p className="mt-5 max-w-[560px] text-[1rem] leading-[1.55] text-[color:var(--landing-secondary)] md:text-[1.125rem]">
                Tastebuds uses the stuff that actually changes a dinner plan:
                food, budget, area, timing and mood.
              </p>
            </div>

            <div className="border-t border-[color:var(--landing-border)]">
              {matchingInputs.map((item) => (
                <div
                  className="landing-reveal grid grid-cols-[90px_1fr] gap-6 border-b border-[color:var(--landing-border)] py-8 md:gap-8"
                  data-landing-reveal
                  key={item.id}
                >
                  <div className="text-sm font-bold text-[color:var(--accent-landing)]">
                    {item.id}
                  </div>
                  <div>
                    <h3 className="text-[28px] leading-[1.05] font-bold tracking-tight text-[#111111] md:text-[34px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[620px] text-[16px] leading-[1.6] text-[color:var(--landing-secondary)]">
                      {item.copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--nav-bg)] text-white" id="events">
        <div className="mx-auto max-w-[1280px] px-6 py-[88px] lg:px-12">
          <div className="mb-12 flex flex-col gap-5 landing-reveal lg:flex-row lg:items-end lg:justify-between" data-landing-reveal>
            <h2 className="landing-section-title max-w-[760px] font-bold">
              Open tables near you
            </h2>
            <p className="max-w-[360px] text-[1rem] leading-[1.55] text-white/55 lg:text-right md:text-[1.125rem]">
              See what&apos;s open, what fits, and who&apos;s in.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {tableCards.map((card, index) => (
              <article
                className="landing-reveal landing-event-card overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/5 backdrop-blur-sm"
                data-landing-reveal
                key={card.title}
                style={
                  {
                    transitionDelay: prefersReducedMotion ? '0ms' : `${index * 90}ms`,
                  } as CSSProperties
                }
              >
                <div
                  className={`relative flex h-[156px] items-center justify-center border-b border-white/10 text-[42px] ${card.visualClass}`}
                >
                  <span aria-hidden="true">{card.emoji}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-[20px] font-bold tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[14px] text-white/50">{card.meta}</p>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="mb-2 text-[15px] leading-[1.35] font-semibold text-[color:var(--accent-landing)]">
                      {card.tagline}
                    </p>
                    <div className="text-[13px] text-white/45">{card.status}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="bg-[color:var(--background)]"
        id="matching"
        ref={matchSectionRef}
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-16 px-6 py-[88px] lg:grid-cols-2 lg:px-12">
          <div className="landing-reveal" data-landing-reveal>
            <div className="overflow-hidden rounded-[1.25rem] border border-[color:var(--landing-border)] bg-white shadow-[0_14px_32px_rgba(17,17,17,0.08)]">
              <div className="flex items-center justify-between bg-[color:var(--nav-bg)] px-5 py-5 lg:px-6">
                <div>
                  <h3 className="text-[17px] font-bold tracking-tight text-white">
                    Banter NYC
                  </h3>
                  <p className="mt-0.5 text-[12px] text-white/45">
                    Lower East Side · 1.2 miles away
                  </p>
                </div>
                <div className="rounded-lg bg-[color:var(--landing-match-bg)] px-4 py-1.5 text-center">
                  <div className="text-[26px] leading-[1.1] font-bold text-[#111111]">
                    {currentMatchCount}
                  </div>
                  <div className="text-[11px] text-[color:var(--landing-muted)]">
                    match
                  </div>
                </div>
              </div>
              <div className="space-y-3.5 px-5 py-5 lg:px-6">
                {matchRows.map((row) => (
                  <div className="flex items-center gap-3" key={row.label}>
                    <span className="w-[110px] shrink-0 text-[13px] text-[color:var(--landing-secondary)]">
                      {row.label}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--landing-tag-bg)]">
                      <div
                        className={[
                          'h-full bg-[color:var(--accent-landing)]',
                          progressBarsActive ? 'landing-progress-bar' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        style={
                          {
                            width: prefersReducedMotion ? `${row.value}%` : '0%',
                            '--landing-progress': `${row.value}%`,
                          } as CSSProperties
                        }
                      />
                    </div>
                    <span className="w-[34px] text-right text-[12px] text-[color:var(--landing-muted)]">
                      {row.value}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="landing-reveal" data-landing-reveal>
            <h2 className="landing-section-title max-w-[640px] font-bold text-[#111111]">
              Not just stars. Fit.
            </h2>
            <p className="mt-5 max-w-[520px] text-[1rem] leading-[1.55] text-[color:var(--landing-secondary)] md:text-[1.125rem]">
              Tastebuds scores each place by taste, vibe, budget and setting
              {' '}
              so you know why it works.
            </p>
            <Link className="landing-button landing-button-primary mt-7 inline-flex" href="/signup">
              Start matching
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--nav-bg)] text-center" id="join">
        <div className="px-6 py-[88px] lg:px-[72px]">
          <div className="mx-auto max-w-4xl landing-reveal" data-landing-reveal>
            <h2 className="text-[44px] leading-[0.95] font-bold tracking-[-0.075em] text-white sm:text-[64px] lg:text-[86px]">
              Ready to find
              {' '}
              <span className="italic text-[color:var(--accent-landing)]">
                your table?
              </span>
            </h2>
            <p className="mx-auto mt-6 mb-9 max-w-[560px] text-[1rem] leading-[1.55] text-white/55 md:text-[1.125rem]">
              Build your taste profile and see restaurants &mdash; and tables
              &mdash; worth saying yes to.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link className="landing-button landing-button-primary" href="/signup">
                Get started
              </Link>
              <Link className="landing-button landing-button-dark" href="/login">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-[#0e0e15] px-6 py-8 lg:px-[72px]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 md:flex-row">
          <Image
            alt="Tastebuds"
            className="h-[26px] w-auto opacity-40"
            height={26}
            src="/assets/tastebuds_logo_dark_header_transparent.png"
            width={80}
          />
          <div className="flex flex-wrap gap-6 text-[13px] text-white/30">
            <a className="transition-colors hover:text-white/60" href="#how">
              How it works
            </a>
            <a className="transition-colors hover:text-white/60" href="#events">
              Tables
            </a>
            <a className="transition-colors hover:text-white/60" href="#matching">
              Match score
            </a>
            <Link className="transition-colors hover:text-white/60" href="/signup">
              For venues
            </Link>
          </div>
          <p className="text-[12px] text-white/20">© 2026 Tastebuds</p>
        </div>
      </footer>
    </main>
  )
}
