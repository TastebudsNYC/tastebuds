import { NextResponse } from 'next/server'

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

    return NextResponse.json({
      ok: true,
      report,
    })
  } catch (error) {
    if (error instanceof CampaignReportRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Campaign report load failed.', error)

    return NextResponse.json(
      { error: 'Failed to load campaign report.' },
      { status: 500 }
    )
  }
}
