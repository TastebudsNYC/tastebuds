import Link from 'next/link'

import { cx } from '@/lib/app/format'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    label: 'Home',
  },
  {
    href: '/restaurants',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M8 4v7m4-7v7M6 4h6v7a3 3 0 1 1-6 0V4Zm10 0v17m0-17c2 1.5 3 3.3 3 5.5S18 13 16 14.5V21"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    label: 'Restaurants',
  },
  {
    href: '/events',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M16 3v4M8 3v4m-3 4h14M5 6h14a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    label: 'Events',
  },
  {
    href: '/about',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 10.5h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M10.75 14.25h1.25V10.5h1v3.75H14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    label: 'About',
  },
  {
    href: '/notifications',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M15 17H5.5a1 1 0 0 1-.8-1.6L6 13.7V10a6 6 0 1 1 12 0v3.7l1.3 1.7A1 1 0 0 1 18.5 17H15Zm0 0a3 3 0 0 1-6 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    label: 'Inbox',
  },
  {
    href: '/profile',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
    label: 'Profile',
  },
] as const

export function BottomNav({
  currentPath,
  unreadCount = 0,
}: {
  currentPath: string
  unreadCount?: number
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--border-soft)] bg-white/95 px-3 py-3 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href
          const showUnreadBadge = item.href === '/notifications' && unreadCount > 0

          return (
            <Link
              className={cx(
                'min-w-0 flex-1 rounded-2xl px-2 py-2 text-center text-[11px] font-medium transition',
                isActive
                  ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                  : 'text-[color:var(--text-muted)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--foreground)]'
              )}
              href={item.href}
              key={item.href}
            >
              <span className="relative flex flex-col items-center gap-1">
                {item.icon}
                {showUnreadBadge ? (
                  <span className="absolute right-3 top-0.5 h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                ) : null}
                <span>{item.label}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
