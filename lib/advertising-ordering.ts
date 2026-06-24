import type { PromotionSurface } from '@/lib/advertising'

type PromotionPriorityBySurface = Partial<Record<PromotionSurface, number>>
type PromotionDisclosure = 'Founding Partner' | 'Sponsored'
type PromotionDisclosureBySurface = Partial<Record<PromotionSurface, PromotionDisclosure>>

type PromotableEntity = {
  id: number
  promotionDisclosures?: PromotionDisclosureBySurface | null
  promotionPriorities?: PromotionPriorityBySurface | null
}

export type { PromotionDisclosure, PromotionDisclosureBySurface, PromotionPriorityBySurface }

export function getHighestPromotionPriority(
  priorities: PromotionPriorityBySurface | null | undefined,
  surfaces: readonly PromotionSurface[]
) {
  let highestPriority: number | null = null

  for (const surface of surfaces) {
    const priority = priorities?.[surface]

    if (typeof priority !== 'number') {
      continue
    }

    if (highestPriority === null || priority > highestPriority) {
      highestPriority = priority
    }
  }

  return highestPriority
}

export function compareEntitiesWithPromotion<T extends PromotableEntity>(
  left: T,
  right: T,
  input: {
    organicCompare: (left: T, right: T) => number
    surfaces: readonly PromotionSurface[]
  }
) {
  const leftPriority = getHighestPromotionPriority(left.promotionPriorities, input.surfaces)
  const rightPriority = getHighestPromotionPriority(right.promotionPriorities, input.surfaces)
  const leftIsSponsored = leftPriority !== null
  const rightIsSponsored = rightPriority !== null

  if (leftIsSponsored !== rightIsSponsored) {
    return rightIsSponsored ? 1 : -1
  }

  if (
    leftPriority !== null &&
    rightPriority !== null &&
    leftPriority !== rightPriority
  ) {
    return rightPriority - leftPriority
  }

  const organicOrder = input.organicCompare(left, right)

  if (organicOrder !== 0) {
    return organicOrder
  }

  return left.id - right.id
}

export function getPromotionDisclosureForSurfaces(
  priorities: PromotionPriorityBySurface | null | undefined,
  disclosures: PromotionDisclosureBySurface | null | undefined,
  surfaces: readonly PromotionSurface[]
) {
  let bestDisclosure: PromotionDisclosure | null = null
  let bestPriority: number | null = null

  for (const surface of surfaces) {
    const disclosure = disclosures?.[surface]
    const priority = priorities?.[surface]

    if (!disclosure || typeof priority !== 'number') {
      continue
    }

    if (bestPriority === null || priority > bestPriority) {
      bestPriority = priority
      bestDisclosure = disclosure
    }
  }

  return bestDisclosure
}
