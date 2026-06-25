import {
  buildCampaignReportCsv,
  buildCampaignReportCsvFilename,
} from '@/lib/admin-campaign-report'
import {
  CampaignReportRequestError,
  fetchCampaignReport,
} from '@/lib/admin-campaign-report-server'
import { requireAdminOrCron } from '@/lib/request-auth'
import { createServerSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function parseCampaignId(value: string) {
  const campaignId = Number(value)

  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    throw new CampaignReportRequestError(
      'campaignId must be a valid positive integer.',
      400
    )
  }

  return campaignId
}

export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string }> }
) {
  const adminCheck = await requireAdminOrCron(request, {
    allowAdmin: true,
    allowCron: false,
  })

  if ('error' in adminCheck) {
    return adminCheck.error
  }

  try {
    const { campaignId: campaignIdParam } = await context.params
    const campaignId = parseCampaignId(campaignIdParam)
    const { searchParams } = new URL(request.url)
    const adminClient = createServerSupabaseAdminClient()
    const report = await fetchCampaignReport(adminClient, campaignId, {
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    })
    const csv = buildCampaignReportCsv(report)
    const filename = buildCampaignReportCsvFilename({
      campaignId: report.campaign.id,
      campaignName: report.campaign.name,
      dateFrom: report.selected_from,
      dateTo: report.selected_to,
    })

    return new Response(csv, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'text/csv; charset=utf-8',
      },
      status: 200,
    })
  } catch (error) {
    if (error instanceof CampaignReportRequestError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error('Campaign report CSV export failed.', error)

    return Response.json(
      { error: 'Failed to export campaign report CSV.' },
      { status: 500 }
    )
  }
}
