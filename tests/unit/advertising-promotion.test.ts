import { describe, expect, it } from 'vitest'

import {
  compareEntitiesWithPromotion,
  getPromotionDisclosureForSurfaces,
} from '@/lib/advertising-ordering'
import {
  attachPromotionMetadata,
  buildResolvedPromotionRecords,
  mergeOrganicAndPromotedRows,
} from '@/lib/advertising-resolver'
import {
  getCurrentDateKeyInNewYork,
  getDefaultCampaignEndDate,
  getDefaultCampaignStartDate,
} from '@/lib/advertising-dates'

type RankedEntity = {
  id: number
  organicRank: number
  promotionPriorities?: {
    event_explore?: number
    event_list?: number
    event_recommendations?: number
    restaurant_category?: number
    restaurant_neighbourhood?: number
    restaurant_recommendations?: number
    restaurant_search?: number
  } | null
  promotionDisclosures?: {
    event_explore?: 'Founding Partner' | 'Sponsored'
    event_list?: 'Founding Partner' | 'Sponsored'
    event_recommendations?: 'Founding Partner' | 'Sponsored'
    restaurant_category?: 'Founding Partner' | 'Sponsored'
    restaurant_neighbourhood?: 'Founding Partner' | 'Sponsored'
    restaurant_recommendations?: 'Founding Partner' | 'Sponsored'
    restaurant_search?: 'Founding Partner' | 'Sponsored'
  } | null
}

describe('advertising promotion helpers', () => {
  it('resolves multiple campaigns for one target and surface deterministically', () => {
    const resolved = buildResolvedPromotionRecords(
      [
        {
          campaign_type: 'sponsored_listing',
          id: 12,
          promotion_campaign_surfaces: [{ surface: 'restaurant_search' }],
          promotion_priority: 3,
          restaurant_id: 44,
          starts_on: '2026-07-05',
        },
        {
          campaign_type: 'founding_partner',
          id: 8,
          promotion_campaign_surfaces: [{ surface: 'restaurant_search' }],
          promotion_priority: 3,
          restaurant_id: 44,
          starts_on: '2026-07-01',
        },
        {
          campaign_type: 'sponsored_listing',
          id: 6,
          promotion_campaign_surfaces: [{ surface: 'restaurant_search' }],
          promotion_priority: 5,
          restaurant_id: 44,
          starts_on: '2026-07-10',
        },
      ],
      'restaurant'
    )

    expect(resolved).toEqual([
      {
        promotionPriorities: {
          restaurant_search: 5,
        },
        promotionDisclosures: {
          restaurant_search: 'Sponsored',
        },
        targetId: 44,
      },
    ])
  })

  it('ignores deferred non-live surfaces in resolved placement metadata', () => {
    const resolved = buildResolvedPromotionRecords(
      [
        {
          campaign_type: 'promoted_event',
          event_id: 91,
          id: 4,
          promotion_campaign_surfaces: [
            { surface: 'event_explore' },
            { surface: 'event_recommendations' },
          ],
          promotion_priority: 9,
          starts_on: '2026-07-01',
        },
        {
          campaign_type: 'promoted_event',
          event_id: 91,
          id: 5,
          promotion_campaign_surfaces: [{ surface: 'event_list' }],
          promotion_priority: 4,
          starts_on: '2026-07-01',
        },
      ],
      'event'
    )

    expect(resolved).toEqual([
      {
        promotionPriorities: {
          event_list: 4,
        },
        promotionDisclosures: {
          event_list: 'Sponsored',
        },
        targetId: 91,
      },
    ])
  })

  it('merges organic and promoted candidates without duplicates', () => {
    expect(
      mergeOrganicAndPromotedRows(
        [{ id: 1, name: 'Organic A' }, { id: 2, name: 'Organic B' }],
        [{ id: 2, name: 'Promoted B' }, { id: 3, name: 'Promoted C' }]
      )
    ).toEqual([
      { id: 1, name: 'Organic A' },
      { id: 2, name: 'Organic B' },
      { id: 3, name: 'Promoted C' },
    ])
  })

  it('attaches only consumer-safe promotion priority metadata', () => {
    const rows = attachPromotionMetadata(
      [{ id: 7, name: 'Venue' }],
      [
        {
          promotionDisclosures: { restaurant_search: 'Sponsored' },
          promotionPriorities: { restaurant_search: 6 },
          targetId: 7,
        },
      ]
    )

    expect(rows).toEqual([
      {
        id: 7,
        name: 'Venue',
        promotionDisclosures: {
          restaurant_search: 'Sponsored',
        },
        promotionPriorities: {
          restaurant_search: 6,
        },
      },
    ])
    expect(JSON.stringify(rows)).not.toContain('campaign_id')
    expect(JSON.stringify(rows)).not.toContain('campaign_type')
    expect(JSON.stringify(rows)).not.toContain('internal_notes')
    expect(JSON.stringify(rows)).not.toContain('campaignStatus')
    expect(JSON.stringify(rows)).not.toContain('campaignStartsOn')
    expect(JSON.stringify(rows)).not.toContain('campaignEndsOn')
  })

  it('derives the active campaign date from the New York calendar near UTC midnight', () => {
    expect(getCurrentDateKeyInNewYork(new Date('2026-07-01T00:30:00.000Z'))).toBe('2026-06-30')
    expect(getCurrentDateKeyInNewYork(new Date('2026-07-01T04:30:00.000Z'))).toBe('2026-07-01')
  })

  it('derives New York campaign form defaults near a UTC date boundary', () => {
    const reference = new Date('2026-07-01T00:30:00.000Z')

    expect(getDefaultCampaignStartDate(reference)).toBe('2026-06-30')
    expect(getDefaultCampaignEndDate(reference)).toBe('2026-07-14')
  })

  it('returns Sponsored only for an applicable sponsored current surface', () => {
    expect(
      getPromotionDisclosureForSurfaces(
        {
          restaurant_category: 3,
          restaurant_search: 7,
        },
        {
          restaurant_category: 'Founding Partner',
          restaurant_search: 'Sponsored',
        },
        ['restaurant_search']
      )
    ).toBe('Sponsored')
  })

  it('returns Founding Partner only for an applicable founding-partner current surface', () => {
    expect(
      getPromotionDisclosureForSurfaces(
        {
          restaurant_recommendations: 8,
          restaurant_search: 2,
        },
        {
          restaurant_recommendations: 'Founding Partner',
          restaurant_search: 'Sponsored',
        },
        ['restaurant_recommendations']
      )
    ).toBe('Founding Partner')
  })

  it('returns no disclosure for wrong-surface or inactive metadata', () => {
    expect(
      getPromotionDisclosureForSurfaces(
        { restaurant_search: 5 },
        { restaurant_search: 'Sponsored' },
        ['restaurant_category']
      )
    ).toBeNull()
  })

  it('preserves exact organic ordering when no promotion applies', () => {
    const items: RankedEntity[] = [
      { id: 20, organicRank: 1 },
      { id: 10, organicRank: 2 },
      { id: 30, organicRank: 3 },
    ]

    const sorted = [...items].sort((left, right) =>
      compareEntitiesWithPromotion<RankedEntity>(left, right, {
        organicCompare: (organicLeft, organicRight) =>
          organicLeft.organicRank - organicRight.organicRank,
        surfaces: ['restaurant_search'],
      })
    )

    expect(sorted.map((item) => item.id)).toEqual([20, 10, 30])
  })

  it('uses the highest applicable surface priority for restaurant ordering', () => {
    const sorted: RankedEntity[] = [
      {
        id: 1,
        organicRank: 2,
        promotionPriorities: {
          restaurant_category: 8,
          restaurant_search: 3,
        },
      },
      {
        id: 2,
        organicRank: 1,
        promotionPriorities: {
          restaurant_search: 5,
        },
      },
      {
        id: 3,
        organicRank: 0,
      },
    ].sort((left, right) =>
      compareEntitiesWithPromotion<RankedEntity>(left, right, {
        organicCompare: (organicLeft, organicRight) =>
          organicLeft.organicRank - organicRight.organicRank,
        surfaces: ['restaurant_search', 'restaurant_category'],
      })
    )

    expect(sorted.map((item) => item.id)).toEqual([1, 2, 3])
  })
})
