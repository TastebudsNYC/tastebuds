import { NextResponse } from 'next/server'

import { getRestaurantPlacePhoto, getRestaurantPlacePhotos } from '@/lib/google-places'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params
    const normalizedPlaceId = placeId.trim()

    if (!normalizedPlaceId) {
      return NextResponse.json({ error: 'placeId is required.' }, { status: 400 })
    }

    const [photo, photos] = await Promise.all([
      getRestaurantPlacePhoto(normalizedPlaceId, 1200),
      getRestaurantPlacePhotos(normalizedPlaceId, 1200, 5),
    ])

    return NextResponse.json({
      ok: true,
      photo,
      photos,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load restaurant photo.',
      },
      { status: 500 }
    )
  }
}
