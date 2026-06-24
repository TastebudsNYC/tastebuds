import {
  type LivePromotionSurface,
  type PromotionSurface,
  LIVE_EVENT_SURFACES,
  LIVE_RESTAURANT_SURFACES,
} from '@/lib/advertising'
import type { PromotionPriorityBySurface } from '@/lib/advertising-ordering'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'

const NEW_YORK_TIMEZONE = 'America/New_York'

type EntityType = 'event' | 'restaurant'

type CampaignSurfaceRow = {
  surface: PromotionSurface
}

type PromotionCampaignRow = {
  id: number
  promotion_campaign_surfaces: CampaignSurfaceRow[] | null
  promotion_priority: number
  restaurant_id?: number | null
  event_id?: number | null
  starts_on: string
}

type ResolvedPromotionRecord = {
  targetId: number
  promotionPriorities: PromotionPriorityBySurface
}

export function getCurrentDateKeyInNewYork(reference: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Failed to derive New York campaign date.')
  }

  return `${year}-${month}-${day}`
}

function getLiveSurfacesForEntity(entityType: EntityType) {
  return entityType === 'event' ? LIVE_EVENT_SURFACES : LIVE_RESTAURANT_SURFACES
}

export function buildResolvedPromotionRecords(
  campaigns: PromotionCampaignRow[],
  entityType: EntityType
) {
  const winnerByTargetAndSurface = new Map<string, {
    campaignId: number
    priority: number
    startsOn: string
    surface: LivePromotionSurface
    targetId: number
  }>()
  const liveSurfaceSet = new Set<PromotionSurface>(getLiveSurfacesForEntity(entityType))

  for (const campaign of campaigns) {
    const targetId =
      entityType === 'event' ? campaign.event_id ?? null : campaign.restaurant_id ?? null

    if (targetId === null) {
      continue
    }

    for (const surfaceRow of campaign.promotion_campaign_surfaces ?? []) {
      if (!liveSurfaceSet.has(surfaceRow.surface)) {
        continue
      }

      const surface = surfaceRow.surface as LivePromotionSurface
      const key = `${targetId}:${surface}`
      const currentWinner = winnerByTargetAndSurface.get(key)

      if (
        !currentWinner ||
        campaign.promotion_priority > currentWinner.priority ||
        (campaign.promotion_priority === currentWinner.priority &&
          campaign.starts_on < currentWinner.startsOn) ||
        (campaign.promotion_priority === currentWinner.priority &&
          campaign.starts_on === currentWinner.startsOn &&
          campaign.id < currentWinner.campaignId)
      ) {
        winnerByTargetAndSurface.set(key, {
          campaignId: campaign.id,
          priority: campaign.promotion_priority,
          startsOn: campaign.starts_on,
          surface,
          targetId,
        })
      }
    }
  }

  const prioritiesByTargetId = new Map<number, PromotionPriorityBySurface>()

  for (const winner of winnerByTargetAndSurface.values()) {
    prioritiesByTargetId.set(winner.targetId, {
      ...(prioritiesByTargetId.get(winner.targetId) ?? {}),
      [winner.surface]: winner.priority,
    })
  }

  return Array.from(prioritiesByTargetId.entries()).map(([targetId, promotionPriorities]) => ({
    promotionPriorities,
    targetId,
  })) satisfies ResolvedPromotionRecord[]
}

export function mergeOrganicAndPromotedRows<T extends { id: number }>(
  organicRows: T[],
  promotedRows: T[]
) {
  const rowById = new Map<number, T>()

  for (const row of organicRows) {
    rowById.set(row.id, row)
  }

  for (const row of promotedRows) {
    if (!rowById.has(row.id)) {
      rowById.set(row.id, row)
    }
  }

  return Array.from(rowById.values())
}

export function attachPromotionPriorities<T extends { id: number }>(
  rows: T[],
  resolvedPromotions: ResolvedPromotionRecord[]
) {
  const promotionByTargetId = new Map(
    resolvedPromotions.map((record) => [record.targetId, record.promotionPriorities] as const)
  )

  return rows.map((row) => {
    const promotionPriorities = promotionByTargetId.get(row.id)

    return promotionPriorities
      ? {
          ...row,
          promotionPriorities,
        }
      : row
  })
}

export async function resolveActivePromotionRecords(
  adminClient: ReturnType<typeof createServerSupabaseAdminClient>,
  entityType: EntityType
) {
  const today = getCurrentDateKeyInNewYork()
  const liveSurfaces = getLiveSurfacesForEntity(entityType)
  const query =
    entityType === 'event'
      ? adminClient
          .from('promotion_campaigns')
          .select(
            'event_id, id, promotion_campaign_surfaces!inner(surface), promotion_priority, starts_on'
          )
          .not('event_id', 'is', null)
      : adminClient
          .from('promotion_campaigns')
          .select(
            'id, promotion_campaign_surfaces!inner(surface), promotion_priority, restaurant_id, starts_on'
          )
          .not('restaurant_id', 'is', null)

  const response = await query
    .eq('status', 'active')
    .lte('starts_on', today)
    .gte('ends_on', today)
    .in('promotion_campaign_surfaces.surface', [...liveSurfaces])
    .returns<PromotionCampaignRow[]>()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return buildResolvedPromotionRecords(response.data ?? [], entityType)
}
