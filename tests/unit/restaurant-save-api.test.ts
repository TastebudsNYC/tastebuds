import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/restaurants/route'

const mocks = vi.hoisted(() => ({
  getUserFromAccessToken: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/google-places', () => ({
  getRestaurantGoogleDetails: vi.fn(),
}))

vi.mock('@/lib/venues/enrichment', () => ({
  buildVenueDataModel: vi.fn(),
  deriveVenueTraits: vi.fn(),
  mapVenueTraitsRow: vi.fn(),
}))

vi.mock('@/lib/venues/match', () => ({
  buildVenueMatchResult: vi.fn(),
  pickDistinctExplanation: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdminClient: () => ({
    from: () => createQuery(),
    rpc: mocks.rpc,
  }),
  getUserFromAccessToken: mocks.getUserFromAccessToken,
}))

function createRequest(body: unknown) {
  return new Request('https://tastebuds.test/api/restaurants', {
    body: JSON.stringify(body),
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}

function createQuery() {
  const filters = new Map<string, unknown>()

  const query = {
    delete: vi.fn(() => query),
    eq(column: string, value: unknown) {
      filters.set(column, value)
      return query
    },
    insert: vi.fn(async () => ({ error: null })),
    then(resolve: (value: { error: null }) => unknown) {
      return Promise.resolve(resolve({ error: null }))
    },
  }

  return query
}

describe('POST /api/restaurants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserFromAccessToken.mockResolvedValue({ id: 'user-1' })
    mocks.rpc.mockResolvedValue({ data: true, error: null })
  })

  it('records a save attribution only after a successful promoted save', async () => {
    const response = await POST(
      createRequest({
        action: 'save',
        promotionSurface: 'restaurant_search',
        restaurantId: 55,
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('record_promotion_campaign_metric', {
      p_metric: 'save',
      p_surface: 'restaurant_search',
      p_target_id: 55,
      p_target_type: 'restaurant',
    })
  })

  it('does not record attribution for unsaves or unattributed saves', async () => {
    await POST(
      createRequest({
        action: 'save',
        restaurantId: 55,
      })
    )

    await POST(
      createRequest({
        action: 'unsave',
        promotionSurface: 'restaurant_search',
        restaurantId: 55,
      })
    )

    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('keeps a successful save response even if attribution recording fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'tracking failed' },
    })

    const response = await POST(
      createRequest({
        action: 'save',
        promotionSurface: 'restaurant_search',
        restaurantId: 55,
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to record restaurant save attribution.',
      expect.any(Error)
    )
  })
})
