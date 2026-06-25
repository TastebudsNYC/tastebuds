import { NextResponse } from 'next/server'

import {
  type CampaignStatus,
  type CampaignType,
  type CampaignWriteAction,
  type PromotionSurface,
  isCampaignType,
  isCampaignWriteAction,
  isPromotionSurface,
  normalizePromotionSurfaces,
  validateCampaignAction,
  validateCampaignDraft,
} from '@/lib/advertising'
import { requireAdminOrCron } from '@/lib/request-auth'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'

type CampaignRecord = {
  archived_at: string | null
  archived_by: string | null
  campaign_type: CampaignType
  created_at: string
  created_by: string | null
  ends_on: string
  event_id: number | null
  id: number
  internal_notes: string | null
  name: string
  promotion_priority: number
  restaurant_id: number | null
  starts_on: string
  status: CampaignStatus
  updated_at: string
  updated_by: string | null
}

type CampaignSurfaceRecord = {
  campaign_id: number
  surface: PromotionSurface
}

type RestaurantOption = {
  archived_at: string | null
  id: number
  name: string
  neighbourhood: string | null
  subregion: string
}

type EventOption = {
  archived_at: string | null
  id: number
  restaurant_name: string
  starts_at: string
  status: 'cancelled' | 'closed' | 'open'
  title: string
}

type CreateCampaignRequest = {
  campaignType?: CampaignType
  endsOn?: string
  eventId?: number | null
  internalNotes?: string
  name?: string
  promotionPriority?: number
  restaurantId?: number | null
  startsOn?: string
  surfaces?: PromotionSurface[]
}

type UpdateCampaignRequest = CreateCampaignRequest & {
  action?: CampaignWriteAction
  campaignId?: number
}

type MutationResultRow = {
  campaign_id: number | null
  error: string | null
  ok: boolean
}

class CampaignRequestValidationError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

class CampaignMutationRpcError extends Error {
  constructor(message: string) {
    super(message)
  }
}

function shouldValidateActiveCampaignTarget(action: CampaignWriteAction | 'create') {
  return (
    action === 'create' ||
    action === 'update' ||
    action === 'activate' ||
    action === 'reactivate'
  )
}

function getSafeCampaignMutationErrorMessage(error: CampaignMutationRpcError) {
  const normalizedMessage = error.message.toLowerCase()

  if (
    normalizedMessage.includes('could not find the function public.mutate_promotion_campaign') ||
    normalizedMessage.includes('function public.mutate_promotion_campaign')
  ) {
    return 'Campaign mutations are unavailable because the database function is out of date. Apply the latest advertising campaign SQL changes.'
  }

  return 'Campaign mutations are currently unavailable. Check the server logs for the underlying database error.'
}

async function fetchRestaurantTarget(adminClient: ReturnType<typeof createServerSupabaseAdminClient>, restaurantId: number) {
  const { data: restaurant, error } = await adminClient
    .from('restaurants')
    .select('archived_at, id, name')
    .eq('id', restaurantId)
    .maybeSingle<{ archived_at: string | null; id: number; name: string }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!restaurant) {
    throw new CampaignRequestValidationError('Restaurant target not found.', 404)
  }

  if (restaurant.archived_at) {
    throw new CampaignRequestValidationError(
      'Archived restaurants cannot be used as active campaign targets.',
      400
    )
  }

  return restaurant
}

async function fetchEventTarget(adminClient: ReturnType<typeof createServerSupabaseAdminClient>, eventId: number) {
  const { data: event, error } = await adminClient
    .from('events')
    .select('archived_at, id, title')
    .eq('id', eventId)
    .maybeSingle<{ archived_at: string | null; id: number; title: string }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!event) {
    throw new CampaignRequestValidationError('Event target not found.', 404)
  }

  if (event.archived_at) {
    throw new CampaignRequestValidationError(
      'Archived events cannot be used as active campaign targets.',
      400
    )
  }

  return event
}

async function runCampaignMutation(
  adminClient: ReturnType<typeof createServerSupabaseAdminClient>,
  input: {
    action: 'activate' | 'create' | 'delete' | 'end' | 'pause' | 'reactivate' | 'update'
      | 'archive'
      | 'unarchive'
    actorId: string | null
    campaignId?: number | null
    campaignType?: CampaignType
    endsOn?: string
    eventId?: number | null
    internalNotes?: string
    name?: string
    promotionPriority?: number
    restaurantId?: number | null
    startsOn?: string
    surfaces?: PromotionSurface[]
  }
) {
  const response = await adminClient.rpc('mutate_promotion_campaign', {
    p_action: input.action,
    p_actor_id: input.actorId ?? null,
    p_campaign_id: input.campaignId ?? null,
    p_campaign_type: input.campaignType ?? null,
    p_ends_on: input.endsOn ?? null,
    p_event_id: input.eventId ?? null,
    p_internal_notes: input.internalNotes ?? null,
    p_name: input.name ?? null,
    p_promotion_priority: input.promotionPriority ?? null,
    p_restaurant_id: input.restaurantId ?? null,
    p_starts_on: input.startsOn ?? null,
    p_surfaces: input.surfaces ?? null,
  })

  if (response.error) {
    throw new CampaignMutationRpcError(`Campaign mutation RPC failed: ${response.error.message}`)
  }

  const rows = Array.isArray(response.data) ? (response.data as MutationResultRow[]) : []
  const result = rows[0]

  if (!result) {
    throw new CampaignMutationRpcError('Campaign mutation RPC returned no result.')
  }

  if (!result.ok) {
    return {
      campaignId: result.campaign_id ?? null,
      error: result.error ?? 'Campaign mutation failed.',
      ok: false as const,
    }
  }

  return {
    campaignId: result.campaign_id ?? input.campaignId ?? null,
    error: null,
    ok: true as const,
  }
}

async function fetchCampaigns() {
  const adminClient = createServerSupabaseAdminClient()
  const [campaignsResponse, surfacesResponse, restaurantsResponse, eventsResponse] =
    await Promise.all([
      adminClient
        .from('promotion_campaigns')
        .select(
          'archived_at, archived_by, campaign_type, created_at, created_by, ends_on, event_id, id, internal_notes, name, promotion_priority, restaurant_id, starts_on, status, updated_at, updated_by'
        )
        .order('created_at', { ascending: false })
        .returns<CampaignRecord[]>(),
      adminClient
        .from('promotion_campaign_surfaces')
        .select('campaign_id, surface')
        .returns<CampaignSurfaceRecord[]>(),
      adminClient
        .from('restaurants')
        .select('archived_at, id, name, neighbourhood, subregion')
        .order('name', { ascending: true })
        .returns<RestaurantOption[]>(),
      adminClient
        .from('events')
        .select('archived_at, id, restaurant_name, starts_at, status, title')
        .order('starts_at', { ascending: false })
        .returns<EventOption[]>(),
    ])

  if (campaignsResponse.error) {
    throw new Error(campaignsResponse.error.message)
  }

  if (surfacesResponse.error) {
    throw new Error(surfacesResponse.error.message)
  }

  if (restaurantsResponse.error) {
    throw new Error(restaurantsResponse.error.message)
  }

  if (eventsResponse.error) {
    throw new Error(eventsResponse.error.message)
  }

  const surfacesByCampaignId = new Map<number, PromotionSurface[]>()

  for (const row of surfacesResponse.data ?? []) {
    surfacesByCampaignId.set(row.campaign_id, [
      ...(surfacesByCampaignId.get(row.campaign_id) ?? []),
      row.surface,
    ])
  }

  return {
    campaigns: (campaignsResponse.data ?? []).map((campaign) => ({
      ...campaign,
      surfaces: surfacesByCampaignId.get(campaign.id) ?? [],
    })),
    events: eventsResponse.data ?? [],
    restaurants: restaurantsResponse.data ?? [],
  }
}

export async function GET(request: Request) {
  const adminCheck = await requireAdminOrCron(request, {
    allowAdmin: true,
    allowCron: false,
  })

  if ('error' in adminCheck) {
    return adminCheck.error
  }

  try {
    const payload = await fetchCampaigns()

    return NextResponse.json({
      ...payload,
      ok: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load campaigns.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const adminCheck = await requireAdminOrCron(request, {
    allowAdmin: true,
    allowCron: false,
  })

  if ('error' in adminCheck) {
    return adminCheck.error
  }

  let body: CreateCampaignRequest = {}

  try {
    body = (await request.json()) as CreateCampaignRequest
  } catch {
    body = {}
  }

  const name = body.name?.trim()
  const campaignType = body.campaignType
  const restaurantId =
    typeof body.restaurantId === 'number' && Number.isInteger(body.restaurantId)
      ? body.restaurantId
      : null
  const eventId =
    typeof body.eventId === 'number' && Number.isInteger(body.eventId) ? body.eventId : null
  const startsOn = body.startsOn?.trim() ?? ''
  const endsOn = body.endsOn?.trim() ?? ''
  const promotionPriority = Number(body.promotionPriority ?? 0)
  const internalNotes = body.internalNotes?.trim() ?? ''
  const surfaces = normalizePromotionSurfaces(body.surfaces)

  if (!name) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 })
  }

  if (!campaignType || !isCampaignType(campaignType)) {
    return NextResponse.json({ error: 'campaignType is required.' }, { status: 400 })
  }

  if (
    Array.isArray(body.surfaces) &&
    body.surfaces.some((surface) => !isPromotionSurface(surface))
  ) {
    return NextResponse.json({ error: 'surfaces contains an invalid value.' }, { status: 400 })
  }

  const validationError = validateCampaignDraft({
    campaignType,
    endsOn,
    eventId,
    nextStatus: 'draft',
    promotionPriority,
    restaurantId,
    startsOn,
    surfaces,
  })

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    const adminClient = createServerSupabaseAdminClient()

    if (shouldValidateActiveCampaignTarget('create')) {
      if (campaignType === 'promoted_event') {
        await fetchEventTarget(adminClient, eventId as number)
      } else {
        await fetchRestaurantTarget(adminClient, restaurantId as number)
      }
    }

    const actorId = adminCheck.kind === 'admin' ? adminCheck.user.id : null
    const mutation = await runCampaignMutation(adminClient, {
      action: 'create',
      actorId,
      campaignType,
      endsOn,
      eventId,
      internalNotes,
      name,
      promotionPriority,
      restaurantId,
      startsOn,
      surfaces,
    })

    if (!mutation.ok) {
      return NextResponse.json({ error: mutation.error }, { status: 400 })
    }

    return NextResponse.json({ campaignId: mutation.campaignId, ok: true })
  } catch (error) {
    if (error instanceof CampaignRequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof CampaignMutationRpcError) {
      console.error('Campaign create failed.', error)

      return NextResponse.json(
        { error: getSafeCampaignMutationErrorMessage(error) },
        { status: 500 }
      )
    }

    console.error('Campaign create failed.', error)

    return NextResponse.json(
      { error: 'Failed to create campaign.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const adminCheck = await requireAdminOrCron(request, {
    allowAdmin: true,
    allowCron: false,
  })

  if ('error' in adminCheck) {
    return adminCheck.error
  }

  let body: UpdateCampaignRequest = {}

  try {
    body = (await request.json()) as UpdateCampaignRequest
  } catch {
    body = {}
  }

  const campaignId = Number(body.campaignId)

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json({ error: 'campaignId must be a valid positive integer.' }, { status: 400 })
  }

  const action = body.action ?? 'update'

  if (!isCampaignWriteAction(action)) {
    return NextResponse.json({ error: 'action is invalid.' }, { status: 400 })
  }

  try {
    const adminClient = createServerSupabaseAdminClient()
    const { data: currentCampaign, error: currentCampaignError } = await adminClient
      .from('promotion_campaigns')
      .select(
        'archived_at, campaign_type, ends_on, event_id, id, internal_notes, name, promotion_priority, restaurant_id, starts_on, status'
      )
      .eq('id', campaignId)
      .maybeSingle<
        Pick<
          CampaignRecord,
          | 'campaign_type'
          | 'ends_on'
          | 'event_id'
          | 'id'
          | 'internal_notes'
          | 'name'
          | 'promotion_priority'
          | 'restaurant_id'
          | 'starts_on'
          | 'status'
          | 'archived_at'
        >
      >()

    if (currentCampaignError) {
      throw new CampaignMutationRpcError('Failed to load current campaign.')
    }

    if (!currentCampaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
    }

    const currentSurfaceResponse = await adminClient
      .from('promotion_campaign_surfaces')
      .select('surface')
      .eq('campaign_id', campaignId)
      .returns<{ surface: PromotionSurface }[]>()

    if (currentSurfaceResponse.error) {
      throw new CampaignMutationRpcError('Failed to load current campaign surfaces.')
    }

    const currentSurfaces = (currentSurfaceResponse.data ?? []).map((row) => row.surface)
    if (body.campaignType !== undefined && !isCampaignType(body.campaignType)) {
      return NextResponse.json({ error: 'campaignType is invalid.' }, { status: 400 })
    }

    if (
      Array.isArray(body.surfaces) &&
      body.surfaces.some((surface) => !isPromotionSurface(surface))
    ) {
      return NextResponse.json({ error: 'surfaces contains an invalid value.' }, { status: 400 })
    }

    const campaignType = body.campaignType ?? currentCampaign.campaign_type
    const restaurantId =
      typeof body.restaurantId === 'number' && Number.isInteger(body.restaurantId)
        ? body.restaurantId
        : body.restaurantId === null
          ? null
          : currentCampaign.restaurant_id
    const eventId =
      typeof body.eventId === 'number' && Number.isInteger(body.eventId)
        ? body.eventId
        : body.eventId === null
          ? null
          : currentCampaign.event_id
    const startsOn = body.startsOn?.trim() ?? currentCampaign.starts_on
    const endsOn = body.endsOn?.trim() ?? currentCampaign.ends_on
    const promotionPriority =
      body.promotionPriority === undefined
        ? currentCampaign.promotion_priority
        : Number(body.promotionPriority)
    const surfaces =
      body.surfaces === undefined ? currentSurfaces : normalizePromotionSurfaces(body.surfaces)

    let nextStatus: CampaignStatus = currentCampaign.status

    if (action === 'activate' || action === 'reactivate') {
      nextStatus = 'active'
    } else if (action === 'pause') {
      nextStatus = 'paused'
    } else if (action === 'end') {
      nextStatus = 'ended'
    }

    const statusError = validateCampaignAction({
      action,
      currentStatus: currentCampaign.status,
    })

    if (statusError) {
      return NextResponse.json({ error: statusError }, { status: 400 })
    }

    if (action === 'archive' && currentCampaign.archived_at) {
      return NextResponse.json({ error: 'Campaign is already archived.' }, { status: 400 })
    }

    if (action === 'unarchive' && !currentCampaign.archived_at) {
      return NextResponse.json({ error: 'Campaign is not archived.' }, { status: 400 })
    }

    if (currentCampaign.archived_at && action !== 'unarchive') {
      return NextResponse.json(
        { error: 'Archived campaigns must be restored before they can be changed.' },
        { status: 400 }
      )
    }

    const validationError = validateCampaignDraft({
      campaignType,
      endsOn,
      eventId,
      nextStatus,
      promotionPriority,
      restaurantId,
      startsOn,
      surfaces,
    })

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (shouldValidateActiveCampaignTarget(action)) {
      if (campaignType === 'promoted_event') {
        await fetchEventTarget(adminClient, eventId as number)
      } else {
        await fetchRestaurantTarget(adminClient, restaurantId as number)
      }
    }

    const actorId = adminCheck.kind === 'admin' ? adminCheck.user.id : null

    const mutationInput =
      action === 'update'
        ? {
            action,
            actorId,
            campaignId,
            campaignType,
            endsOn,
            eventId,
            internalNotes:
              typeof body.internalNotes === 'string'
                ? body.internalNotes.trim()
                : currentCampaign.internal_notes ?? '',
            name:
              typeof body.name === 'string' && body.name.trim()
                ? body.name.trim()
                : currentCampaign.name,
            promotionPriority,
            restaurantId,
            startsOn,
            surfaces,
          }
        : action === 'activate' || action === 'pause' || action === 'reactivate' || action === 'end'
          ? {
              action,
              actorId,
              campaignId,
              campaignType,
              endsOn,
              eventId,
              internalNotes: currentCampaign.internal_notes ?? '',
              name: currentCampaign.name,
              promotionPriority,
              restaurantId,
              startsOn,
              surfaces: currentSurfaces,
            }
        : {
            action,
            actorId,
            campaignId,
          }

    const mutation = await runCampaignMutation(adminClient, mutationInput)

    if (!mutation.ok) {
      return NextResponse.json({ error: mutation.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof CampaignRequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof CampaignMutationRpcError) {
      console.error('Campaign update failed.', error)

      return NextResponse.json(
        { error: getSafeCampaignMutationErrorMessage(error) },
        { status: 500 }
      )
    }

    console.error('Campaign update failed.', error)

    return NextResponse.json(
      { error: 'Failed to update campaign.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const adminCheck = await requireAdminOrCron(request, {
    allowAdmin: true,
    allowCron: false,
  })

  if ('error' in adminCheck) {
    return adminCheck.error
  }

  let body: { campaignId?: number } = {}

  try {
    body = (await request.json()) as { campaignId?: number }
  } catch {
    body = {}
  }

  const campaignId = Number(body.campaignId)

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json({ error: 'campaignId must be a valid positive integer.' }, { status: 400 })
  }

  try {
    const adminClient = createServerSupabaseAdminClient()
    const { data: currentCampaign, error: currentCampaignError } = await adminClient
      .from('promotion_campaigns')
      .select('status')
      .eq('id', campaignId)
      .maybeSingle<{ status: CampaignStatus }>()

    if (currentCampaignError) {
      throw new CampaignMutationRpcError('Failed to load current campaign.')
    }

    if (!currentCampaign) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
    }

    if (currentCampaign.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft campaigns may be deleted.' },
        { status: 400 }
      )
    }

    const mutation = await runCampaignMutation(adminClient, {
      action: 'delete',
      actorId: adminCheck.kind === 'admin' ? adminCheck.user.id : null,
      campaignId,
    })

    if (!mutation.ok) {
      return NextResponse.json({ error: mutation.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof CampaignRequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof CampaignMutationRpcError) {
      console.error('Campaign delete failed.', error)

      return NextResponse.json(
        { error: getSafeCampaignMutationErrorMessage(error) },
        { status: 500 }
      )
    }

    console.error('Campaign delete failed.', error)

    return NextResponse.json(
      { error: 'Failed to delete campaign.' },
      { status: 500 }
    )
  }
}
