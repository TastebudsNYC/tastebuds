import type { LivePromotionSurface, PromotionSurface } from '@/lib/advertising'
import type { PromotionSourceContext } from '@/lib/advertising-attribution'
import {
  compareEntitiesWithPromotion,
  getWinningPromotionForSurfaces,
  getPromotionDisclosureForSurfaces,
} from '@/lib/advertising-ordering'
import type {
  PromotionDisclosure,
  PromotionDisclosureBySurface,
  PromotionPriorityBySurface,
} from '@/lib/advertising-ordering'

type PromotableEntity = {
  id: number
  promotionDisclosures?: PromotionDisclosureBySurface | null
  promotionPriorities?: PromotionPriorityBySurface | null
}

type IdentifiedEntity = {
  id: number
}

export function getRestaurantDiscoverySurfaces(input: {
  query: string
  selectedArea: string
  selectedCuisine: string
}): readonly PromotionSurface[] {
  const surfaces: PromotionSurface[] = []

  if (input.query.length > 0) {
    surfaces.push('restaurant_search')
  }

  if (input.selectedCuisine !== 'all') {
    surfaces.push('restaurant_category')
  }

  if (input.selectedArea !== 'all') {
    surfaces.push('restaurant_neighbourhood')
  }

  return surfaces.length > 0 ? surfaces : ['restaurant_search']
}

export function getRestaurantRecommendationSurfaces(): readonly PromotionSurface[] {
  return ['restaurant_recommendations']
}

export function getRestaurantPromotionDisclosure(input: {
  isSaved: boolean
  promotionDisclosures?: PromotionDisclosureBySurface | null | undefined
  promotionPriorities?: PromotionPriorityBySurface | null | undefined
  surfaces: readonly PromotionSurface[]
}): PromotionDisclosure | null {
  if (input.isSaved) {
    return null
  }

  return getPromotionDisclosureForSurfaces(
    input.promotionPriorities,
    input.promotionDisclosures,
    input.surfaces
  )
}

export function getRestaurantPromotionSource(input: {
  isSaved: boolean
  promotionDisclosures?: PromotionDisclosureBySurface | null | undefined
  promotionPriorities?: PromotionPriorityBySurface | null | undefined
  surfaces: readonly PromotionSurface[]
  targetId: number
}): PromotionSourceContext | null {
  if (input.isSaved) {
    return null
  }

  const winningPromotion = getWinningPromotionForSurfaces(
    input.promotionPriorities,
    input.promotionDisclosures,
    input.surfaces
  )

  if (!winningPromotion.surface) {
    return null
  }

  return {
    surface: winningPromotion.surface as LivePromotionSurface,
    targetId: input.targetId,
    targetType: 'restaurant',
  }
}

export function isEventDiscoveryPlacementContext(input: {
  hasEnded: boolean
  isJoined: boolean
}) {
  return !input.hasEnded && !input.isJoined
}

export function getEventPromotionDisclosure(input: {
  hasEnded: boolean
  isJoined: boolean
  promotionDisclosures?: PromotionDisclosureBySurface | null | undefined
  promotionPriorities?: PromotionPriorityBySurface | null | undefined
}): PromotionDisclosure | null {
  if (!isEventDiscoveryPlacementContext(input)) {
    return null
  }

  return getPromotionDisclosureForSurfaces(
    input.promotionPriorities,
    input.promotionDisclosures,
    ['event_list']
  )
}

export function getEventPromotionSource(input: {
  hasEnded: boolean
  isJoined: boolean
  promotionDisclosures?: PromotionDisclosureBySurface | null | undefined
  promotionPriorities?: PromotionPriorityBySurface | null | undefined
  targetId: number
}): PromotionSourceContext | null {
  if (!isEventDiscoveryPlacementContext(input)) {
    return null
  }

  const winningPromotion = getWinningPromotionForSurfaces(
    input.promotionPriorities,
    input.promotionDisclosures,
    ['event_list']
  )

  if (winningPromotion.surface !== 'event_list') {
    return null
  }

  return {
    surface: 'event_list',
    targetId: input.targetId,
    targetType: 'event',
  }
}

export function compareEntitiesWithConditionalPromotion<T extends PromotableEntity>(
  left: T,
  right: T,
  input: {
    isPromotionEligible: (value: T) => boolean
    organicCompare: (left: T, right: T) => number
    surfaces: readonly PromotionSurface[]
  }
) {
  if (!input.isPromotionEligible(left) || !input.isPromotionEligible(right)) {
    const organicOrder = input.organicCompare(left, right)

    return organicOrder !== 0 ? organicOrder : left.id - right.id
  }

  return compareEntitiesWithPromotion(left, right, {
    organicCompare: input.organicCompare,
    surfaces: input.surfaces,
  })
}

export function compareEntitiesOrganically<T extends IdentifiedEntity>(
  left: T,
  right: T,
  organicCompare: (left: T, right: T) => number
) {
  const organicOrder = organicCompare(left, right)

  return organicOrder !== 0 ? organicOrder : left.id - right.id
}
