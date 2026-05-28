'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'

function getInitials(displayName: string) {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || '?'
}

export function ProfileAvatar({
  className = 'h-10 w-10',
  displayName,
  fallbackClassName = 'bg-[color:var(--status-bg)] text-[color:var(--status-text)]',
  photoUrl,
  textClassName = 'text-sm font-semibold',
}: {
  className?: string
  displayName: string
  fallbackClassName?: string
  photoUrl?: string | null
  textClassName?: string
}) {
  const normalizedPhotoUrl = photoUrl?.trim() || ''
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null)

  if (normalizedPhotoUrl && failedPhotoUrl !== normalizedPhotoUrl) {
    return (
      <img
        alt={`${displayName} profile photo`}
        className={`shrink-0 rounded-full object-cover ${className}`}
        onError={() => setFailedPhotoUrl(normalizedPhotoUrl)}
        src={normalizedPhotoUrl}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${className} ${fallbackClassName} ${textClassName}`}
    >
      {getInitials(displayName)}
    </div>
  )
}
