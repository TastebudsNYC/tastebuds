/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CampaignReportView } from '@/components/admin/CampaignReportView'
import type { CampaignReportResponse } from '@/lib/admin-campaign-report'

function buildReport(
  campaignType: CampaignReportResponse['campaign']['campaign_type'],
  rows: CampaignReportResponse['rows'] = []
): CampaignReportResponse {
  return {
    campaign: {
      campaign_type: campaignType,
      ends_on: '2026-07-31',
      id: 8,
      name: 'Campaign',
      promotion_priority: 1,
      starts_on: '2026-07-01',
      status: 'active',
      surfaces:
        campaignType === 'promoted_event' ? ['event_list'] : ['restaurant_search'],
      target_label:
        campaignType === 'promoted_event' ? 'Promoted event' : 'Promoted restaurant',
      target_name:
        campaignType === 'promoted_event'
          ? 'Thursday Table | Banter NYC'
          : 'Banter NYC',
      target_type: campaignType === 'promoted_event' ? 'event' : 'restaurant',
    },
    rows,
    selected_from: '2026-07-01',
    selected_to: '2026-07-31',
    totals: {
      event_view_count: 7,
      impression_count: 20,
      rsvp_count: 4,
      save_count: 3,
      venue_profile_view_count: 6,
      website_click_count: 5,
    },
  }
}

describe('CampaignReportView', () => {
  it('shows only relevant restaurant summary metrics', () => {
    render(
      <CampaignReportView
        dateFrom="2026-07-01"
        dateTo="2026-07-31"
        downloadLabel="Export CSV"
        downloading={false}
        error=""
        loading={false}
        onDateFromChange={() => {}}
        onDateToChange={() => {}}
        onDownload={() => {}}
        onSubmit={() => {}}
        report={buildReport('founding_partner')}
      />
    )

    expect(screen.getByText('Venue profile views')).toBeInTheDocument()
    expect(screen.getByText('Saves')).toBeInTheDocument()
    expect(screen.queryByText('Event views')).toBeNull()
    expect(screen.queryByText('RSVPs')).toBeNull()
  })

  it('shows only relevant event summary metrics', () => {
    render(
      <CampaignReportView
        dateFrom="2026-07-01"
        dateTo="2026-07-31"
        downloadLabel="Export CSV"
        downloading={false}
        error=""
        loading={false}
        onDateFromChange={() => {}}
        onDateToChange={() => {}}
        onDownload={() => {}}
        onSubmit={() => {}}
        report={buildReport('promoted_event')}
      />
    )

    expect(screen.getByText('Event views')).toBeInTheDocument()
    expect(screen.getByText('RSVPs')).toBeInTheDocument()
    expect(screen.queryByText('Venue profile views')).toBeNull()
    expect(screen.queryByText('Saves')).toBeNull()
  })

  it('shows a useful empty state when no report rows exist', () => {
    render(
      <CampaignReportView
        dateFrom="2026-07-01"
        dateTo="2026-07-31"
        downloadLabel="Export CSV"
        downloading={false}
        error=""
        loading={false}
        onDateFromChange={() => {}}
        onDateToChange={() => {}}
        onDownload={() => {}}
        onSubmit={() => {}}
        report={buildReport('founding_partner', [])}
      />
    )

    expect(
      screen.getByText(
        'No attributed activity has been recorded for this campaign in the selected date range yet.'
      )
    ).toBeInTheDocument()
  })
})
