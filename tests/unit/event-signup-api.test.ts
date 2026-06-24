import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/events/signup/route'

const mocks = vi.hoisted(() => ({
  getUserFromAccessToken: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/event-operations', () => ({
  refreshEventViability: vi.fn(),
  syncEventSignupScores: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  queueNotifications: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdminClient: () => ({
    from: (table: string) => createQuery(table),
    rpc: mocks.rpc,
  }),
  getUserFromAccessToken: mocks.getUserFromAccessToken,
}))

function createJsonRequest(body: unknown) {
  return new Request('https://tastebuds.test/api/events/signup', {
    body: JSON.stringify(body),
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
    },
    method: 'POST',
  })
}

function createQuery(table: string) {
  const state = {
    table,
    filters: new Map<string, unknown>(),
  }

  const query = {
    eq(column: string, value: unknown) {
      state.filters.set(column, value)
      return query
    },
    maybeSingle() {
      if (state.table === 'events') {
        return Promise.resolve({
          data: {
            capacity: 4,
            duration_minutes: 120,
            id: 10,
            intent: 'friendship',
            restaurant_cuisines: ['italian'],
            restaurant_id: 55,
            restaurant_name: 'Banter NYC',
            restaurant_subregion: 'Midtown',
            starts_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: 'open',
            title: 'Dinner',
            venue_crowd: ['Mixed'],
            venue_energy: 'Moderate',
            venue_latitude: 40.7,
            venue_longitude: -73.9,
            venue_music: ['Background'],
            venue_price: '$$',
            venue_scene: ['Social'],
            venue_setting: ['Restaurant'],
          },
          error: null,
        })
      }

      if (state.table === 'event_signups') {
        return Promise.resolve({ data: null, error: null })
      }

      if (state.table === 'saved_restaurants') {
        return Promise.resolve({ data: { restaurant_id: 55 }, error: null })
      }

      return Promise.resolve({ data: null, error: null })
    },
    select() {
      return query
    },
    single() {
      if (state.table === 'event_signups') {
        return Promise.resolve({
          data: {
            personal_match_score: 82,
            personal_match_summary: 'Strong fit',
            restaurant_match_score: 79,
            status: 'going',
          },
          error: null,
        })
      }

      return Promise.resolve({ data: null, error: null })
    },
    upsert() {
      return Promise.resolve({ error: null })
    },
    update() {
      return query
    },
    then(
      resolve: (value: { count?: number | null; data?: null; error: null }) => unknown
    ) {
      if (state.table === 'event_signups' && state.filters.get('status') === 'going') {
        return Promise.resolve(resolve({ count: 0, error: null }))
      }

      return Promise.resolve(resolve({ data: null, error: null }))
    },
  }

  return query
}

describe('POST /api/events/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserFromAccessToken.mockResolvedValue({ id: 'user-1' })
    mocks.rpc.mockImplementation(async (fn: string) => {
      if (fn === 'join_event_signup_safe') {
        return {
          data: [{ error: null, ok: true, status: 'going' }],
          error: null,
        }
      }

      if (fn === 'record_promotion_campaign_metric') {
        return {
          data: true,
          error: null,
        }
      }

      return { data: null, error: null }
    })
  })

  it('records RSVP attribution only after a successful promoted join', async () => {
    const response = await POST(
      createJsonRequest({ action: 'join', eventId: 10, promotionSurface: 'event_list' })
    )
    const payload = (await response.json()) as { ok: boolean }

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(mocks.rpc).toHaveBeenCalledWith('join_event_signup_safe', {
      p_event_id: 10,
      p_user_id: 'user-1',
    })
    expect(mocks.rpc).toHaveBeenCalledWith('record_promotion_campaign_metric', {
      p_metric: 'rsvp',
      p_surface: 'event_list',
      p_target_id: 10,
      p_target_type: 'event',
    })
  })

  it('does not record RSVP attribution for leave actions or deferred surfaces', async () => {
    await POST(createJsonRequest({ action: 'leave', eventId: 10, promotionSurface: 'event_list' }))
    await POST(createJsonRequest({ action: 'join', eventId: 10, promotionSurface: 'event_explore' }))

    expect(
      mocks.rpc.mock.calls.filter(([fn]) => fn === 'record_promotion_campaign_metric')
    ).toHaveLength(0)
  })

  it('keeps a successful RSVP response even if attribution recording fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mocks.rpc.mockImplementation(async (fn: string) => {
      if (fn === 'join_event_signup_safe') {
        return {
          data: [{ error: null, ok: true, status: 'going' }],
          error: null,
        }
      }

      if (fn === 'record_promotion_campaign_metric') {
        return {
          data: null,
          error: { message: 'tracking failed' },
        }
      }

      return { data: null, error: null }
    })

    const response = await POST(
      createJsonRequest({ action: 'join', eventId: 10, promotionSurface: 'event_list' })
    )
    const payload = (await response.json()) as { ok: boolean; status: string }

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.status).toBe('going')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to record event RSVP attribution.',
      expect.any(Error)
    )
  })
})
