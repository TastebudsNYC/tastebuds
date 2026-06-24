# Advertising MVP Data Model

This document describes the Phase 1 database foundation for internally managed promotion campaigns.

## Scope

The Phase 1 schema adds:

- `public.promotion_campaigns`
- `public.promotion_campaign_surfaces`
- `public.promotion_campaign_daily_reports`

It does not add ranking logic, admin routes, consumer tracking calls, venue self-service, billing, or raw per-interaction analytics.

## Campaign configuration

`public.promotion_campaigns` stores one manually managed campaign that targets exactly one existing entity:

- a venue via `public.restaurants.id`
- or an event via `public.events.id`

Campaigns support:

- `name`
- `campaign_type`
- `status`
- `starts_on`
- `ends_on`
- `promotion_priority`
- `internal_notes`
- `created_by`, `updated_by`
- `created_at`, `updated_at`

Database constraints enforce:

- exactly one target entity
- campaign type / target compatibility
- valid date range
- non-negative priority

## Placement surfaces

`public.promotion_campaign_surfaces` stores the eligible surfaces for each campaign.

Allowed surface values:

- `restaurant_search`
- `restaurant_category`
- `restaurant_neighbourhood`
- `restaurant_recommendations`
- `event_list`
- `event_explore`
- `event_recommendations`

The database enforces uniqueness for `(campaign_id, surface)`.

The later admin service layer should require at least one surface before activating a campaign. That rule is intentionally not enforced by trigger in Phase 1.
When campaign activation is implemented later in trusted server-side code:

- a campaign must have at least one configured surface before it can become `active`
- `founding_partner` and `sponsored_listing` campaigns may only use restaurant surfaces
- `promoted_event` campaigns may only use event surfaces
- `starts_on` and `ends_on` are inclusive dates

## Daily performance reporting

`public.promotion_campaign_daily_reports` stores daily aggregate counts per campaign and surface for:

- impressions
- venue profile views
- event views
- saves
- RSVPs
- website clicks

The database enforces one row per `(campaign_id, report_date, surface)` and non-negative counts for every metric.

Later tracking code must update these counters with a single atomic upsert/increment database statement. Do not implement reporting with a read-modify-write sequence in application code.

## Access model

The new tables stay in `public` for consistency with the existing service-role access pattern, but they are internal-only:

- RLS is enabled on all three tables.
- `anon` and `authenticated` receive no privileges.
- only `service_role` receives table and sequence access.
- no public or authenticated policies are created.

Later application code must continue to enforce `requireAdminOrCron` before any trusted service-role campaign access.
