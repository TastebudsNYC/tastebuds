import { describe, expect, it, vi, beforeEach } from 'vitest'

import { POST } from '@/app/api/advertising/track/route'

const mocks = vi.hoisted(() => ({
  getUserFromAccessToken: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdminClient: () => ({
    rpc: mocks.rpc,
  }),
  getUserFromAccessToken: mocks.getUserFromAccessToken,
}))

function createRequest(body: unknown, headers?: HeadersInit) {
  return new Request('https://tastebuds.test/api/advertising/track', {
    body: JSON.stringify(body),
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
      ...(headers ?? {}),
    },
    method: 'POST',
  })
}

describe('POST /api/advertising/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserFromAccessToken.mockResolvedValue({ id: 'user-1' })
    mocks.rpc.mockResolvedValue({ data: true, error: null })
  })

  it('requires a bearer token', async () => {
    const response = await POST(
      new Request('https://tastebuds.test/api/advertising/track', {
        body: JSON.stringify({}),
        method: 'POST',
      })
    )

    expect(response.status).toBe(401)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects deferred or invalid surfaces before any service-role tracking call', async () => {
    const response = await POST(
      createRequest({
        metric: 'impression',
        surface: 'restaurant_recommendations',
        targetId: 5,
        targetType: 'restaurant',
      })
    )

    expect(response.status).toBe(400)
    expect(mocks.getUserFromAccessToken).not.toHaveBeenCalled()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('rejects mutation-only metrics from the public tracking route', async () => {
    const saveResponse = await POST(
      createRequest({
        metric: 'save',
        surface: 'restaurant_search',
        targetId: 5,
        targetType: 'restaurant',
      })
    )
    const rsvpResponse = await POST(
      createRequest({
        metric: 'rsvp',
        surface: 'event_list',
        targetId: 7,
        targetType: 'event',
      })
    )

    expect(saveResponse.status).toBe(400)
    expect(rsvpResponse.status).toBe(400)
    expect(mocks.getUserFromAccessToken).not.toHaveBeenCalled()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('accepts only target-compatible public metrics', async () => {
    const restaurantResponse = await POST(
      createRequest({
        metric: 'event_view',
        surface: 'restaurant_search',
        targetId: 5,
        targetType: 'restaurant',
      })
    )
    const eventResponse = await POST(
      createRequest({
        metric: 'venue_profile_view',
        surface: 'event_list',
        targetId: 7,
        targetType: 'event',
      })
    )

    expect(restaurantResponse.status).toBe(400)
    expect(eventResponse.status).toBe(400)
    expect(mocks.getUserFromAccessToken).not.toHaveBeenCalled()
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('records a valid live restaurant impression through the tracking function and returns a generic response', async () => {
    const response = await POST(
      createRequest({
        metric: 'impression',
        surface: 'restaurant_search',
        targetId: 5,
        targetType: 'restaurant',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(mocks.rpc).toHaveBeenCalledWith('record_promotion_campaign_metric', {
      p_metric: 'impression',
      p_surface: 'restaurant_search',
      p_target_id: 5,
      p_target_type: 'restaurant',
    })
  })

  it('swallows internal tracking errors behind a safe generic response', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { message: 'detailed internal db failure' },
    })

    const response = await POST(
      createRequest({
        metric: 'website_click',
        surface: 'event_list',
        targetId: 7,
        targetType: 'event',
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(JSON.stringify(payload)).not.toContain('detailed internal db failure')
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
