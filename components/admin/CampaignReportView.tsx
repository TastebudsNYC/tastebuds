'use client'

import type {
  CampaignReportResponse,
} from '@/lib/admin-campaign-report'
import { getCampaignReportSummaryMetrics } from '@/lib/admin-campaign-report'

function formatCampaignType(value: CampaignReportResponse['campaign']['campaign_type']) {
  return value
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function formatCampaignStatus(value: CampaignReportResponse['campaign']['status']) {
  return value[0]?.toUpperCase() + value.slice(1)
}

export function CampaignReportView({
  dateFrom,
  dateTo,
  downloadLabel,
  downloading,
  error,
  loading,
  onDateFromChange,
  onDateToChange,
  onDownload,
  onSubmit,
  report,
}: {
  dateFrom: string
  dateTo: string
  downloadLabel: string
  downloading: boolean
  error: string
  loading: boolean
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onDownload: () => void
  onSubmit: () => void
  report: CampaignReportResponse | null
}) {
  const summaryMetrics = report
    ? getCampaignReportSummaryMetrics(report.campaign.campaign_type)
    : []

  return (
    <section className="mt-8 rounded-[1.75rem] border border-zinc-200 bg-white p-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Campaign report
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {report ? report.campaign.name : 'Loading report...'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">
            Review daily attributed performance and export the selected date range as CSV.
          </p>
        </div>
        <button
          className="rounded-xl border border-zinc-950 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
          disabled={downloading || loading || !report}
          onClick={onDownload}
          type="button"
        >
          {downloadLabel}
        </button>
      </div>

      {report ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Campaign type
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {formatCampaignType(report.campaign.campaign_type)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Status</p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {formatCampaignStatus(report.campaign.status)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              {report.campaign.target_label}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {report.campaign.target_name}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
              Date range
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {report.campaign.starts_on} to {report.campaign.ends_on}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Priority</p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {report.campaign.promotion_priority}
            </p>
          </div>
          <div className="sm:col-span-2 xl:col-span-3">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Surfaces</p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {report.campaign.surfaces.length > 0
                ? report.campaign.surfaces.join(', ')
                : 'No surfaces configured'}
            </p>
          </div>
        </div>
      ) : null}

      <form
        className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Date from
          </span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
            onChange={(event) => onDateFromChange(event.target.value)}
            type="date"
            value={dateFrom}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Date to
          </span>
          <input
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
            onChange={(event) => onDateToChange(event.target.value)}
            type="date"
            value={dateTo}
          />
        </label>
        <div className="flex items-end">
          <button
            className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Loading...' : 'Apply range'}
          </button>
        </div>
      </form>

      {report ? (
        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-4"
                key={metric.field}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  {report.totals[metric.field]}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200">
            {report.rows.length === 0 ? (
              <div className="bg-zinc-50 px-5 py-8 text-sm text-zinc-600">
                No attributed activity has been recorded for this campaign in the selected date range yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Surface</th>
                      <th className="px-4 py-3 font-medium">Impressions</th>
                      <th className="px-4 py-3 font-medium">Venue profile views</th>
                      <th className="px-4 py-3 font-medium">Event views</th>
                      <th className="px-4 py-3 font-medium">Saves</th>
                      <th className="px-4 py-3 font-medium">RSVPs</th>
                      <th className="px-4 py-3 font-medium">Website clicks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white text-zinc-900">
                    {report.rows.map((row) => (
                      <tr key={`${row.report_date}:${row.surface}`}>
                        <td className="px-4 py-3">{row.report_date}</td>
                        <td className="px-4 py-3">{row.surface}</td>
                        <td className="px-4 py-3">{row.impression_count}</td>
                        <td className="px-4 py-3">{row.venue_profile_view_count}</td>
                        <td className="px-4 py-3">{row.event_view_count}</td>
                        <td className="px-4 py-3">{row.save_count}</td>
                        <td className="px-4 py-3">{row.rsvp_count}</td>
                        <td className="px-4 py-3">{row.website_click_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
