'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import {
  type CampaignStatus,
  type CampaignType,
  type LivePromotionSurface,
  type PromotionSurface,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  EVENT_SURFACES,
  LIVE_EVENT_SURFACES,
  LIVE_RESTAURANT_SURFACES,
  RESTAURANT_SURFACES,
} from '@/lib/advertising'
import { supabase } from '@/lib/supabase/client'

type AdminCampaign = {
  campaign_type: CampaignType
  created_at: string
  ends_on: string
  event_id: number | null
  id: number
  internal_notes: string | null
  name: string
  promotion_priority: number
  restaurant_id: number | null
  starts_on: string
  status: CampaignStatus
  surfaces: PromotionSurface[]
  updated_at: string
}

type RestaurantOption = {
  archived_at: string | null
  id: number
  name: string
  neighbourhood: string | null
  subregion: string
}

type EventOption = {
  archived_at: string | null
  id: number
  restaurant_name: string
  starts_at: string
  status: 'cancelled' | 'closed' | 'open'
  title: string
}

type CampaignPayload = {
  campaigns?: AdminCampaign[]
  error?: string
  events?: EventOption[]
  restaurants?: RestaurantOption[]
}

type CampaignAction = 'activate' | 'delete' | 'end' | 'pause' | 'reactivate'

function formatCampaignType(value: CampaignType) {
  return value
    .split('_')
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function formatCampaignStatus(value: CampaignStatus) {
  return value[0]?.toUpperCase() + value.slice(1)
}

function formatDateRange(startsOn: string, endsOn: string) {
  return `${startsOn} to ${endsOn}`
}

function formatEventLabel(event: EventOption) {
  return `${event.title} | ${event.restaurant_name} | ${event.starts_at.slice(0, 10)}`
}

function SurfacePicker({
  liveSurfaces,
  onToggle,
  options,
  selected,
}: {
  liveSurfaces: readonly LivePromotionSurface[]
  onToggle: (surface: PromotionSurface) => void
  options: readonly PromotionSurface[]
  selected: PromotionSurface[]
}) {
  const liveSurfaceSet = new Set<PromotionSurface>(liveSurfaces)

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((surface) => {
        const checked = selected.includes(surface)
        const isLive = liveSurfaceSet.has(surface)

        return (
          <label
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              isLive
                ? 'border-zinc-200 bg-white'
                : 'border-amber-200 bg-amber-50'
            }`}
            key={surface}
          >
            <input
              checked={checked}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
              disabled={!isLive && !checked}
              onChange={() => onToggle(surface)}
              type="checkbox"
            />
            <span className="min-w-0 text-sm font-medium text-zinc-900">
              <span className="block">{surface.replaceAll('_', ' ')}</span>
              {!isLive ? (
                <span className="mt-1 block text-xs font-medium uppercase tracking-[0.12em] text-amber-700">
                  Not live yet
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function getDefaultStartDate() {
  return new Date().toISOString().slice(0, 10)
}

function getDefaultEndDate() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export default function AdminCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [actionCampaignId, setActionCampaignId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | CampaignType>('all')

  const [name, setName] = useState('')
  const [campaignType, setCampaignType] = useState<CampaignType>('founding_partner')
  const [restaurantId, setRestaurantId] = useState('')
  const [eventId, setEventId] = useState('')
  const [startsOn, setStartsOn] = useState(getDefaultStartDate())
  const [endsOn, setEndsOn] = useState(getDefaultEndDate())
  const [promotionPriority, setPromotionPriority] = useState('0')
  const [surfaces, setSurfaces] = useState<PromotionSurface[]>([])
  const [internalNotes, setInternalNotes] = useState('')

  const restaurantOptions = useMemo(
    () => restaurants.filter((restaurant) => restaurant.archived_at === null),
    [restaurants]
  )
  const eventOptions = useMemo(
    () => events.filter((event) => event.archived_at === null),
    [events]
  )

  const restaurantById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])),
    [restaurants]
  )
  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events])

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false
    }

    if (typeFilter !== 'all' && campaign.campaign_type !== typeFilter) {
      return false
    }

    return true
  })

  const compatibleSurfaces =
    campaignType === 'promoted_event' ? EVENT_SURFACES : RESTAURANT_SURFACES
  const liveCompatibleSurfaces =
    campaignType === 'promoted_event' ? LIVE_EVENT_SURFACES : LIVE_RESTAURANT_SURFACES

  useEffect(() => {
    let active = true

    async function loadCampaigns() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) {
        return
      }

      if (!user) {
        router.replace('/login')
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setError('Missing active session. Log in again.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/campaigns', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const payload = (await response.json()) as CampaignPayload

      if (!active) {
        return
      }

      if (!response.ok || payload.error) {
        setError(payload.error ?? 'Could not load campaigns.')
        setLoading(false)
        return
      }

      setCampaigns(payload.campaigns ?? [])
      setRestaurants(payload.restaurants ?? [])
      setEvents(payload.events ?? [])
      setLoading(false)
    }

    void loadCampaigns()

    return () => {
      active = false
    }
  }, [router])

  function resetForm() {
    setEditingCampaignId(null)
    setName('')
    setCampaignType('founding_partner')
    setRestaurantId('')
    setEventId('')
    setStartsOn(getDefaultStartDate())
    setEndsOn(getDefaultEndDate())
    setPromotionPriority('0')
    setSurfaces([])
    setInternalNotes('')
  }

  function loadCampaignForEdit(campaign: AdminCampaign) {
    setError('')
    setSuccess('')
    setEditingCampaignId(campaign.id)
    setName(campaign.name)
    setCampaignType(campaign.campaign_type)
    setRestaurantId(campaign.restaurant_id ? String(campaign.restaurant_id) : '')
    setEventId(campaign.event_id ? String(campaign.event_id) : '')
    setStartsOn(campaign.starts_on)
    setEndsOn(campaign.ends_on)
    setPromotionPriority(String(campaign.promotion_priority))
    setSurfaces(campaign.surfaces)
    setInternalNotes(campaign.internal_notes ?? '')
  }

  function toggleSurface(surface: PromotionSurface) {
    setSurfaces((current) =>
      current.includes(surface)
        ? current.filter((item) => item !== surface)
        : [...current, surface]
    )
  }

  function handleCampaignTypeChange(nextType: CampaignType) {
    setCampaignType(nextType)
    const nextSurfaceSet = new Set<PromotionSurface>(
      nextType === 'promoted_event' ? [...EVENT_SURFACES] : [...RESTAURANT_SURFACES]
    )

    setSurfaces((current) =>
      current.filter((surface) => nextSurfaceSet.has(surface))
    )

    if (nextType === 'promoted_event') {
      setRestaurantId('')
    } else {
      setEventId('')
    }
  }

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token ?? null
  }

  async function refreshCampaigns() {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      setError('Missing active session. Log in again.')
      return
    }

    const response = await fetch('/api/admin/campaigns', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const payload = (await response.json()) as CampaignPayload

    if (!response.ok || payload.error) {
      setError(payload.error ?? 'Could not refresh campaigns.')
      return
    }

    setCampaigns(payload.campaigns ?? [])
    setRestaurants(payload.restaurants ?? [])
    setEvents(payload.events ?? [])
  }

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error('Missing active session. Log in again.')
      }

      const payload = {
        campaignType,
        endsOn,
        eventId:
          campaignType === 'promoted_event' && eventId
            ? Number(eventId)
            : null,
        internalNotes,
        name,
        promotionPriority: Number(promotionPriority),
        restaurantId:
          campaignType !== 'promoted_event' && restaurantId
            ? Number(restaurantId)
            : null,
        startsOn,
        surfaces,
      }

      const response = await fetch('/api/admin/campaigns', {
        body: JSON.stringify(
          editingCampaignId === null
            ? payload
            : {
                ...payload,
                action: 'update',
                campaignId: editingCampaignId,
              }
        ),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: editingCampaignId === null ? 'POST' : 'PATCH',
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok || result.error) {
        throw new Error(result.error ?? 'Could not save campaign.')
      }

      await refreshCampaigns()
      setSuccess(
        editingCampaignId === null
          ? 'Draft campaign created.'
          : 'Campaign updated.'
      )
      resetForm()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save campaign.')
    } finally {
      setSubmitting(false)
    }
  }

  async function runCampaignAction(campaignId: number, action: CampaignAction) {
    setActionCampaignId(campaignId)
    setError('')
    setSuccess('')

    try {
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error('Missing active session. Log in again.')
      }

      const response = await fetch('/api/admin/campaigns', {
        body: JSON.stringify({ action, campaignId }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: action === 'delete' ? 'DELETE' : 'PATCH',
      })

      const result = (await response.json()) as { error?: string }

      if (!response.ok || result.error) {
        throw new Error(result.error ?? 'Could not update campaign.')
      }

      await refreshCampaigns()
      if (editingCampaignId === campaignId && action === 'delete') {
        resetForm()
      }

      setSuccess(
        action === 'activate'
          ? 'Campaign activated.'
          : action === 'pause'
            ? 'Campaign paused.'
            : action === 'reactivate'
              ? 'Campaign reactivated.'
              : action === 'end'
                ? 'Campaign ended.'
                : 'Campaign deleted.'
      )
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : 'Could not update campaign.'
      )
    } finally {
      setActionCampaignId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-zinc-600">Loading campaign tools...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-zinc-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              Campaign management
            </h1>
            <p className="mt-3 max-w-3xl text-base text-zinc-600">
              Create and manage internal promotion campaigns without touching consumer ranking or reporting logic.
            </p>
          </div>
          <Link
            className="rounded-xl border border-zinc-950 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
            href="/admin"
          >
            Back to admin home
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <section className="mt-8 rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                {editingCampaignId ? 'Edit campaign' : 'Create draft campaign'}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                New campaigns start in draft. Activation and status changes are handled from the campaign list.
              </p>
            </div>
            {editingCampaignId !== null ? (
              <button
                className="rounded-xl border border-zinc-950 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
                onClick={resetForm}
                type="button"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submitCampaign}>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Campaign name</span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                onChange={(nextEvent) => setName(nextEvent.target.value)}
                placeholder="West Village founding partner"
                required
                value={name}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Campaign type</span>
              <select
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                onChange={(nextEvent) =>
                  handleCampaignTypeChange(nextEvent.target.value as CampaignType)
                }
                value={campaignType}
              >
                {CAMPAIGN_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {formatCampaignType(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Promotion priority</span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                min="0"
                onChange={(nextEvent) => setPromotionPriority(nextEvent.target.value)}
                step="1"
                type="number"
                value={promotionPriority}
              />
            </label>

            {campaignType === 'promoted_event' ? (
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-700">Event target</span>
                <select
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                  onChange={(nextEvent) => setEventId(nextEvent.target.value)}
                  required
                  value={eventId}
                >
                  <option value="">Select an event</option>
                  {eventOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {formatEventLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-zinc-700">Restaurant target</span>
                <select
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                  onChange={(nextEvent) => setRestaurantId(nextEvent.target.value)}
                  required
                  value={restaurantId}
                >
                  <option value="">Select a restaurant</option>
                  {restaurantOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} | {option.neighbourhood ?? 'No neighbourhood'} |{' '}
                      {option.subregion}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">Start date</span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                onChange={(nextEvent) => setStartsOn(nextEvent.target.value)}
                required
                type="date"
                value={startsOn}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-700">End date</span>
              <input
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                onChange={(nextEvent) => setEndsOn(nextEvent.target.value)}
                required
                type="date"
                value={endsOn}
              />
            </label>

            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:col-span-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Eligible surfaces
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Draft campaigns can be saved without surfaces. Activation requires at least one currently live compatible surface.
                </p>
              </div>
              <SurfacePicker
                liveSurfaces={liveCompatibleSurfaces}
                onToggle={toggleSurface}
                options={compatibleSurfaces}
                selected={surfaces}
              />
            </div>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-700">Internal notes</span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                onChange={(nextEvent) => setInternalNotes(nextEvent.target.value)}
                placeholder="Manual placement instructions, commercial notes, or operational context."
                value={internalNotes}
              />
            </label>

            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-zinc-950 px-5 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                disabled={submitting}
                type="submit"
              >
                {submitting
                  ? 'Saving...'
                  : editingCampaignId === null
                    ? 'Create draft'
                    : 'Save campaign'}
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-zinc-200 bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">Campaigns</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Filter by status or type, then manage lifecycle actions from the list.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Status
                </span>
                <select
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                  onChange={(nextEvent) =>
                    setStatusFilter(nextEvent.target.value as 'all' | CampaignStatus)
                  }
                  value={statusFilter}
                >
                  <option value="all">All statuses</option>
                  {CAMPAIGN_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {formatCampaignStatus(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                  Type
                </span>
                <select
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                  onChange={(nextEvent) =>
                    setTypeFilter(nextEvent.target.value as 'all' | CampaignType)
                  }
                  value={typeFilter}
                >
                  <option value="all">All types</option>
                  {CAMPAIGN_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {formatCampaignType(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => {
                const restaurant =
                  campaign.restaurant_id === null
                    ? null
                    : restaurantById.get(campaign.restaurant_id) ?? null
                const event =
                  campaign.event_id === null ? null : eventById.get(campaign.event_id) ?? null

                return (
                  <article
                    className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5"
                    key={campaign.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-zinc-950">{campaign.name}</h3>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-zinc-600">
                            {formatCampaignStatus(campaign.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-600">
                          {formatCampaignType(campaign.campaign_type)} |{' '}
                          {campaign.event_id !== null
                            ? event
                              ? formatEventLabel(event)
                              : `Event #${campaign.event_id}`
                            : restaurant
                              ? `${restaurant.name} | ${restaurant.neighbourhood ?? 'No neighbourhood'} | ${restaurant.subregion}`
                              : `Restaurant #${campaign.restaurant_id}`}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {formatDateRange(campaign.starts_on, campaign.ends_on)} | Priority{' '}
                          {campaign.promotion_priority}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Surfaces:{' '}
                          {campaign.surfaces.length > 0
                            ? campaign.surfaces.join(', ')
                            : 'No surfaces configured yet'}
                        </p>
                        {campaign.internal_notes ? (
                          <p className="mt-3 max-w-3xl text-sm text-zinc-700">
                            {campaign.internal_notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {campaign.status !== 'ended' ? (
                          <button
                            className="rounded-xl border border-zinc-950 px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
                            onClick={() => loadCampaignForEdit(campaign)}
                            type="button"
                          >
                            Edit
                          </button>
                        ) : null}
                        {campaign.status === 'draft' ? (
                          <button
                            className="rounded-xl border border-zinc-950 px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                            disabled={actionCampaignId === campaign.id}
                            onClick={() => void runCampaignAction(campaign.id, 'activate')}
                            type="button"
                          >
                            {actionCampaignId === campaign.id ? 'Working...' : 'Activate'}
                          </button>
                        ) : null}
                        {campaign.status === 'active' ? (
                          <button
                            className="rounded-xl border border-zinc-950 px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                            disabled={actionCampaignId === campaign.id}
                            onClick={() => void runCampaignAction(campaign.id, 'pause')}
                            type="button"
                          >
                            {actionCampaignId === campaign.id ? 'Working...' : 'Pause'}
                          </button>
                        ) : null}
                        {campaign.status === 'paused' ? (
                          <button
                            className="rounded-xl border border-zinc-950 px-3 py-2 text-xs font-medium text-zinc-950 transition hover:bg-zinc-950 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                            disabled={actionCampaignId === campaign.id}
                            onClick={() => void runCampaignAction(campaign.id, 'reactivate')}
                            type="button"
                          >
                            {actionCampaignId === campaign.id ? 'Working...' : 'Reactivate'}
                          </button>
                        ) : null}
                        {campaign.status !== 'ended' ? (
                          <button
                            className="rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                            disabled={actionCampaignId === campaign.id}
                            onClick={() => void runCampaignAction(campaign.id, 'end')}
                            type="button"
                          >
                            {actionCampaignId === campaign.id ? 'Working...' : 'End'}
                          </button>
                        ) : null}
                        {campaign.status === 'draft' ? (
                          <button
                            className="rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400"
                            disabled={actionCampaignId === campaign.id}
                            onClick={() => void runCampaignAction(campaign.id, 'delete')}
                            type="button"
                          >
                            {actionCampaignId === campaign.id ? 'Working...' : 'Delete'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
                No campaigns match these filters yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
