'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/app/Button'
import { formatRestaurantLocationLine } from '@/lib/app/format'
import type { DashboardRestaurant } from '@/lib/app/types'

type GoogleMapsApi = {
  maps: {
    LatLngBounds: new () => GoogleLatLngBounds
    Map: new (
      element: HTMLElement,
      options: Record<string, unknown>
    ) => GoogleMap
    Marker: new (options: Record<string, unknown>) => GoogleMarker
    SymbolPath: {
      CIRCLE: unknown
    }
  }
}

type GoogleLatLngBounds = {
  extend: (position: { lat: number; lng: number }) => void
  getCenter: () => unknown
}

type GoogleMap = {
  addListener: (eventName: string, handler: () => void) => void
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void
  panTo: (position: { lat: number; lng: number }) => void
  setCenter: (center: unknown) => void
  setZoom: (zoom: number) => void
}

type GoogleMarker = {
  addListener: (eventName: string, handler: () => void) => void
  setIcon: (icon: Record<string, unknown>) => void
  setMap: (map: GoogleMap | null) => void
}

declare global {
  interface Window {
    google?: GoogleMapsApi
    __tastebudsGoogleMapsPromise?: Promise<GoogleMapsApi>
  }
}

const FALLBACK_CENTER = { lat: 40.758, lng: -73.9855 }

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f1e6' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#72675a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f9f9f7' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#b9d4da' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8f0f0' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d8e9ed' }] },
]

function loadGoogleMaps(apiKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (window.__tastebudsGoogleMapsPromise) {
    return window.__tastebudsGoogleMapsPromise
  }

  window.__tastebudsGoogleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-tastebuds-google-maps="true"]'
    )

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.google?.maps) {
          resolve(window.google)
        } else {
          reject(new Error('Google Maps failed to initialize.'))
        }
      })
      existingScript.addEventListener('error', () => reject(new Error('Google Maps failed to load.')))
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.dataset.tastebudsGoogleMaps = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps failed to initialize.'))
      }
    }
    script.onerror = () => reject(new Error('Google Maps failed to load.'))
    document.head.appendChild(script)
  })

  return window.__tastebudsGoogleMapsPromise
}

function getMarkerTone(restaurant: DashboardRestaurant) {
  if (restaurant.availableEventCount > 0) {
    return {
      fill: '#FFC143',
      stroke: '#FFF6E9',
    }
  }

  if (restaurant.isSaved) {
    return {
      fill: '#6F7D4F',
      stroke: '#F8F7F3',
    }
  }

  return {
    fill: '#0B1324',
    stroke: '#FFF6E9',
  }
}

function getMarkerIcon(
  googleApi: GoogleMapsApi,
  restaurant: DashboardRestaurant,
  active: boolean
) {
  const tone = getMarkerTone(restaurant)

  return {
    fillColor: tone.fill,
    fillOpacity: 1,
    path: googleApi.maps.SymbolPath.CIRCLE,
    scale: active ? 11 : 8.8,
    strokeColor: active ? '#FFF6E9' : tone.stroke,
    strokeOpacity: 1,
    strokeWeight: active ? 4 : 3,
  }
}

function getUserMarkerIcon(googleApi: GoogleMapsApi) {
  return {
    fillColor: '#F8F7F3',
    fillOpacity: 1,
    path: googleApi.maps.SymbolPath.CIRCLE,
    scale: 8,
    strokeColor: '#F2A900',
    strokeOpacity: 1,
    strokeWeight: 4,
  }
}

function getRestaurantSubtitle(restaurant: DashboardRestaurant) {
  return formatRestaurantLocationLine({
    distanceKm: restaurant.venueDistanceKm,
    neighbourhood: restaurant.neighbourhood,
    subregion: restaurant.subregion,
  })
}

export function SavedSpotsMap({
  className,
  highlightedRestaurantId,
  id,
  includeUserLocationInBounds = true,
  markerClickMode = 'preview',
  onHighlightRestaurant,
  onPreviewRestaurant,
  restaurants,
  selectedRestaurantId,
  onSelectRestaurant,
  previewActionLabel = 'Open details',
  previewedRestaurantId,
  showUserMarker = true,
  showInlinePreviewCard = true,
  userLocation,
}: {
  className?: string
  highlightedRestaurantId?: number | null
  id?: string
  includeUserLocationInBounds?: boolean
  markerClickMode?: 'preview' | 'select'
  onHighlightRestaurant?: (restaurantId: number | null) => void
  onPreviewRestaurant?: (restaurantId: number | null) => void
  onSelectRestaurant?: (restaurantId: number | null) => void
  previewActionLabel?: string
  previewedRestaurantId?: number | null
  restaurants: DashboardRestaurant[]
  selectedRestaurantId?: number | null
  showUserMarker?: boolean
  showInlinePreviewCard?: boolean
  userLocation?: { lat: number; lng: number } | null
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const googleApiRef = useRef<GoogleMapsApi | null>(null)
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<GoogleMap | null>(null)
  const markersRef = useRef<Map<number, GoogleMarker>>(new Map())
  const highlightHandlerRef = useRef(onHighlightRestaurant)
  const previewHandlerRef = useRef(onPreviewRestaurant)
  const selectHandlerRef = useRef(onSelectRestaurant)
  const [internalPreviewedRestaurantId, setInternalPreviewedRestaurantId] = useState<number | null>(null)
  const [mapReadyVersion, setMapReadyVersion] = useState(0)
  const [mapError, setMapError] = useState('')

  const mappedRestaurants = useMemo(
    () =>
      restaurants.filter(
        (restaurant) =>
          restaurant.venue_latitude !== null && restaurant.venue_longitude !== null
      ),
    [restaurants]
  )
  const activePreviewRestaurantId =
    previewedRestaurantId !== undefined ? previewedRestaurantId : internalPreviewedRestaurantId
  const activePreviewRestaurant =
    mappedRestaurants.find((restaurant) => restaurant.id === activePreviewRestaurantId) ?? null

  useEffect(() => {
    highlightHandlerRef.current = onHighlightRestaurant
  }, [onHighlightRestaurant])

  useEffect(() => {
    previewHandlerRef.current = onPreviewRestaurant
  }, [onPreviewRestaurant])

  useEffect(() => {
    selectHandlerRef.current = onSelectRestaurant
  }, [onSelectRestaurant])

  useEffect(() => {
    if (!apiKey || !mapElementRef.current) {
      return
    }

    let cancelled = false

    async function initialiseMap() {
      try {
        const googleApi = await loadGoogleMaps(apiKey)
        googleApiRef.current = googleApi

        if (cancelled || !mapElementRef.current) {
          return
        }

        const selectedRestaurant =
          mappedRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null

        const center = selectedRestaurant
          ? {
              lat: selectedRestaurant.venue_latitude ?? FALLBACK_CENTER.lat,
              lng: selectedRestaurant.venue_longitude ?? FALLBACK_CENTER.lng,
            }
          : mappedRestaurants[0]
            ? {
                lat: mappedRestaurants[0].venue_latitude ?? FALLBACK_CENTER.lat,
                lng: mappedRestaurants[0].venue_longitude ?? FALLBACK_CENTER.lng,
              }
          : userLocation ?? FALLBACK_CENTER

        if (!mapRef.current) {
          mapRef.current = new googleApi.maps.Map(mapElementRef.current, {
            center,
            clickableIcons: false,
            disableDefaultUI: true,
            gestureHandling: 'cooperative',
            mapTypeControl: false,
            maxZoom: 16,
            minZoom: 11,
            styles: MAP_STYLES,
            zoom: 13,
          })
          mapRef.current.addListener('click', () => {
            setInternalPreviewedRestaurantId(null)
            previewHandlerRef.current?.(null)
            if (markerClickMode === 'select') {
              selectHandlerRef.current?.(null)
            }
          })
        }

        setMapReadyVersion((current) => current + 1)
        setMapError('')
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Could not load map.')
        }
      }
    }

    void initialiseMap()

    return () => {
      cancelled = true
    }
  }, [
    apiKey,
    includeUserLocationInBounds,
    markerClickMode,
    mappedRestaurants,
    userLocation,
  ])

  useEffect(() => {
    const googleApi = googleApiRef.current
    const map = mapRef.current

    if (!googleApi || !map) {
      return
    }

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = new Map()

    const bounds = new googleApi.maps.LatLngBounds()

    if (showUserMarker && userLocation) {
      const userMarker = new googleApi.maps.Marker({
        icon: getUserMarkerIcon(googleApi),
        map,
        position: userLocation,
        title: 'You',
      })

      markersRef.current.set(-1, userMarker)
    }

    if (includeUserLocationInBounds && userLocation) {
      bounds.extend(userLocation)
    }

    for (const restaurant of mappedRestaurants) {
      const position = {
        lat: restaurant.venue_latitude ?? FALLBACK_CENTER.lat,
        lng: restaurant.venue_longitude ?? FALLBACK_CENTER.lng,
      }

      bounds.extend(position)

      const marker = new googleApi.maps.Marker({
        icon: getMarkerIcon(googleApi, restaurant, restaurant.id === selectedRestaurantId),
        map,
        position,
        title: restaurant.name,
      })

      marker.addListener('mouseover', () => {
        highlightHandlerRef.current?.(restaurant.id)
      })
      marker.addListener('mouseout', () => {
        highlightHandlerRef.current?.(null)
      })
      marker.addListener('click', () => {
        setInternalPreviewedRestaurantId(restaurant.id)
        previewHandlerRef.current?.(restaurant.id)

        if (markerClickMode === 'select') {
          selectHandlerRef.current?.(restaurant.id)
        }
      })

      markersRef.current.set(restaurant.id, marker)
    }

    if (mappedRestaurants.length === 1) {
      map.setCenter(bounds.getCenter())
      map.setZoom(14)
    } else if (mappedRestaurants.length > 1 || userLocation) {
      map.fitBounds(bounds, 64)
    }
  }, [
    includeUserLocationInBounds,
    mapReadyVersion,
    mappedRestaurants,
    markerClickMode,
    selectedRestaurantId,
    showUserMarker,
    userLocation,
  ])

  useEffect(() => {
    const googleApi = googleApiRef.current

    if (!googleApi || markersRef.current.size === 0) {
      return
    }

    for (const restaurant of mappedRestaurants) {
      const marker = markersRef.current.get(restaurant.id)

      if (!marker) {
        continue
      }

      marker.setIcon(
        getMarkerIcon(
          googleApi,
          restaurant,
          restaurant.id === selectedRestaurantId ||
            restaurant.id === highlightedRestaurantId ||
            restaurant.id === activePreviewRestaurantId
        )
      )
    }
  }, [activePreviewRestaurantId, highlightedRestaurantId, mappedRestaurants, selectedRestaurantId])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    const activeRestaurant =
      mappedRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ??
      mappedRestaurants.find((restaurant) => restaurant.id === activePreviewRestaurantId) ??
      null

    if (!activeRestaurant) {
      return
    }

    map.panTo({
      lat: activeRestaurant.venue_latitude ?? FALLBACK_CENTER.lat,
      lng: activeRestaurant.venue_longitude ?? FALLBACK_CENTER.lng,
    })
  }, [activePreviewRestaurantId, mappedRestaurants, selectedRestaurantId])

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-6 text-center">
        <p className="text-base font-semibold text-[color:var(--foreground)]">Interactive map available</p>
        <p className="max-w-md text-sm leading-6 text-[color:var(--text-secondary)]">
          Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the saved-spots map in the dashboard.
        </p>
      </div>
    )
  }

  if (mappedRestaurants.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-6 text-center">
        <p className="text-base font-semibold text-[color:var(--foreground)]">No mapped restaurants yet</p>
        <p className="max-w-md text-sm leading-6 text-[color:var(--text-secondary)]">
          Saved restaurants need venue coordinates before they can appear on the map.
        </p>
      </div>
    )
  }

  return (
    <div className={`relative min-h-[400px] overflow-hidden rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] ${className ?? ''}`} id={id}>
      <div className="absolute inset-0" ref={mapElementRef} />
      {showInlinePreviewCard && activePreviewRestaurant ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1] sm:inset-x-auto sm:w-[19rem]">
          <div className="pointer-events-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/96 p-4 shadow-[0_18px_40px_rgba(11,19,36,0.14)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[color:var(--foreground)]">
                  {activePreviewRestaurant.name}
                </p>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  {getRestaurantSubtitle(activePreviewRestaurant)}
                </p>
              </div>
              <button
                aria-label="Close map preview"
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] p-2 text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--foreground)]"
                onClick={() => {
                  setInternalPreviewedRestaurantId(null)
                  onPreviewRestaurant?.(null)
                }}
                type="button"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {activePreviewRestaurant.venueMatchSummary}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold">
              <span className="rounded-full bg-[color:var(--match-bg)] px-3 py-1.5 text-[color:var(--match-text)]">
                {activePreviewRestaurant.matchScore}% match
              </span>
              <span className="text-[color:var(--status-text)]">
                {activePreviewRestaurant.availableEventCount > 0
                  ? `${activePreviewRestaurant.availableEventCount} live table${activePreviewRestaurant.availableEventCount === 1 ? '' : 's'}`
                  : activePreviewRestaurant.isSaved
                    ? 'Watching'
                    : 'Recommendation'}
              </span>
            </div>
            {onSelectRestaurant ? (
              <div className="mt-4">
                <Button
                  className="w-full"
                  onClick={() => onSelectRestaurant(activePreviewRestaurant.id)}
                  variant="secondary"
                >
                  {previewActionLabel}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {mapError ? (
        <div className="absolute inset-x-4 top-4 rounded-xl bg-white/95 p-3 text-sm text-[color:var(--accent-strong)] shadow-lg">
          {mapError}
        </div>
      ) : null}
    </div>
  )
}
