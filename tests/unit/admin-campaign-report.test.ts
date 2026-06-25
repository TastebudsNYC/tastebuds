import { describe, expect, it } from 'vitest'

import {
  aggregateCampaignReportTotals,
  buildCampaignReportCsv,
  buildCampaignReportCsvFilename,
  getCampaignReportSummaryMetrics,
  validateCampaignReportDateRange,
} from '@/lib/admin-campaign-report'

describe('admin campaign report helpers', () => {
  it('aggregates campaign totals from daily rows', () => {
    const totals = aggregateCampaignReportTotals([
      {
        event_view_count: 0,
        impression_count: 12,
        report_date: '2026-07-01',
        rsvp_count: 0,
        save_count: 3,
        surface: 'restaurant_search',
        venue_profile_view_count: 4,
        website_click_count: 2,
      },
      {
        event_view_count: 0,
        impression_count: 8,
        report_date: '2026-07-02',
        rsvp_count: 0,
        save_count: 1,
        surface: 'restaurant_category',
        venue_profile_view_count: 5,
        website_click_count: 6,
      },
    ])

    expect(totals).toEqual({
      event_view_count: 0,
      impression_count: 20,
      rsvp_count: 0,
      save_count: 4,
      venue_profile_view_count: 9,
      website_click_count: 8,
    })
  })

  it('validates inclusive report date ranges', () => {
    expect(validateCampaignReportDateRange('2026-07-01', '2026-07-31')).toBeNull()
    expect(validateCampaignReportDateRange('2026-07-31', '2026-07-01')).toBe(
      'dateFrom cannot be after dateTo.'
    )
  })

  it('returns only relevant summary metrics for restaurant and event campaigns', () => {
    expect(
      getCampaignReportSummaryMetrics('founding_partner').map((metric) => metric.label)
    ).toEqual([
      'Impressions',
      'Venue profile views',
      'Saves',
      'Website clicks',
    ])

    expect(
      getCampaignReportSummaryMetrics('promoted_event').map((metric) => metric.label)
    ).toEqual([
      'Impressions',
      'Event views',
      'RSVPs',
      'Website clicks',
    ])
  })

  it('builds CSV rows with safe escaping for commas, quotes, line breaks, and spreadsheet prefixes', () => {
    const csv = buildCampaignReportCsv({
      campaign: {
        campaign_type: 'founding_partner',
        ends_on: '2026-07-31',
        id: 4,
        name: '=Venue, "North"\nLaunch',
        promotion_priority: 2,
        starts_on: '2026-07-01',
        status: 'active',
        surfaces: ['restaurant_search'],
        target_label: 'Promoted restaurant',
        target_name: '+Banter "Downtown"',
        target_type: 'restaurant',
      },
      rows: [
        {
          event_view_count: 0,
          impression_count: 10,
          report_date: '2026-07-01',
          rsvp_count: 0,
          save_count: 1,
          surface: 'restaurant_search',
          venue_profile_view_count: 2,
          website_click_count: 3,
        },
      ],
      selected_from: '2026-07-01',
      selected_to: '2026-07-31',
      totals: {
        event_view_count: 0,
        impression_count: 10,
        rsvp_count: 0,
        save_count: 1,
        venue_profile_view_count: 2,
        website_click_count: 3,
      },
    })

    expect(csv).toContain(`"'=Venue, ""North""\nLaunch"`)
    expect(csv).toContain(`"'+Banter ""Downtown"""`)
  })

  it('builds a CSV filename with campaign id, slugged name, and selected range', () => {
    expect(
      buildCampaignReportCsvFilename({
        campaignId: 42,
        campaignName: 'West Village Founding Partner',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
      })
    ).toBe(
      'campaign-report-42-west-village-founding-partner-2026-07-01-to-2026-07-31.csv'
    )
  })
})
