'use client'

import { useEffect, useState } from 'react'

import { VenuePhotoCarousel } from '@/components/app/VenuePhotoCarousel'
import type { GooglePlacePhotoResult } from '@/lib/google-places'

type GooglePlacePhotoResponse = {
  photos?: GooglePlacePhotoResult[]
}

export function GooglePlacePhoto({
  alt,
  attributionClassName,
  enableCarousel = true,
  fallbackSrc,
  imageClassName,
  placeId,
}: {
  alt: string
  attributionClassName?: string
  enableCarousel?: boolean
  fallbackSrc: string
  imageClassName: string
  placeId?: string | null
}) {
  const [photoState, setPhotoState] = useState<{
    photos: GooglePlacePhotoResult[]
    placeId: string | null
  }>({
    photos: [],
    placeId: null,
  })
  const normalizedPlaceId = placeId?.trim() || null

  useEffect(() => {
    let active = true

    if (!normalizedPlaceId) {
      return
    }

    const currentPlaceId = normalizedPlaceId

    async function loadPhoto() {
      try {
        const response = await fetch(`/api/restaurant-photo/${encodeURIComponent(currentPlaceId)}`)
        const payload = (await response.json()) as GooglePlacePhotoResponse & {
          error?: string
        }

        if (!active || !response.ok || payload.error) {
          return
        }

        setPhotoState({
          photos: payload.photos ?? [],
          placeId: currentPlaceId,
        })
      } catch {
        if (!active) {
          return
        }
      }
    }

    void loadPhoto()

    return () => {
      active = false
    }
  }, [normalizedPlaceId])

  const resolvedPhotos =
    normalizedPlaceId && photoState.placeId === normalizedPlaceId
      ? photoState.photos
      : []

  return (
    <VenuePhotoCarousel
      alt={alt}
      enableCarousel={enableCarousel}
      fallbackSrc={fallbackSrc}
      imageClassName={imageClassName}
      photos={resolvedPhotos}
      {...(attributionClassName ? { attributionClassName } : {})}
    />
  )
}
