import type {
  CampaignStatus,
  CampaignType,
  PromotionSurface,
} from '@/lib/advertising'

type CampaignReportMetricField =
  | 'event_view_count'
  | 'impression_count'
  | 'rsvp_count'
  | 'save_count'
  | 'venue_profile_view_count'
  | 'website_click_count'

type CampaignReportMetricDefinition = {
  field: CampaignReportMetricField
  label: string
}

type CampaignReportDailyRow = {
  event_view_count: number
  impression_count: number
  report_date: string
  rsvp_count: number
  save_count: number
  surface: PromotionSurface
  venue_profile_view_count: number
  website_click_count: number
}

type CampaignReportOverview = {
  campaign_type: CampaignType
  ends_on: string
  id: number
  name: string
  promotion_priority: number
  starts_on: string
  status: CampaignStatus
  surfaces: PromotionSurface[]
  target_label: string
  target_name: string
  target_type: 'event' | 'restaurant'
}

type CampaignReportTotals = Omit<CampaignReportDailyRow, 'report_date' | 'surface'>

type CampaignReportResponse = {
  campaign: CampaignReportOverview
  rows: CampaignReportDailyRow[]
  selected_from: string
  selected_to: string
  totals: CampaignReportTotals
}

const REPORT_METRICS: readonly CampaignReportMetricDefinition[] = [
  { field: 'impression_count', label: 'Impressions' },
  { field: 'venue_profile_view_count', label: 'Venue profile views' },
  { field: 'event_view_count', label: 'Event views' },
  { field: 'save_count', label: 'Saves' },
  { field: 'rsvp_count', label: 'RSVPs' },
  { field: 'website_click_count', label: 'Website clicks' },
] as const

const RESTAURANT_SUMMARY_METRICS: readonly CampaignReportMetricField[] = [
  'impression_count',
  'venue_profile_view_count',
  'save_count',
  'website_click_count',
] as const

const EVENT_SUMMARY_METRICS: readonly CampaignReportMetricField[] = [
  'impression_count',
  'event_view_count',
  'rsvp_count',
  'website_click_count',
] as const

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export type {
  CampaignReportDailyRow,
  CampaignReportMetricDefinition,
  CampaignReportMetricField,
  CampaignReportOverview,
  CampaignReportResponse,
  CampaignReportTotals,
}

export function aggregateCampaignReportTotals(
  rows: CampaignReportDailyRow[]
): CampaignReportTotals {
  return rows.reduce<CampaignReportTotals>(
    (totals, row) => ({
      event_view_count: totals.event_view_count + row.event_view_count,
      impression_count: totals.impression_count + row.impression_count,
      rsvp_count: totals.rsvp_count + row.rsvp_count,
      save_count: totals.save_count + row.save_count,
      venue_profile_view_count:
        totals.venue_profile_view_count + row.venue_profile_view_count,
      website_click_count: totals.website_click_count + row.website_click_count,
    }),
    {
      event_view_count: 0,
      impression_count: 0,
      rsvp_count: 0,
      save_count: 0,
      venue_profile_view_count: 0,
      website_click_count: 0,
    }
  )
}

export function getCampaignReportSummaryMetrics(campaignType: CampaignType) {
  const allowedFields =
    campaignType === 'promoted_event'
      ? new Set<CampaignReportMetricField>(EVENT_SUMMARY_METRICS)
      : new Set<CampaignReportMetricField>(RESTAURANT_SUMMARY_METRICS)

  return REPORT_METRICS.filter((metric) => allowedFields.has(metric.field))
}

export function validateCampaignReportDateRange(from: string, to: string) {
  if (!isDateOnly(from) || !isDateOnly(to)) {
    return 'Date filters must use YYYY-MM-DD format.'
  }

  if (from > to) {
    return 'dateFrom cannot be after dateTo.'
  }

  return null
}

function protectCsvCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

export function escapeCsvCell(value: string | number) {
  const normalized = protectCsvCell(String(value))

  if (
    normalized.includes(',') ||
    normalized.includes('"') ||
    normalized.includes('\n') ||
    normalized.includes('\r')
  ) {
    return `"${normalized.replaceAll('"', '""')}"`
  }

  return normalized
}

function slugifyFilenamePart(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'campaign'
}

export function buildCampaignReportCsvFilename(input: {
  campaignId: number
  campaignName: string
  dateFrom: string
  dateTo: string
}) {
  return `campaign-report-${input.campaignId}-${slugifyFilenamePart(
    input.campaignName
  )}-${input.dateFrom}-to-${input.dateTo}.csv`
}

export function buildCampaignReportCsv(report: CampaignReportResponse) {
  const headers = [
    'Campaign name',
    'Campaign type',
    'Campaign status',
    'Target name',
    'Report date',
    'Surface',
    'Impressions',
    'Venue profile views',
    'Event views',
    'Saves',
    'RSVPs',
    'Website clicks',
  ]

  const lines = [
    headers.map((header) => escapeCsvCell(header)).join(','),
    ...report.rows.map((row) =>
      [
        report.campaign.name,
        report.campaign.campaign_type,
        report.campaign.status,
        report.campaign.target_name,
        row.report_date,
        row.surface,
        row.impression_count,
        row.venue_profile_view_count,
        row.event_view_count,
        row.save_count,
        row.rsvp_count,
        row.website_click_count,
      ]
        .map((value) => escapeCsvCell(value))
        .join(',')
    ),
  ]

  return lines.join('\r\n')
}
