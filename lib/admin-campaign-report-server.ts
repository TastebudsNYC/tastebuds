import 'server-only'

import type { PromotionSurface } from '@/lib/advertising'
import {
  aggregateCampaignReportTotals,
  type CampaignReportDailyRow,
  type CampaignReportOverview,
  type CampaignReportResponse,
  validateCampaignReportDateRange,
} from '@/lib/admin-campaign-report'
import type { createServerSupabaseAdminClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServerSupabaseAdminClient>

type CampaignRecord = {
  campaign_type: CampaignReportOverview['campaign_type']
  ends_on: string
  event_id: number | null
  id: number
  name: string
  promotion_priority: number
  restaurant_id: number | null
  starts_on: string
  status: CampaignReportOverview['status']
}

type CampaignSurfaceRecord = {
  surface: PromotionSurface
}

type EventTargetRecord = {
  id: number
  restaurant_name: string
  title: string
}

type RestaurantTargetRecord = {
  id: number
  name: string
}

class CampaignReportRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function fetchCampaignOverview(
  adminClient: AdminClient,
  campaignId: number
): Promise<CampaignReportOverview> {
  const { data: campaign, error } = await adminClient
    .from('promotion_campaigns')
    .select(
      'campaign_type, ends_on, event_id, id, name, promotion_priority, restaurant_id, starts_on, status'
    )
    .eq('id', campaignId)
    .maybeSingle<CampaignRecord>()

  if (error) {
    throw new Error(error.message)
  }

  if (!campaign) {
    throw new CampaignReportRequestError('Campaign not found.', 404)
  }

  const surfacesPromise = adminClient
    .from('promotion_campaign_surfaces')
    .select('surface')
    .eq('campaign_id', campaignId)
    .order('surface', { ascending: true })
    .returns<CampaignSurfaceRecord[]>()

  const targetPromise =
    campaign.event_id !== null
      ? adminClient
          .from('events')
          .select('id, restaurant_name, title')
          .eq('id', campaign.event_id)
          .maybeSingle<EventTargetRecord>()
      : adminClient
          .from('restaurants')
          .select('id, name')
          .eq('id', campaign.restaurant_id as number)
          .maybeSingle<RestaurantTargetRecord>()

  const [surfacesResponse, targetResponse] = await Promise.all([
    surfacesPromise,
    targetPromise,
  ])

  if (surfacesResponse.error) {
    throw new Error(surfacesResponse.error.message)
  }

  if (targetResponse.error) {
    throw new Error(targetResponse.error.message)
  }

  if (campaign.event_id !== null) {
    const eventTarget = targetResponse.data as EventTargetRecord | null
    return {
      ...campaign,
      surfaces: (surfacesResponse.data ?? []).map((row) => row.surface),
      target_label: 'Promoted event',
      target_name: eventTarget
        ? `${eventTarget.title} | ${eventTarget.restaurant_name}`
        : `Event #${campaign.event_id}`,
      target_type: 'event',
    }
  }

  const restaurantTarget = targetResponse.data as RestaurantTargetRecord | null

  return {
    ...campaign,
    surfaces: (surfacesResponse.data ?? []).map((row) => row.surface),
    target_label: 'Promoted restaurant',
    target_name: restaurantTarget
      ? restaurantTarget.name
      : `Restaurant #${campaign.restaurant_id}`,
    target_type: 'restaurant',
  }
}

export { CampaignReportRequestError }

export async function fetchCampaignReport(
  adminClient: AdminClient,
  campaignId: number,
  input: {
    dateFrom?: string | null
    dateTo?: string | null
  } = {}
): Promise<CampaignReportResponse> {
  const campaign = await fetchCampaignOverview(adminClient, campaignId)
  const selectedFrom = input.dateFrom?.trim() || campaign.starts_on
  const selectedTo = input.dateTo?.trim() || campaign.ends_on
  const validationError = validateCampaignReportDateRange(selectedFrom, selectedTo)

  if (validationError) {
    throw new CampaignReportRequestError(validationError, 400)
  }

  const reportsResponse = await adminClient
    .from('promotion_campaign_daily_reports')
    .select(
      'event_view_count, impression_count, report_date, rsvp_count, save_count, surface, venue_profile_view_count, website_click_count'
    )
    .eq('campaign_id', campaignId)
    .gte('report_date', selectedFrom)
    .lte('report_date', selectedTo)
    .order('report_date', { ascending: true })
    .order('surface', { ascending: true })
    .returns<CampaignReportDailyRow[]>()

  if (reportsResponse.error) {
    throw new Error(reportsResponse.error.message)
  }

  const rows = reportsResponse.data ?? []

  return {
    campaign,
    rows,
    selected_from: selectedFrom,
    selected_to: selectedTo,
    totals: aggregateCampaignReportTotals(rows),
  }
}
