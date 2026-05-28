'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppShell } from '@/components/app/AppShell'
import { ProfileEditor } from '@/components/app/ProfileEditor'
import { getAppBootstrap, logout } from '@/lib/app/client'
import type { Profile } from '@/lib/app/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let active = true

    async function loadPage() {
      try {
        const bootstrap = await getAppBootstrap()

        if (active) {
          setProfile(bootstrap.profile)
        }
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

  return (
    <AppShell currentPath="/profile" onLogout={handleLogout} profile={profile} wide>
      <ProfileEditor
        backHref="/dashboard"
        backLabel="Back to home"
        description="Shape the restaurants and tables that rise to the top for you."
        embedded
        eyebrow="Profile"
        redirectTo="/profile"
        title="Your taste profile"
      />
    </AppShell>
  )
}
