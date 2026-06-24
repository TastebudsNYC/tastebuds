import 'server-only'

import type { LivePromotionSurface } from '@/lib/advertising'
import type {
  PromotionTargetType,
  PromotionTrackingMetric,
} from '@/lib/advertising-attribution'
import type { createServerSupabaseAdminClient } from '@/lib/supabase/server'

export async function recordPromotionMetric(
  adminClient: ReturnType<typeof createServerSupabaseAdminClient>,
  input: {
    metric: PromotionTrackingMetric
    surface: LivePromotionSurface
    targetId: number
    targetType: PromotionTargetType
  }
) {
  const response = await adminClient.rpc('record_promotion_campaign_metric', {
    p_metric: input.metric,
    p_surface: input.surface,
    p_target_id: input.targetId,
    p_target_type: input.targetType,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data ?? false
}
