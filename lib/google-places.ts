import 'server-only'

type GoogleTextSearchPlace = {
  businessStatus?: string
  displayName?: { text?: string }
  formattedAddress?: string
  goodForGroups?: boolean
  goodForWatchingSports?: boolean
  googleMapsUri?: string
  id?: string
  liveMusic?: boolean
  location?: { latitude?: number; longitude?: number }
  nationalPhoneNumber?: string
  outdoorSeating?: boolean
  priceLevel?: string
  primaryType?: string
  rating?: number
  regularOpeningHours?: {
    openNow?: boolean
    weekdayDescriptions?: string[]
  }
  reservable?: boolean
  servesBeer?: boolean
  servesBrunch?: boolean
  servesCocktails?: boolean
  servesDessert?: boolean
  servesDinner?: boolean
  servesVegetarianFood?: boolean
  servesWine?: boolean
  types?: string[]
  userRatingCount?: number
  websiteUri?: string
}

type GooglePlacePhoto = {
  authorAttributions?: {
    displayName?: string
    uri?: string
  }[]
  name?: string
}

type GoogleTextSearchResponse = {
  places?: GoogleTextSearchPlace[]
}

type GooglePlaceDetails = GoogleTextSearchPlace & {
  editorialSummary?: { text?: string }
  googleMapsUri?: string
  photos?: GooglePlacePhoto[]
}

type GooglePlacePhotoMediaResponse = {
  photoUri?: string
}

export type GooglePlacePhotoResult = {
  authorName: string | null
  photoUri: string | null
}

function getGooglePlacesApiKey() {
  const value = process.env.GOOGLE_MAPS_API_KEY

  if (!value) {
    throw new Error('Missing required environment variable: GOOGLE_MAPS_API_KEY')
  }

  return value
}

async function googlePlacesFetch<T>(
  url: string,
  init: RequestInit & { fieldMask: string }
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getGooglePlacesApiKey(),
      'X-Goog-FieldMask': init.fieldMask,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  const payload = (await response.json()) as T & { error?: { message?: string } }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Google Places request failed.')
  }

  return payload
}

export type GooglePoiSearchSuggestion = {
  formattedAddress: string | null
  goodForGroups: boolean | null
  goodForWatchingSports: boolean | null
  googleMapsUri: string | null
  id: string
  latitude: number | null
  liveMusic: boolean | null
  longitude: number | null
  name: string
  openNow: boolean | null
  outdoorSeating: boolean | null
  phoneNumber: string | null
  priceLevel: string | null
  rating: number | null
  reservable: boolean | null
  servesBeer: boolean | null
  servesBrunch: boolean | null
  servesCocktails: boolean | null
  servesDessert: boolean | null
  servesDinner: boolean | null
  servesVegetarianFood: boolean | null
  servesWine: boolean | null
  userRatingCount: number | null
  websiteUri: string | null
}

export async function searchRestaurantPois(query: string) {
  const payload = await googlePlacesFetch<GoogleTextSearchResponse>(
    'https://places.googleapis.com/v1/places:searchText',
    {
      body: JSON.stringify({
        includedType: 'restaurant',
        languageCode: 'en',
        maxResultCount: 6,
        regionCode: 'US',
        textQuery: query,
      }),
      fieldMask:
        'places.businessStatus,places.id,places.displayName,places.formattedAddress,places.goodForGroups,places.goodForWatchingSports,places.location,places.googleMapsUri,places.liveMusic,places.nationalPhoneNumber,places.outdoorSeating,places.priceLevel,places.primaryType,places.rating,places.regularOpeningHours.openNow,places.reservable,places.servesBeer,places.servesBrunch,places.servesCocktails,places.servesDessert,places.servesDinner,places.servesVegetarianFood,places.servesWine,places.types,places.userRatingCount,places.websiteUri',
      method: 'POST',
    }
  )

  return (payload.places ?? [])
    .filter((place) => place.id && place.displayName?.text)
    .map((place) => ({
      formattedAddress: place.formattedAddress ?? null,
      goodForGroups: place.goodForGroups ?? null,
      goodForWatchingSports: place.goodForWatchingSports ?? null,
      googleMapsUri: place.googleMapsUri ?? null,
      id: place.id as string,
      latitude: place.location?.latitude ?? null,
      liveMusic: place.liveMusic ?? null,
      longitude: place.location?.longitude ?? null,
      name: place.displayName?.text as string,
      openNow: place.regularOpeningHours?.openNow ?? null,
      outdoorSeating: place.outdoorSeating ?? null,
      phoneNumber: place.nationalPhoneNumber ?? null,
      priceLevel: place.priceLevel ?? null,
      rating: place.rating ?? null,
      reservable: place.reservable ?? null,
      servesBeer: place.servesBeer ?? null,
      servesBrunch: place.servesBrunch ?? null,
      servesCocktails: place.servesCocktails ?? null,
      servesDessert: place.servesDessert ?? null,
      servesDinner: place.servesDinner ?? null,
      servesVegetarianFood: place.servesVegetarianFood ?? null,
      servesWine: place.servesWine ?? null,
      userRatingCount: place.userRatingCount ?? null,
      websiteUri: place.websiteUri ?? null,
    }))
}

export async function getRestaurantPoiDetails(placeId: string) {
  const payload = await googlePlacesFetch<GooglePlaceDetails>(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      fieldMask:
        'id,displayName,editorialSummary,formattedAddress,businessStatus,goodForGroups,goodForWatchingSports,googleMapsUri,liveMusic,location,nationalPhoneNumber,outdoorSeating,photos.name,priceLevel,primaryType,rating,regularOpeningHours.openNow,regularOpeningHours.weekdayDescriptions,reservable,servesBeer,servesBrunch,servesCocktails,servesDessert,servesDinner,servesVegetarianFood,servesWine,types,userRatingCount,websiteUri',
      method: 'GET',
    }
  )

  return {
    businessStatus: payload.businessStatus ?? null,
    editorialSummary: payload.editorialSummary?.text ?? null,
    formattedAddress: payload.formattedAddress ?? null,
    goodForGroups: payload.goodForGroups ?? null,
    goodForWatchingSports: payload.goodForWatchingSports ?? null,
    googleMapsUri: payload.googleMapsUri ?? null,
    id: payload.id ?? placeId,
    latitude: payload.location?.latitude ?? null,
    liveMusic: payload.liveMusic ?? null,
    longitude: payload.location?.longitude ?? null,
    name: payload.displayName?.text ?? null,
    openNow: payload.regularOpeningHours?.openNow ?? null,
    openingHours: payload.regularOpeningHours?.weekdayDescriptions ?? [],
    outdoorSeating: payload.outdoorSeating ?? null,
    phoneNumber: payload.nationalPhoneNumber ?? null,
    photoRefs: (payload.photos ?? []).map((photo) => photo.name).filter((value): value is string => Boolean(value)),
    priceLevel: payload.priceLevel ?? null,
    primaryType: payload.primaryType ?? null,
    rating: payload.rating ?? null,
    reservable: payload.reservable ?? null,
    servesBeer: payload.servesBeer ?? null,
    servesBrunch: payload.servesBrunch ?? null,
    servesCocktails: payload.servesCocktails ?? null,
    servesDessert: payload.servesDessert ?? null,
    servesDinner: payload.servesDinner ?? null,
    servesVegetarianFood: payload.servesVegetarianFood ?? null,
    servesWine: payload.servesWine ?? null,
    types: payload.types ?? [],
    userRatingCount: payload.userRatingCount ?? null,
    websiteUri: payload.websiteUri ?? null,
  }
}

export async function getRestaurantPlacePhotos(
  placeId: string,
  maxWidthPx = 1200,
  maxPhotos = 5
) {
  const placePayload = await googlePlacesFetch<GooglePlaceDetails>(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      fieldMask: 'photos',
      method: 'GET',
    }
  )

  const photos = await Promise.all(
    (placePayload.photos ?? []).slice(0, maxPhotos).map(async (photo) => {
      if (!photo.name) {
        return null
      }

      const mediaPayload = await googlePlacesFetch<GooglePlacePhotoMediaResponse>(
        `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true`,
        {
          fieldMask: 'photoUri',
          method: 'GET',
        }
      )

      return {
        authorName:
          photo.authorAttributions?.find((entry) => entry.displayName?.trim())?.displayName ??
          null,
        photoUri: mediaPayload.photoUri ?? null,
      } satisfies GooglePlacePhotoResult
    })
  )

  return photos.filter(
    (photo): photo is GooglePlacePhotoResult => Boolean(photo?.photoUri)
  )
}

export async function getRestaurantPlacePhoto(placeId: string, maxWidthPx = 1200) {
  const photos = await getRestaurantPlacePhotos(placeId, maxWidthPx, 1)

  return (
    photos[0] ?? {
      authorName: null,
      photoUri: null,
    }
  )
}

export async function getRestaurantGoogleDetails(placeId: string) {
  const [details, photos] = await Promise.all([
    getRestaurantPoiDetails(placeId),
    getRestaurantPlacePhotos(placeId, 1400, 6),
  ])
  const primaryPhoto = photos[0] ?? { authorName: null, photoUri: null }

  return {
    ...details,
    photoAuthorName: primaryPhoto.authorName,
    photoUri: primaryPhoto.photoUri,
    photos,
  }
}
