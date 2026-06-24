import { describe, expect, it } from 'vitest'

import {
  normalizePromotionSurfaces,
  validateCampaignAction,
  validateCampaignDraft,
} from '@/lib/advertising'

describe('advertising campaign validation', () => {
  it('rejects promoted_event campaigns without an event target', () => {
    const error = validateCampaignDraft({
      campaignType: 'promoted_event',
      endsOn: '2026-07-10',
      eventId: null,
      nextStatus: 'draft',
      promotionPriority: 0,
      restaurantId: null,
      startsOn: '2026-07-01',
      surfaces: [],
    })

    expect(error).toBe('Promoted event campaigns must target exactly one event.')
  })

  it('rejects restaurant campaigns that use event surfaces', () => {
    const error = validateCampaignDraft({
      campaignType: 'sponsored_listing',
      endsOn: '2026-07-10',
      eventId: null,
      nextStatus: 'draft',
      promotionPriority: 0,
      restaurantId: 22,
      startsOn: '2026-07-01',
      surfaces: ['event_list'],
    })

    expect(error).toContain('Selected surfaces are not compatible')
  })

  it('requires at least one surface before a campaign becomes active', () => {
    const error = validateCampaignDraft({
      campaignType: 'founding_partner',
      endsOn: '2026-07-10',
      eventId: null,
      nextStatus: 'active',
      promotionPriority: 0,
      restaurantId: 7,
      startsOn: '2026-07-01',
      surfaces: [],
    })

    expect(error).toBe(
      'A campaign must have at least one configured surface before it can become active.'
    )
  })

  it('requires at least one currently live compatible surface before activation', () => {
    const error = validateCampaignDraft({
      campaignType: 'promoted_event',
      endsOn: '2026-07-10',
      eventId: 7,
      nextStatus: 'active',
      promotionPriority: 0,
      restaurantId: null,
      startsOn: '2026-07-01',
      surfaces: ['event_explore', 'event_recommendations'],
    })

    expect(error).toBe(
      'A campaign must have at least one currently live compatible surface before it can become active.'
    )
  })

  it('allows activation when an event campaign includes the live event_list surface', () => {
    const error = validateCampaignDraft({
      campaignType: 'promoted_event',
      endsOn: '2026-07-10',
      eventId: 7,
      nextStatus: 'active',
      promotionPriority: 0,
      restaurantId: null,
      startsOn: '2026-07-01',
      surfaces: ['event_explore', 'event_list'],
    })

    expect(error).toBeNull()
  })

  it('prevents ended campaigns from being reactivated', () => {
    const error = validateCampaignAction({
      action: 'reactivate',
      currentStatus: 'ended',
    })

    expect(error).toBe('Ended campaigns cannot be reactivated. Create a new campaign instead.')
  })

  it('deduplicates and filters surface input', () => {
    expect(
      normalizePromotionSurfaces([
        'restaurant_search',
        'restaurant_search',
        'bad_surface',
        'event_list',
      ])
    ).toEqual(['restaurant_search', 'event_list'])
  })
})
