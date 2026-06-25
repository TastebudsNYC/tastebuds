import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

const requireAdminOrCronMock = vi.fn()
const createServerSupabaseAdminClientMock = vi.fn()

vi.mock('@/lib/request-auth', () => ({
  requireAdminOrCron: requireAdminOrCronMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdminClient: createServerSupabaseAdminClientMock,
}))

function buildAdminClient(options?: {
  currentCampaign?: {
    archived_at?: string | null
    campaign_type?: 'founding_partner' | 'promoted_event' | 'sponsored_listing'
    ends_on?: string
    event_id?: number | null
    id?: number
    internal_notes?: string | null
    name?: string
    promotion_priority?: number
    restaurant_id?: number | null
    starts_on?: string
    status?: 'active' | 'draft' | 'ended' | 'paused'
  } | null
  currentSurfaces?: string[]
  eventLookup?: { archived_at: string | null; id: number; title: string } | null
  restaurantLookup?: { archived_at: string | null; id: number; name: string } | null
  rpcError?: { message: string } | null
  rpcResult?: Array<{ campaign_id: number | null; error: string | null; ok: boolean }>
}) {
  const promotionCampaignSurfaceDelete = vi.fn()
  const promotionCampaignSurfaceInsert = vi.fn()
  const rpc = vi.fn(async () => ({
    data: options?.rpcResult ?? [{ campaign_id: 1, error: null, ok: true }],
    error: options?.rpcError ?? null,
  }))

  const from = vi.fn((table: string) => {
    if (table === 'promotion_campaigns') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data:
                options?.currentCampaign === undefined
                  ? {
                      campaign_type: 'founding_partner',
                      archived_at: null,
                      ends_on: '2026-07-10',
                      event_id: null,
                      id: 1,
                      internal_notes: 'notes',
                      name: 'Campaign',
                      promotion_priority: 1,
                      restaurant_id: 5,
                      starts_on: '2026-07-01',
                      status: 'draft',
                    }
                  : options.currentCampaign,
              error: null,
            })),
          })),
        })),
      }
    }

    if (table === 'promotion_campaign_surfaces') {
      return {
        delete: promotionCampaignSurfaceDelete,
        insert: promotionCampaignSurfaceInsert,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            returns: vi.fn(async () => ({
              data: (options?.currentSurfaces ?? []).map((surface) => ({ surface })),
              error: null,
            })),
          })),
        })),
      }
    }

    if (table === 'restaurants') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data:
                options?.restaurantLookup === undefined
                  ? { archived_at: null, id: 5, name: 'Restaurant' }
                  : options.restaurantLookup,
              error: null,
            })),
          })),
        })),
      }
    }

    if (table === 'events') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data:
                options?.eventLookup === undefined
                  ? { archived_at: null, id: 9, title: 'Event' }
                  : options.eventLookup,
              error: null,
            })),
          })),
        })),
      }
    }

    throw new Error(`Unexpected table mock: ${table}`)
  })

  return {
    from,
    promotionCampaignSurfaceDelete,
    promotionCampaignSurfaceInsert,
    rpc,
  }
}

describe('admin campaigns route', () => {
  beforeEach(() => {
    requireAdminOrCronMock.mockReset()
    createServerSupabaseAdminClientMock.mockReset()
    vi.restoreAllMocks()
  })

  it('rejects non-admin callers before service-role campaign access', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      error: new Response(JSON.stringify({ error: 'Admin access only.' }), { status: 403 }),
    })

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.GET(new Request('http://localhost/api/admin/campaigns'))

    expect(response.status).toBe(403)
    expect(createServerSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it('allows deleting a draft campaign with configured surfaces via the atomic RPC path', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: { status: 'draft' },
      currentSurfaces: ['restaurant_search', 'restaurant_category'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.DELETE(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ campaignId: 1 }),
        method: 'DELETE',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'delete',
        p_campaign_id: 1,
      })
    )
    expect(adminClient.promotionCampaignSurfaceDelete).not.toHaveBeenCalled()
  })

  it('does not revalidate an archived target when pausing an active campaign', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'active',
      },
      currentSurfaces: ['restaurant_search'],
      restaurantLookup: { archived_at: '2026-06-24T12:00:00Z', id: 5, name: 'Restaurant' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'pause', campaignId: 1 }),
        method: 'PATCH',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'pause',
        p_campaign_id: 1,
      })
    )
  })

  it('allows archiving an ended campaign through the trusted mutation path', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        archived_at: null,
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'ended',
      },
      currentSurfaces: ['restaurant_search'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'archive', campaignId: 1 }),
        method: 'PATCH',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'archive',
        p_campaign_id: 1,
      })
    )
  })

  it('allows restoring an archived ended campaign', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        archived_at: '2026-06-25T10:00:00Z',
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'ended',
      },
      currentSurfaces: ['restaurant_search'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'unarchive', campaignId: 1 }),
        method: 'PATCH',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'unarchive',
        p_campaign_id: 1,
      })
    )
  })

  it('blocks archiving campaigns that are not ended', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        archived_at: null,
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'active',
      },
      currentSurfaces: ['restaurant_search'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'archive', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Only ended campaigns can be archived.')
    expect(adminClient.rpc).not.toHaveBeenCalled()
  })

  it('does not revalidate an archived target when ending an active campaign', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'active',
      },
      currentSurfaces: ['restaurant_search'],
      restaurantLookup: { archived_at: '2026-06-24T12:00:00Z', id: 5, name: 'Restaurant' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'end', campaignId: 1 }),
        method: 'PATCH',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'end',
        p_campaign_id: 1,
      })
    )
  })

  it('does not revalidate an archived target when deleting a draft campaign', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: { status: 'draft' },
      currentSurfaces: ['restaurant_search'],
      restaurantLookup: { archived_at: '2026-06-24T12:00:00Z', id: 5, name: 'Restaurant' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.DELETE(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ campaignId: 1 }),
        method: 'DELETE',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'delete',
        p_campaign_id: 1,
      })
    )
  })

  it('rejects reactivation when the target has since been archived', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'paused',
      },
      currentSurfaces: ['restaurant_search'],
      restaurantLookup: { archived_at: '2026-06-24T12:00:00Z', id: 5, name: 'Restaurant' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'reactivate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Archived restaurants cannot be used as active campaign targets.')
    expect(adminClient.rpc).not.toHaveBeenCalled()
  })

  it('blocks activation when a draft campaign has zero configured surfaces', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: [],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('at least one configured surface')
    expect(adminClient.rpc).not.toHaveBeenCalled()
  })

  it('does not partially replace surfaces when an edit fails', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'sponsored_listing',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 2,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_search', 'restaurant_category'],
      rpcResult: [
        {
          campaign_id: 1,
          error:
            'Campaign mutation failed because one or more configured surfaces already have dependent daily report rows.',
          ok: false,
        },
      ],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({
          action: 'update',
          campaignId: 1,
          campaignType: 'sponsored_listing',
          endsOn: '2026-07-11',
          eventId: null,
          internalNotes: 'updated',
          name: 'Campaign',
          promotionPriority: 2,
          restaurantId: 5,
          startsOn: '2026-07-01',
          surfaces: ['restaurant_search'],
        }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('dependent daily report rows')
    expect(adminClient.rpc).toHaveBeenCalledTimes(1)
    expect(adminClient.promotionCampaignSurfaceDelete).not.toHaveBeenCalled()
    expect(adminClient.promotionCampaignSurfaceInsert).not.toHaveBeenCalled()
  })

  it('returns a safe 500 when the campaign mutation RPC errors', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'trusted-admin-id' },
    })
    const adminClient = buildAdminClient({
      restaurantLookup: { archived_at: null, id: 5, name: 'Restaurant' },
      rpcError: { message: 'database exploded with internal detail' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.POST(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({
          actorId: 'untrusted-body-value',
          campaignType: 'founding_partner',
          endsOn: '2026-07-10',
          internalNotes: 'notes',
          name: 'Campaign',
          promotionPriority: 1,
          restaurantId: 5,
          startsOn: '2026-07-01',
          surfaces: ['restaurant_search'],
        }),
        method: 'POST',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe(
      'Campaign mutations are currently unavailable. Check the server logs for the underlying database error.'
    )
    expect(JSON.stringify(payload)).not.toContain('database exploded')
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_actor_id: 'trusted-admin-id',
      })
    )
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('returns mutation validation failures without exposing a server error', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_search'],
      rpcResult: [{ campaign_id: 1, error: 'Only draft campaigns can be activated.', ok: false }],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Only draft campaigns can be activated.')
  })

  it('rejects target or type changes after reporting has begun without mutating configuration', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: 'notes',
        name: 'Campaign',
        promotion_priority: 1,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_search'],
      rpcResult: [
        {
          campaign_id: 1,
          error:
            'Campaign target and type cannot be changed after reporting has begun. Create a new campaign instead.',
          ok: false,
        },
      ],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({
          action: 'update',
          campaignId: 1,
          campaignType: 'sponsored_listing',
          endsOn: '2026-07-10',
          eventId: null,
          internalNotes: 'notes',
          name: 'Campaign',
          promotionPriority: 1,
          restaurantId: 6,
          startsOn: '2026-07-01',
          surfaces: ['restaurant_search'],
        }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe(
      'Campaign target and type cannot be changed after reporting has begun. Create a new campaign instead.'
    )
    expect(adminClient.rpc).toHaveBeenCalledTimes(1)
    expect(adminClient.promotionCampaignSurfaceDelete).not.toHaveBeenCalled()
    expect(adminClient.promotionCampaignSurfaceInsert).not.toHaveBeenCalled()
  })

  it('blocks activation when an event campaign only has future surfaces configured', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'promoted_event',
        ends_on: '2026-07-10',
        event_id: 9,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: null,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['event_explore'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe(
      'A campaign must have at least one currently live compatible surface before it can become active.'
    )
    expect(adminClient.rpc).not.toHaveBeenCalled()
  })

  it('allows activation when an event campaign includes the live event_list surface', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'promoted_event',
        ends_on: '2026-07-10',
        event_id: 9,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: null,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['event_explore', 'event_list'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'activate',
        p_campaign_id: 1,
        p_campaign_type: 'promoted_event',
        p_ends_on: '2026-07-10',
        p_event_id: 9,
        p_internal_notes: '',
        p_name: 'Campaign',
        p_promotion_priority: 0,
        p_restaurant_id: null,
        p_starts_on: '2026-07-01',
        p_surfaces: ['event_explore', 'event_list'],
      })
    )
  })

  it('blocks activation when a restaurant campaign only has deferred restaurant_recommendations configured', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_recommendations'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe(
      'A campaign must have at least one currently live compatible surface before it can become active.'
    )
    expect(adminClient.rpc).not.toHaveBeenCalled()
  })

  it('allows activation when a restaurant campaign includes the live restaurant_search surface', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_recommendations', 'restaurant_search'],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )

    expect(response.status).toBe(200)
    expect(adminClient.rpc).toHaveBeenCalledWith(
      'mutate_promotion_campaign',
      expect.objectContaining({
        p_action: 'activate',
        p_campaign_id: 1,
        p_campaign_type: 'founding_partner',
        p_surfaces: ['restaurant_recommendations', 'restaurant_search'],
      })
    )
  })

  it('returns a safe 500 when a lifecycle mutation RPC transport error occurs', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_search'],
      rpcError: { message: 'transport-level rpc failure detail' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe(
      'Campaign mutations are currently unavailable. Check the server logs for the underlying database error.'
    )
    expect(JSON.stringify(payload)).not.toContain('transport-level rpc failure detail')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('returns a specific safe message when the mutation function is missing or out of date', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      currentCampaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-10',
        event_id: null,
        id: 1,
        internal_notes: null,
        name: 'Campaign',
        promotion_priority: 0,
        restaurant_id: 5,
        starts_on: '2026-07-01',
        status: 'draft',
      },
      currentSurfaces: ['restaurant_search'],
      rpcError: {
        message:
          'Could not find the function public.mutate_promotion_campaign(p_action, p_campaign_id, p_name, p_campaign_type, p_restaurant_id, p_event_id, p_starts_on, p_ends_on, p_promotion_priority, p_internal_notes, p_surfaces, p_actor_id) in the schema cache',
      },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const route = await import('@/app/api/admin/campaigns/route')
    const response = await route.PATCH(
      new Request('http://localhost/api/admin/campaigns', {
        body: JSON.stringify({ action: 'activate', campaignId: 1 }),
        method: 'PATCH',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe(
      'Campaign mutations are unavailable because the database function is out of date. Apply the latest advertising campaign SQL changes.'
    )
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('keeps the trusted mutation SQL path aligned with the live event surface activation rule', () => {
    const migrationSql = readFileSync(
      'supabase/migrations/202606240002_campaign_atomic_mutations.sql',
      'utf8'
    )

    expect(migrationSql).toContain(
      'A campaign must have at least one currently live compatible surface before it can become active.'
    )
    expect(migrationSql).toContain("where surface_value = 'event_list'")
  })

  it('qualifies campaign_id references in the follow-up mutation fix migration', () => {
    const migrationSql = readFileSync(
      'supabase/migrations/202606240003_fix_campaign_mutation_column_qualification.sql',
      'utf8'
    )

    expect(migrationSql).toContain('where pcs.campaign_id = v_current.id;')
    expect(migrationSql).toContain('where pcdr.campaign_id = v_current.id')
    expect(migrationSql).toContain('delete from public.promotion_campaign_surfaces as pcs')
    expect(migrationSql).toContain('and not (pcs.surface = any(v_next_surfaces));')
  })
})
