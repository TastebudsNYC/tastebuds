'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { AppPageSkeleton } from '@/components/app/LoadingSkeleton'
import { Button } from '@/components/app/Button'
import { EmptyState } from '@/components/app/EmptyState'
import { NotificationCard } from '@/components/app/NotificationCard'
import { PageHeader } from '@/components/app/PageHeader'
import { useToast } from '@/components/app/ToastProvider'
import {
  clearReadNotifications,
  dismissNotification,
  fetchNotifications,
  getAppBootstrap,
  logout,
  markNotificationsRead,
} from '@/lib/app/client'
import { formatUnreadUpdateCount } from '@/lib/app/format'
import type { NotificationSummary, Profile } from '@/lib/app/types'

function getNotificationAction(notification: NotificationSummary) {
  switch (notification.type) {
    case 'event_signup':
      return { href: '/events', label: 'View booking' }
    case 'event_reminder_24h':
    case 'event_reminder_2h':
    case 'event_day_confirmation':
      return { href: '/events', label: 'Open details' }
    case 'event_update':
    case 'event_at_risk':
    case 'event_follow_up':
    case 'event_attendance':
      return { href: '/events', label: 'View event' }
    case 'restaurant_removed':
      return { href: '/restaurants', label: 'View venue' }
    default:
      return null
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { pushToast } = useToast()
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(true)
  const [notificationActionLoading, setNotificationActionLoading] = useState(false)
  const [clearReadLoading, setClearReadLoading] = useState(false)
  const [notificationDeletingId, setNotificationDeletingId] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    async function loadPage() {
      const bootstrap = await getAppBootstrap()

      if (!active) {
        return
      }

      const response = await fetchNotifications(bootstrap.userId)

      if (!active) {
        return
      }

      if (response.error) {
        setError(response.error.message)
        setLoading(false)
        return
      }

      setNotifications(response.data ?? [])
      setProfile(bootstrap.profile)
      setLoading(false)
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

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id)

    setError('')
    setNotificationActionLoading(true)

    try {
      await markNotificationsRead(unreadIds)
      const readAt = new Date().toISOString()
      setNotifications((current) =>
        current.map((notification) =>
          unreadIds.includes(notification.id)
            ? { ...notification, read_at: readAt }
            : notification
        )
      )
      pushToast({
        description: 'Unread inbox items were marked as read.',
        title: 'Inbox updated.',
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not mark notifications read.')
    } finally {
      setNotificationActionLoading(false)
    }
  }

  async function handleDismiss(notificationId: number) {
    setError('')
    setNotificationDeletingId(notificationId)

    try {
      await dismissNotification(notificationId)
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId)
      )
      pushToast({
        description: 'The inbox item has been removed.',
        title: 'Update dismissed.',
        tone: 'surface',
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not dismiss notification.')
    } finally {
      setNotificationDeletingId(null)
    }
  }

  async function handleClearRead() {
    const readIds = notifications.filter((item) => item.read_at).map((item) => item.id)

    setError('')
    setClearReadLoading(true)

    try {
      await clearReadNotifications(readIds)
      setNotifications((current) =>
        current.filter((notification) => !readIds.includes(notification.id))
      )
      pushToast({
        description: 'Read inbox items were cleared.',
        title: 'Inbox updated.',
        tone: 'surface',
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not clear read notifications.')
    } finally {
      setClearReadLoading(false)
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read_at).length
  const readCount = notifications.length - unreadCount
  const visibleNotifications = useMemo(
    () =>
      showUnreadOnly
        ? notifications.filter((notification) => !notification.read_at)
        : notifications,
    [notifications, showUnreadOnly]
  )

  if (loading) {
    return <AppPageSkeleton currentPath="/notifications" title="Notifications" variant="list" />
  }

  return (
    <AppShell
      currentPath="/notifications"
      onLogout={handleLogout}
      profile={profile}
      unreadCount={unreadCount}
      wide
    >
      <PageHeader
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => setShowUnreadOnly(true)}
              size="sm"
              variant={showUnreadOnly ? 'primary' : 'secondary'}
            >
              Unread
            </Button>
            <Button
              onClick={() => setShowUnreadOnly(false)}
              size="sm"
              variant={showUnreadOnly ? 'secondary' : 'primary'}
            >
              All
            </Button>
          </div>
        }
        description="Reminders, updates and day-of prompts for your plans."
        eyebrow="Inbox"
        title="Your dinner inbox"
      />

      {error ? (
        <div className="rounded-[1.5rem] border border-[color:var(--accent-border)] bg-[color:var(--accent-softer)] p-4 text-sm text-[color:var(--accent-strong)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-5 shadow-[0_18px_44px_rgba(74,31,20,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
              {showUnreadOnly ? 'Unread' : 'All updates'}
            </p>
            <p className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
              {formatUnreadUpdateCount(unreadCount)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {unreadCount > 0 ? (
              <Button
                disabled={notificationActionLoading}
                onClick={() => void handleMarkAllRead()}
                variant="secondary"
              >
                {notificationActionLoading ? 'Marking...' : 'Mark all read'}
              </Button>
            ) : null}
            {readCount > 0 ? (
              <Button
                disabled={clearReadLoading}
                onClick={() => void handleClearRead()}
                variant="secondary"
              >
                {clearReadLoading ? 'Clearing...' : 'Clear read'}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        {visibleNotifications.length > 0 ? (
          visibleNotifications.map((notification) => (
            <NotificationCard
              {...(getNotificationAction(notification) ?? {})}
              deleting={notificationDeletingId === notification.id}
              key={notification.id}
              notification={notification}
              onDismiss={() => void handleDismiss(notification.id)}
            />
          ))
        ) : (
          <EmptyState
            description={
              showUnreadOnly
                ? "You're up to date. When a table opens, changes, or needs a reply, it'll land here."
                : notifications.length > 0
                  ? 'Your reminders and table updates will appear here once new activity comes in.'
                  : 'Your reminders and table updates will appear here.'
            }
            title={showUnreadOnly ? 'Nothing to review' : 'No updates yet'}
          />
        )}
      </div>
    </AppShell>
  )
}
