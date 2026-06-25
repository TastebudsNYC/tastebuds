import { redirect } from 'next/navigation'

import { AdminCampaignReportPage } from '@/components/admin/AdminCampaignReportPage'

export default async function CampaignReportPage({
  params,
}: {
  params: Promise<{ campaignId: string }>
}) {
  const { campaignId } = await params
  const parsedCampaignId = Number(campaignId)

  if (!Number.isInteger(parsedCampaignId) || parsedCampaignId <= 0) {
    redirect('/admin/campaigns')
  }

  return <AdminCampaignReportPage campaignId={parsedCampaignId} />
}
