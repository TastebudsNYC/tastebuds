import type { ReactNode } from 'react'

import { cx } from '@/lib/app/format'
import type { Profile } from '@/lib/app/types'

import { BottomNav } from '@/components/app/BottomNav'
import { SiteFooter } from '@/components/app/SiteFooter'
import { TopNav } from '@/components/app/TopNav'

export function AppShell({
  children,
  currentPath,
  onLogout,
  profile,
  showFooter = false,
  unreadCount = 0,
  wide = false,
}: {
  children: ReactNode
  currentPath: string
  onLogout?: () => void
  profile?: Profile | null
  showFooter?: boolean
  unreadCount?: number
  wide?: boolean
}) {
  const topNavProps = {
    currentPath,
    ...(onLogout ? { onLogout } : {}),
    ...(profile !== undefined ? { profile } : {}),
    ...(unreadCount !== undefined ? { unreadCount } : {}),
    ...(wide ? { wide } : {}),
  }

  return (
    <main className="tb-surface-bg min-h-screen text-[color:var(--foreground)]">
      <TopNav {...topNavProps} />
      <div
        className={cx(
          'mx-auto w-full py-10 pb-28 lg:py-14',
          wide ? 'px-[clamp(1.5rem,4vw,4rem)]' : 'max-w-7xl px-6 lg:px-8'
        )}
      >
        <div className={cx('tb-page-enter space-y-10 pb-6 sm:space-y-12 lg:pb-10')}>
          {children}
        </div>
      </div>
      {showFooter ? <SiteFooter /> : null}
      <BottomNav currentPath={currentPath} unreadCount={unreadCount} />
    </main>
  )
}
