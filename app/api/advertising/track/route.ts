import { NextResponse } from 'next/server'

import {
  isLivePromotionSurface,
} from '@/lib/advertising'
import {
  isLiveSurfaceCompatibleWithTargetType,
  isPromotionMetricCompatibleWithTargetType,
  isPublicPromotionTrackingMetric,
  isPromotionTargetType,
} from '@/lib/advertising-attribution'
import { recordPromotionMetric } from '@/lib/advertising-tracking'
import {
  createServerSupabaseAdminClient,
  getUserFromAccessToken,
} from '@/lib/supabase/server'

type TrackPromotionRequest = {
  metric?: string
  surface?: string
  targetId?: number
  targetType?: string
}

function parseBearerToken(request: Request) {
  const authorization = request.headers.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length)
}

export async function POST(request: Request) {
  const token = parseBearerToken(request)

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token.' }, { status: 401 })
  }

  let body: TrackPromotionRequest = {}

  try {
    body = (await request.json()) as TrackPromotionRequest
  } catch {
    body = {}
  }

  const targetId = Number(body.targetId)

  if (!isPublicPromotionTrackingMetric(body.metric)) {
    return NextResponse.json({ error: 'Invalid metric.' }, { status: 400 })
  }

  if (!isPromotionTargetType(body.targetType)) {
    return NextResponse.json({ error: 'Invalid targetType.' }, { status: 400 })
  }

  if (!isLivePromotionSurface(body.surface)) {
    return NextResponse.json({ error: 'Invalid surface.' }, { status: 400 })
  }

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return NextResponse.json({ error: 'targetId must be a valid positive integer.' }, { status: 400 })
  }

  if (!isLiveSurfaceCompatibleWithTargetType(body.surface, body.targetType)) {
    return NextResponse.json({ error: 'Surface is not compatible with targetType.' }, { status: 400 })
  }

  if (!isPromotionMetricCompatibleWithTargetType(body.metric, body.targetType)) {
    return NextResponse.json({ error: 'Metric is not compatible with targetType.' }, { status: 400 })
  }

  try {
    await getUserFromAccessToken(token)
    const adminClient = createServerSupabaseAdminClient()

    await recordPromotionMetric(adminClient, {
      metric: body.metric,
      surface: body.surface,
      targetId,
      targetType: body.targetType,
    })
  } catch (error) {
    console.error('Failed to record promotion metric.', error)
  }

  return NextResponse.json({ ok: true })
}
