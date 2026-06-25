'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { CampaignReportView } from '@/components/admin/CampaignReportView'
import type { CampaignReportResponse } from '@/lib/admin-campaign-report'
import { supabase } from '@/lib/supabase/client'

type CampaignReportPayload = {
  error?: string
  report?: CampaignReportResponse
}

export function AdminCampaignReportPage({ campaignId }: { campaignId: number }) {
  const router = useRouter()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<CampaignReportResponse | null>(null)

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token ?? null
  }

  const loadReport = useCallback(
    async (nextRange?: { dateFrom?: string; dateTo?: string }) => {
      setLoading(true)
      setError('')

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.replace('/login')
          return
        }

        const accessToken = await getAccessToken()

        if (!accessToken) {
          throw new Error('Missing active session. Log in again.')
        }

        const searchParams = new URLSearchParams()

        if (nextRange?.dateFrom) {
          searchParams.set('dateFrom', nextRange.dateFrom)
        }

        if (nextRange?.dateTo) {
          searchParams.set('dateTo', nextRange.dateTo)
        }

        const response = await fetch(
          `/api/admin/campaigns/${campaignId}/report${
            searchParams.size > 0 ? `?${searchParams.toString()}` : ''
          }`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        const payload = (await response.json()) as CampaignReportPayload

        if (!response.ok || payload.error || !payload.report) {
          throw new Error(payload.error ?? 'Could not load campaign report.')
        }

        setReport(payload.report)
        setDateFrom(payload.report.selected_from)
        setDateTo(payload.report.selected_to)
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Could not load campaign report.'
        )
      } finally {
        setLoading(false)
      }
    },
    [campaignId, router]
  )

  async function downloadCsv() {
    setDownloading(true)
    setError('')

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error('Missing active session. Log in again.')
      }

      const searchParams = new URLSearchParams({
        dateFrom,
        dateTo,
      })
      const response = await fetch(
        `/api/admin/campaigns/${campaignId}/report/csv?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error ?? 'Could not export campaign report.')
      }

      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const contentDisposition = response.headers.get('content-disposition') ?? ''
      const filenameMatch = /filename="([^"]+)"/i.exec(contentDisposition)
      const filename = filenameMatch?.[1] ?? `campaign-report-${campaignId}.csv`
      const anchor = document.createElement('a')
      anchor.href = href
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(href)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Could not export campaign report.'
      )
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              Campaign reporting
            </h1>
            <p className="mt-3 max-w-3xl text-base text-zinc-600">
              Review campaign performance without exposing internal reporting to venues or consumers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-xl border border-zinc-950 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
              href="/admin/campaigns"
            >
              Back to campaigns
            </Link>
            <Link
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
              href="/admin"
            >
              Admin home
            </Link>
          </div>
        </div>

        <CampaignReportView
          dateFrom={dateFrom}
          dateTo={dateTo}
          downloading={downloading}
          downloadLabel={downloading ? 'Exporting...' : 'Export CSV'}
          error={error}
          loading={loading}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onDownload={() => void downloadCsv()}
          onSubmit={() => void loadReport({ dateFrom, dateTo })}
          report={report}
        />
      </div>
    </main>
  )
}
