'use client'

import { useEffect, useRef } from 'react'
import type { MutableRefObject, ReactNode } from 'react'

import type { PromotionSourceContext } from '@/lib/advertising-attribution'
import { getPromotionAttributionKey } from '@/lib/advertising-attribution'
import { trackPromotionMetric } from '@/lib/advertising-attribution-client'

export function PromotionImpressionObserver({
  children,
  onTrack,
  seenKeysRef,
  source,
}: {
  children: ReactNode
  onTrack?: (source: PromotionSourceContext) => void | Promise<void>
  seenKeysRef: MutableRefObject<Set<string>>
  source: PromotionSourceContext | null
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = containerRef.current

    if (!node || !source) {
      return
    }

    const key = getPromotionAttributionKey('impression', source)

    if (seenKeysRef.current.has(key)) {
      return
    }

    let visibleTimeout: number | null = null

    const clearVisibleTimeout = () => {
      if (visibleTimeout !== null) {
        window.clearTimeout(visibleTimeout)
        visibleTimeout = null
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (!entry) {
          return
        }

        const isEligible =
          entry.isIntersecting && entry.intersectionRatio >= 0.5

        if (!isEligible) {
          clearVisibleTimeout()
          return
        }

        if (visibleTimeout !== null || seenKeysRef.current.has(key)) {
          return
        }

        visibleTimeout = window.setTimeout(() => {
          if (seenKeysRef.current.has(key)) {
            return
          }

          seenKeysRef.current.add(key)

          if (onTrack) {
            void onTrack(source)
            return
          }

          void trackPromotionMetric('impression', source)
        }, 750)
      },
      {
        threshold: [0, 0.5, 1],
      }
    )

    observer.observe(node)

    return () => {
      clearVisibleTimeout()
      observer.disconnect()
    }
  }, [onTrack, seenKeysRef, source])

  return <div ref={containerRef}>{children}</div>
}
