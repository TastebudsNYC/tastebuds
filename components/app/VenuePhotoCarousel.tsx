'use client'

/* eslint-disable @next/next/no-img-element */

import type { MouseEvent, ReactNode } from 'react'
import { useState } from 'react'

import type { GooglePlacePhotoResult } from '@/lib/google-places'

function clampIndex(value: number, count: number) {
  if (count <= 0) {
    return 0
  }

  return ((value % count) + count) % count
}

export function VenuePhotoCarousel({
  alt,
  attributionClassName,
  emptyState,
  enableCarousel = true,
  fallbackSrc,
  imageClassName,
  photos,
}: {
  alt: string
  attributionClassName?: string
  emptyState?: ReactNode
  enableCarousel?: boolean
  fallbackSrc?: string | null
  imageClassName: string
  photos: GooglePlacePhotoResult[]
}) {
  const [rawIndex, setRawIndex] = useState(0)
  const photoCount = photos.length
  const activeIndex = clampIndex(rawIndex, photoCount)
  const activePhoto = photoCount > 0 ? photos[activeIndex] ?? null : null
  const canShowCarousel = enableCarousel && photoCount > 1

  function handleCarouselClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  if (!activePhoto?.photoUri && !fallbackSrc) {
    return <>{emptyState ?? null}</>
  }

  return (
    <div className="relative h-full w-full">
      <img
        alt={alt}
        className={imageClassName}
        src={activePhoto?.photoUri ?? fallbackSrc ?? undefined}
      />
      {activePhoto?.authorName && attributionClassName ? (
        <div className={attributionClassName}>Photo by {activePhoto.authorName}</div>
      ) : null}
      {canShowCarousel ? (
        <>
          <button
            aria-label="Previous venue photo"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
            onClick={(event) => {
              handleCarouselClick(event)
              setRawIndex((current) => current - 1)
            }}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ‹
            </span>
          </button>
          <button
            aria-label="Next venue photo"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/60"
            onClick={(event) => {
              handleCarouselClick(event)
              setRawIndex((current) => current + 1)
            }}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ›
            </span>
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((photo, index) => (
              <button
                aria-label={`Show venue photo ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${index === activeIndex ? 'bg-white' : 'bg-white/45'}`}
                key={`${photo.photoUri}-${index}`}
                onClick={(event) => {
                  handleCarouselClick(event)
                  setRawIndex(index)
                }}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
