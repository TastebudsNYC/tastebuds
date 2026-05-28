'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AnimatedNumber } from '@/components/app/AnimatedNumber'
import { ProfileAvatar } from '@/components/app/ProfileAvatar'
import { TastebudsLogo } from '@/components/TastebudsLogo'
import {
  cx,
  formatLiveTableCount,
  formatWatchingVenueCount,
} from '@/lib/app/format'
import type { Profile } from '@/lib/app/types'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/events', label: 'Events' },
  { href: '/notifications', label: 'Inbox' },
  { href: '/profile', label: 'Profile' },
] as const

function getDisplayName(profile: Profile | null | undefined) {
  const displayName = profile?.display_name?.trim()
  return displayName?.length ? displayName : 'Profile'
}

function getShortName(profile: Profile | null | undefined) {
  return getDisplayName(profile).split(/\s+/)[0] ?? 'Profile'
}

function getStatusLabel({
  liveTableCount,
  savedVenueCount,
}: {
  liveTableCount: number | undefined
  savedVenueCount: number | undefined
}) {
  if ((liveTableCount ?? 0) > 0) {
    return formatLiveTableCount(liveTableCount ?? 0)
  }

  if ((savedVenueCount ?? 0) > 0) {
    return formatWatchingVenueCount(savedVenueCount ?? 0)
  }

  return null
}

function getStatusCount(statusLabel: string | null) {
  if (!statusLabel) {
    return null
  }

  const [countText, ...rest] = statusLabel.split(' ')
  const count = Number(countText)

  if (Number.isNaN(count) || rest.length === 0) {
    return null
  }

  return {
    count,
    suffix: rest.join(' '),
  }
}

export function TopNav({
  currentPath,
  liveTableCount,
  onLogout,
  profile,
  savedVenueCount,
  unreadCount = 0,
  wide = false,
}: {
  currentPath: string
  liveTableCount?: number
  onLogout?: () => void
  profile?: Profile | null
  savedVenueCount?: number
  unreadCount?: number
  wide?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const statusLabel = useMemo(
    () => getStatusLabel({ liveTableCount, savedVenueCount }),
    [liveTableCount, savedVenueCount]
  )
  const statusParts = useMemo(() => getStatusCount(statusLabel), [statusLabel])
  const displayName = getDisplayName(profile)
  const shortName = getShortName(profile)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/8 bg-[color:var(--nav-bg)] text-white shadow-[0_10px_24px_rgba(0,20,38,0.18)]">
      <div
        className={cx(
          'mx-auto flex h-[5rem] w-full items-center justify-between gap-4',
          wide ? 'px-[clamp(1.5rem,4vw,4rem)]' : 'max-w-7xl px-6 lg:px-8'
        )}
      >
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link
            aria-label="Tastebuds home"
            className="group inline-flex min-w-0 items-center rounded-full px-1 py-1 text-white transition hover:text-white"
            href="/dashboard"
          >
            <TastebudsLogo
              className="transition duration-150 group-hover:translate-x-[1px]"
              size="sm"
              theme="dark"
            />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.href
              const showUnreadBadge = item.href === '/notifications' && unreadCount > 0

              return (
                <Link
                  className={cx(
                    'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold tracking-tight transition-colors duration-150',
                    isActive
                      ? 'bg-white/6 text-[color:var(--accent)]'
                      : 'text-[#d8e2ec] hover:bg-white/6 hover:text-white'
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <span>{item.label}</span>
                  {showUnreadBadge ? (
                    <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                  ) : null}
                  <span
                    className={cx(
                      'pointer-events-none absolute inset-x-3 -bottom-px h-px origin-center rounded-full bg-[color:var(--accent)] transition duration-150',
                      isActive ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0'
                    )}
                  />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {statusLabel ? (
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[#d8e2ec] lg:inline-flex">
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
              <span>
                {statusParts ? (
                  <>
                    <AnimatedNumber value={statusParts.count} /> {statusParts.suffix}
                  </>
                ) : (
                  statusLabel
                )}
              </span>
            </div>
          ) : null}

          {onLogout ? (
            <div className="relative" ref={menuRef}>
              <button
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="tb-pressable inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-white transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/60"
                onClick={() => setMenuOpen((current) => !current)}
                type="button"
              >
                <ProfileAvatar
                  className="h-8 w-8"
                  displayName={displayName}
                  fallbackClassName="bg-[color:var(--accent)] text-[color:var(--accent-text)]"
                  textClassName="text-xs font-bold"
                  {...(profile?.profile_photo_url !== undefined
                    ? { photoUrl: profile.profile_photo_url }
                    : {})}
                />
                <span className="hidden max-w-28 truncate text-sm font-semibold text-[#f5f7fb] sm:block">
                  {shortName}
                </span>
                <svg
                  aria-hidden="true"
                  className={cx('h-4 w-4 text-[#d8e2ec] transition', menuOpen ? 'rotate-180' : '')}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  className="absolute right-0 top-[calc(100%+0.6rem)] w-52 overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-1.5 text-[color:var(--foreground)] shadow-[0_18px_44px_rgba(0,20,38,0.22)]"
                  role="menu"
                >
                  <Link
                    className="flex items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-soft)]"
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-soft)] text-[color:var(--nav-bg)]">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </span>
                    <span>Profile</span>
                  </Link>
                  <button
                    className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-soft)]"
                    onClick={() => {
                      setMenuOpen(false)
                      onLogout?.()
                    }}
                    role="menuitem"
                    type="button"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--surface-soft)] text-[color:var(--nav-bg)]">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M15 17l5-5-5-5M20 12H9"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M11 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </span>
                    <span>Log out</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
