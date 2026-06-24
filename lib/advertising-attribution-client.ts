'use client'

import type {
  PromotionSourceContext,
  PromotionTrackingMetric,
} from '@/lib/advertising-attribution'
import { getAccessToken } from '@/lib/app/client'

export async function trackPromotionMetric(
  metric: PromotionTrackingMetric,
  source: PromotionSourceContext,
  options?: {
    keepalive?: boolean
  }
) {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return
    }

    await fetch('/api/advertising/track', {
      body: JSON.stringify({
        metric,
        surface: source.surface,
        targetId: source.targetId,
        targetType: source.targetType,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      keepalive: options?.keepalive ?? false,
      method: 'POST',
    })
  } catch (error) {
    console.error('Failed to send promotion tracking event.', error)
  }
}
