import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAdminOrCronMock = vi.fn()
const createServerSupabaseAdminClientMock = vi.fn()

vi.mock('@/lib/request-auth', () => ({
  requireAdminOrCron: requireAdminOrCronMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdminClient: createServerSupabaseAdminClientMock,
}))

function buildAdminClient(options?: {
  campaign?: {
    campaign_type: 'founding_partner' | 'promoted_event' | 'sponsored_listing'
    ends_on: string
    event_id: number | null
    id: number
    name: string
    promotion_priority: number
    restaurant_id: number | null
    starts_on: string
    status: 'active' | 'draft' | 'ended' | 'paused'
  } | null
  eventTarget?: { id: number; restaurant_name: string; title: string } | null
  reportRows?: Array<{
    campaign_id?: number
    event_view_count: number
    impression_count: number
    report_date: string
    rsvp_count: number
    save_count: number
    surface:
      | 'event_explore'
      | 'event_list'
      | 'event_recommendations'
      | 'restaurant_category'
      | 'restaurant_neighbourhood'
      | 'restaurant_recommendations'
      | 'restaurant_search'
    venue_profile_view_count: number
    website_click_count: number
  }>
  restaurantTarget?: { id: number; name: string } | null
  surfaces?: string[]
}) {
  const state = {
    lastCampaignIdFilter: null as number | null,
    lastDateFrom: null as string | null,
    lastDateTo: null as string | null,
  }

  const from = vi.fn((table: string) => {
    if (table === 'promotion_campaigns') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data:
                options?.campaign === undefined
                  ? {
                      campaign_type: 'founding_partner',
                      ends_on: '2026-07-31',
                      event_id: null,
                      id: 9,
                      name: 'Campaign',
                      promotion_priority: 3,
                      restaurant_id: 55,
                      starts_on: '2026-07-01',
                      status: 'active',
                    }
                  : options.campaign,
              error: null,
            })),
          })),
        })),
      }
    }

    if (table === 'promotion_campaign_surfaces') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              returns: vi.fn(async () => ({
                data: (options?.surfaces ?? ['restaurant_search']).map((surface) => ({
                  surface,
                })),
                error: null,
              })),
            })),
          })),
        })),
      }
    }

    if (table === 'promotion_campaign_daily_reports') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: number) => {
            if (column === 'campaign_id') {
              state.lastCampaignIdFilter = value
            }

            return {
              gte: vi.fn((gteColumn: string, gteValue: string) => {
                if (gteColumn === 'report_date') {
                  state.lastDateFrom = gteValue
                }

                return {
                  lte: vi.fn((lteColumn: string, lteValue: string) => {
                    if (lteColumn === 'report_date') {
                      state.lastDateTo = lteValue
                    }

                    return {
                      order: vi.fn(() => ({
                        order: vi.fn(() => ({
                          returns: vi.fn(async () => ({
                            data: (options?.reportRows ?? []).filter((row) => {
                              if (
                                state.lastCampaignIdFilter !== null &&
                                row.campaign_id !== undefined
                              ) {
                                return row.campaign_id === state.lastCampaignIdFilter
                              }

                              return true
                            }),
                            error: null,
                          })),
                        })),
                      })),
                    }
                  }),
                }
              }),
            }
          }),
        })),
      }
    }

    if (table === 'restaurants') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data:
                options?.restaurantTarget === undefined
                  ? { id: 55, name: 'Banter NYC' }
                  : options.restaurantTarget,
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
                options?.eventTarget === undefined
                  ? { id: 12, restaurant_name: 'Banter NYC', title: 'Thursday Table' }
                  : options.eventTarget,
              error: null,
            })),
          })),
        })),
      }
    }

    throw new Error(`Unexpected table mock: ${table}`)
  })

  return { from, state }
}

describe('admin campaign report routes', () => {
  beforeEach(() => {
    requireAdminOrCronMock.mockReset()
    createServerSupabaseAdminClientMock.mockReset()
  })

  it('rejects non-admin access to report data and CSV export before service-role access', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      error: new Response(JSON.stringify({ error: 'Admin access only.' }), { status: 403 }),
    })

    const reportRoute = await import('@/app/api/admin/campaigns/[campaignId]/report/route')
    const csvRoute = await import('@/app/api/admin/campaigns/[campaignId]/report/csv/route')

    const reportResponse = await reportRoute.GET(
      new Request('http://localhost/api/admin/campaigns/9/report'),
      { params: Promise.resolve({ campaignId: '9' }) }
    )
    const csvResponse = await csvRoute.GET(
      new Request('http://localhost/api/admin/campaigns/9/report/csv'),
      { params: Promise.resolve({ campaignId: '9' }) }
    )

    expect(reportResponse.status).toBe(403)
    expect(csvResponse.status).toBe(403)
    expect(createServerSupabaseAdminClientMock).not.toHaveBeenCalled()
  })

  it('returns only rows for the requested campaign and applies inclusive date filters', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    const adminClient = buildAdminClient({
      reportRows: [
        {
          campaign_id: 9,
          event_view_count: 0,
          impression_count: 10,
          report_date: '2026-07-01',
          rsvp_count: 0,
          save_count: 2,
          surface: 'restaurant_search',
          venue_profile_view_count: 4,
          website_click_count: 1,
        },
        {
          campaign_id: 8,
          event_view_count: 0,
          impression_count: 999,
          report_date: '2026-07-01',
          rsvp_count: 0,
          save_count: 999,
          surface: 'restaurant_search',
          venue_profile_view_count: 999,
          website_click_count: 999,
        },
        {
          campaign_id: 9,
          event_view_count: 0,
          impression_count: 5,
          report_date: '2026-07-31',
          rsvp_count: 0,
          save_count: 1,
          surface: 'restaurant_category',
          venue_profile_view_count: 3,
          website_click_count: 2,
        },
      ],
    })
    createServerSupabaseAdminClientMock.mockReturnValue(adminClient)

    const route = await import('@/app/api/admin/campaigns/[campaignId]/report/route')
    const response = await route.GET(
      new Request(
        'http://localhost/api/admin/campaigns/9/report?dateFrom=2026-07-01&dateTo=2026-07-31'
      ),
      { params: Promise.resolve({ campaignId: '9' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(adminClient.state.lastCampaignIdFilter).toBe(9)
    expect(adminClient.state.lastDateFrom).toBe('2026-07-01')
    expect(adminClient.state.lastDateTo).toBe('2026-07-31')
    expect(payload.report.rows).toHaveLength(2)
    expect(payload.report.rows.map((row: { report_date: string }) => row.report_date)).toEqual([
      '2026-07-01',
      '2026-07-31',
    ])
  })

  it('rejects invalid report date ranges', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(buildAdminClient())

    const route = await import('@/app/api/admin/campaigns/[campaignId]/report/route')
    const response = await route.GET(
      new Request(
        'http://localhost/api/admin/campaigns/9/report?dateFrom=2026-07-31&dateTo=2026-07-01'
      ),
      { params: Promise.resolve({ campaignId: '9' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('dateFrom cannot be after dateTo.')
  })

  it('returns aggregated totals from daily report rows', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(
      buildAdminClient({
        reportRows: [
          {
            campaign_id: 9,
            event_view_count: 0,
            impression_count: 10,
            report_date: '2026-07-01',
            rsvp_count: 0,
            save_count: 2,
            surface: 'restaurant_search',
            venue_profile_view_count: 4,
            website_click_count: 1,
          },
          {
            campaign_id: 9,
            event_view_count: 0,
            impression_count: 5,
            report_date: '2026-07-02',
            rsvp_count: 0,
            save_count: 1,
            surface: 'restaurant_category',
            venue_profile_view_count: 3,
            website_click_count: 2,
          },
        ],
      })
    )

    const route = await import('@/app/api/admin/campaigns/[campaignId]/report/route')
    const response = await route.GET(
      new Request('http://localhost/api/admin/campaigns/9/report'),
      { params: Promise.resolve({ campaignId: '9' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.report.totals).toEqual({
      event_view_count: 0,
      impression_count: 15,
      rsvp_count: 0,
      save_count: 3,
      venue_profile_view_count: 7,
      website_click_count: 3,
    })
  })

  it('exports CSV only for the selected campaign date range with a stable filename', async () => {
    requireAdminOrCronMock.mockResolvedValue({
      kind: 'admin',
      user: { email: 'admin@example.com', id: 'admin-1' },
    })
    createServerSupabaseAdminClientMock.mockReturnValue(
      buildAdminClient({
        reportRows: [
          {
            campaign_id: 9,
            event_view_count: 0,
            impression_count: 10,
            report_date: '2026-07-01',
            rsvp_count: 0,
            save_count: 2,
            surface: 'restaurant_search',
            venue_profile_view_count: 4,
            website_click_count: 1,
          },
        ],
      })
    )

    const route = await import('@/app/api/admin/campaigns/[campaignId]/report/csv/route')
    const response = await route.GET(
      new Request(
        'http://localhost/api/admin/campaigns/9/report/csv?dateFrom=2026-07-01&dateTo=2026-07-31'
      ),
      { params: Promise.resolve({ campaignId: '9' }) }
    )
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/csv')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="campaign-report-9-campaign-2026-07-01-to-2026-07-31.csv"'
    )
    expect(text).toContain('Campaign name,Campaign type,Campaign status,Target name,Report date,Surface,Impressions,Venue profile views,Event views,Saves,RSVPs,Website clicks')
    expect(text).toContain('2026-07-01,restaurant_search,10,4,0,2,0,1')
    expect(text).not.toContain('999')
  })
})
