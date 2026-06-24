import type { LivePromotionSurface } from '@/lib/advertising'

const PROMOTION_TRACKING_METRICS = [
  'event_view',
  'impression',
  'rsvp',
  'save',
  'venue_profile_view',
  'website_click',
] as const

const PUBLIC_PROMOTION_TRACKING_METRICS = [
  'event_view',
  'impression',
  'venue_profile_view',
  'website_click',
] as const

type PromotionTrackingMetric = (typeof PROMOTION_TRACKING_METRICS)[number]
type PublicPromotionTrackingMetric = (typeof PUBLIC_PROMOTION_TRACKING_METRICS)[number]
type PromotionTargetType = 'event' | 'restaurant'

type PromotionSourceContext = {
  surface: LivePromotionSurface
  targetId: number
  targetType: PromotionTargetType
}

export type {
  PromotionSourceContext,
  PromotionTargetType,
  PromotionTrackingMetric,
  PublicPromotionTrackingMetric,
}

export function isPromotionTrackingMetric(value: unknown): value is PromotionTrackingMetric {
  return typeof value === 'string' && PROMOTION_TRACKING_METRICS.includes(value as PromotionTrackingMetric)
}

export function isPublicPromotionTrackingMetric(
  value: unknown
): value is PublicPromotionTrackingMetric {
  return (
    typeof value === 'string' &&
    PUBLIC_PROMOTION_TRACKING_METRICS.includes(value as PublicPromotionTrackingMetric)
  )
}

export function isPromotionTargetType(value: unknown): value is PromotionTargetType {
  return value === 'event' || value === 'restaurant'
}

export function isLiveSurfaceCompatibleWithTargetType(
  surface: LivePromotionSurface,
  targetType: PromotionTargetType
) {
  if (targetType === 'event') {
    return surface === 'event_list'
  }

  return (
    surface === 'restaurant_search' ||
    surface === 'restaurant_category' ||
    surface === 'restaurant_neighbourhood'
  )
}

export function isPromotionMetricCompatibleWithTargetType(
  metric: PromotionTrackingMetric,
  targetType: PromotionTargetType
) {
  if (targetType === 'event') {
    return (
      metric === 'impression' ||
      metric === 'event_view' ||
      metric === 'rsvp' ||
      metric === 'website_click'
    )
  }

  return (
    metric === 'impression' ||
    metric === 'venue_profile_view' ||
    metric === 'save' ||
    metric === 'website_click'
  )
}

export function getPromotionAttributionKey(
  metric: PromotionTrackingMetric,
  source: PromotionSourceContext
) {
  return `${metric}:${source.targetType}:${source.targetId}:${source.surface}`
}
