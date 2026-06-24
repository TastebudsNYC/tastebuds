export const CAMPAIGN_TYPES = [
  'founding_partner',
  'sponsored_listing',
  'promoted_event',
] as const

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'ended'] as const

export const RESTAURANT_SURFACES = [
  'restaurant_search',
  'restaurant_category',
  'restaurant_neighbourhood',
  'restaurant_recommendations',
] as const

export const EVENT_SURFACES = [
  'event_list',
  'event_explore',
  'event_recommendations',
] as const

export const SURFACE_OPTIONS = [...RESTAURANT_SURFACES, ...EVENT_SURFACES] as const
export const LIVE_RESTAURANT_SURFACES = [...RESTAURANT_SURFACES] as const
export const LIVE_EVENT_SURFACES = ['event_list'] as const
export const LIVE_SURFACE_OPTIONS = [
  ...LIVE_RESTAURANT_SURFACES,
  ...LIVE_EVENT_SURFACES,
] as const

export type CampaignType = (typeof CAMPAIGN_TYPES)[number]
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]
export type PromotionSurface = (typeof SURFACE_OPTIONS)[number]
export type LivePromotionSurface = (typeof LIVE_SURFACE_OPTIONS)[number]
export type CampaignWriteAction =
  | 'activate'
  | 'end'
  | 'pause'
  | 'reactivate'
  | 'update'

export const CAMPAIGN_WRITE_ACTIONS = [
  'activate',
  'end',
  'pause',
  'reactivate',
  'update',
] as const

const CAMPAIGN_TYPE_SET = new Set<string>(CAMPAIGN_TYPES)
const SURFACE_SET = new Set<string>(SURFACE_OPTIONS)
const RESTAURANT_SURFACE_SET = new Set<string>(RESTAURANT_SURFACES)
const EVENT_SURFACE_SET = new Set<string>(EVENT_SURFACES)
const LIVE_SURFACE_SET = new Set<string>(LIVE_SURFACE_OPTIONS)
const CAMPAIGN_WRITE_ACTION_SET = new Set<string>(CAMPAIGN_WRITE_ACTIONS)

export function isCampaignType(value: unknown): value is CampaignType {
  return typeof value === 'string' && CAMPAIGN_TYPE_SET.has(value)
}

export function isPromotionSurface(value: unknown): value is PromotionSurface {
  return typeof value === 'string' && SURFACE_SET.has(value)
}

export function isLivePromotionSurface(value: unknown): value is LivePromotionSurface {
  return typeof value === 'string' && LIVE_SURFACE_SET.has(value)
}

export function isCampaignWriteAction(value: unknown): value is CampaignWriteAction {
  return typeof value === 'string' && CAMPAIGN_WRITE_ACTION_SET.has(value)
}

export function normalizePromotionSurfaces(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter(isPromotionSurface)))
}

export function getCompatibleSurfaces(campaignType: CampaignType) {
  return campaignType === 'promoted_event' ? EVENT_SURFACES : RESTAURANT_SURFACES
}

export function getCurrentlyLiveSurfaces(campaignType: CampaignType) {
  return campaignType === 'promoted_event' ? LIVE_EVENT_SURFACES : LIVE_RESTAURANT_SURFACES
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function validateCampaignDraft(input: {
  campaignType: CampaignType
  endsOn: string
  eventId: number | null
  nextStatus: CampaignStatus
  promotionPriority: number
  restaurantId: number | null
  startsOn: string
  surfaces: PromotionSurface[]
}) {
  const {
    campaignType,
    endsOn,
    eventId,
    nextStatus,
    promotionPriority,
    restaurantId,
    startsOn,
    surfaces,
  } = input

  if (campaignType === 'promoted_event') {
    if (eventId === null || restaurantId !== null) {
      return 'Promoted event campaigns must target exactly one event.'
    }
  } else if (restaurantId === null || eventId !== null) {
    return 'Restaurant campaigns must target exactly one restaurant.'
  }

  if (!isDateOnly(startsOn) || !isDateOnly(endsOn)) {
    return 'startsOn and endsOn must be valid dates in YYYY-MM-DD format.'
  }

  if (startsOn > endsOn) {
    return 'start date cannot be after end date.'
  }

  if (!Number.isInteger(promotionPriority) || promotionPriority < 0) {
    return 'promotionPriority must be a non-negative integer.'
  }

  const compatibleSurfaces = getCompatibleSurfaces(campaignType)
  const surfaceSet =
    campaignType === 'promoted_event' ? EVENT_SURFACE_SET : RESTAURANT_SURFACE_SET

  if (surfaces.some((surface) => !surfaceSet.has(surface))) {
    return `Selected surfaces are not compatible with ${campaignType}. Allowed surfaces: ${compatibleSurfaces.join(
      ', '
    )}.`
  }

  if (nextStatus === 'active' && surfaces.length === 0) {
    return 'A campaign must have at least one configured surface before it can become active.'
  }

  if (
    nextStatus === 'active' &&
    !surfaces.some((surface) => isLivePromotionSurface(surface))
  ) {
    return 'A campaign must have at least one currently live compatible surface before it can become active.'
  }

  return null
}

export function validateCampaignAction(input: {
  action: CampaignWriteAction
  currentStatus: CampaignStatus
}) {
  const { action, currentStatus } = input

  if (action === 'activate' && currentStatus !== 'draft') {
    return 'Only draft campaigns can be activated.'
  }

  if (action === 'pause' && currentStatus !== 'active') {
    return 'Only active campaigns can be paused.'
  }

  if (action === 'reactivate') {
    if (currentStatus === 'ended') {
      return 'Ended campaigns cannot be reactivated. Create a new campaign instead.'
    }

    if (currentStatus !== 'paused') {
      return 'Only paused campaigns can be reactivated.'
    }
  }

  if (action === 'end' && currentStatus === 'ended') {
    return 'Campaign is already ended.'
  }

  if (action === 'update' && currentStatus === 'ended') {
    return 'Ended campaigns are read-only. Create a new campaign instead.'
  }

  return null
}
