create table public.promotion_campaigns (
  id bigint generated always as identity primary key,
  name text not null,
  campaign_type text not null
    check (campaign_type in ('founding_partner', 'sponsored_listing', 'promoted_event')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'ended')),
  restaurant_id bigint references public.restaurants(id) on delete restrict,
  event_id bigint references public.events(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  promotion_priority integer not null default 0,
  internal_notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((restaurant_id is not null) <> (event_id is not null)),
  check (
    (campaign_type = 'promoted_event' and event_id is not null and restaurant_id is null)
    or (
      campaign_type in ('founding_partner', 'sponsored_listing')
      and restaurant_id is not null
      and event_id is null
    )
  ),
  check (starts_on <= ends_on),
  check (promotion_priority >= 0)
);

create index promotion_campaigns_restaurant_lookup_idx
on public.promotion_campaigns (
  restaurant_id,
  status,
  starts_on,
  ends_on,
  promotion_priority desc
)
where restaurant_id is not null;

create index promotion_campaigns_event_lookup_idx
on public.promotion_campaigns (
  event_id,
  status,
  starts_on,
  ends_on,
  promotion_priority desc
)
where event_id is not null;

create table public.promotion_campaign_surfaces (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references public.promotion_campaigns(id) on delete restrict,
  surface text not null check (
    surface in (
      'restaurant_search',
      'restaurant_category',
      'restaurant_neighbourhood',
      'restaurant_recommendations',
      'event_list',
      'event_explore',
      'event_recommendations'
    )
  ),
  created_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id, surface)
);

create table public.promotion_campaign_daily_reports (
  id bigint generated always as identity primary key,
  campaign_id bigint not null,
  report_date date not null,
  surface text not null check (
    surface in (
      'restaurant_search',
      'restaurant_category',
      'restaurant_neighbourhood',
      'restaurant_recommendations',
      'event_list',
      'event_explore',
      'event_recommendations'
    )
  ),
  impression_count integer not null default 0 check (impression_count >= 0),
  venue_profile_view_count integer not null default 0 check (venue_profile_view_count >= 0),
  event_view_count integer not null default 0 check (event_view_count >= 0),
  save_count integer not null default 0 check (save_count >= 0),
  rsvp_count integer not null default 0 check (rsvp_count >= 0),
  website_click_count integer not null default 0 check (website_click_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (campaign_id, surface)
    references public.promotion_campaign_surfaces(campaign_id, surface)
    on delete restrict,
  unique (campaign_id, report_date, surface)
);

create index promotion_campaign_daily_reports_campaign_surface_idx
on public.promotion_campaign_daily_reports (campaign_id, surface, report_date desc);

alter table public.promotion_campaigns enable row level security;
alter table public.promotion_campaign_surfaces enable row level security;
alter table public.promotion_campaign_daily_reports enable row level security;

revoke all on public.promotion_campaigns from public;
revoke all on public.promotion_campaign_surfaces from public;
revoke all on public.promotion_campaign_daily_reports from public;

revoke all on public.promotion_campaigns from anon, authenticated;
revoke all on public.promotion_campaign_surfaces from anon, authenticated;
revoke all on public.promotion_campaign_daily_reports from anon, authenticated;

grant select, insert, update, delete on public.promotion_campaigns to service_role;
grant select, insert, update, delete on public.promotion_campaign_surfaces to service_role;
grant select, insert, update, delete on public.promotion_campaign_daily_reports to service_role;

grant usage, select on sequence public.promotion_campaigns_id_seq to service_role;
grant usage, select on sequence public.promotion_campaign_surfaces_id_seq to service_role;
grant usage, select on sequence public.promotion_campaign_daily_reports_id_seq to service_role;

comment on table public.promotion_campaign_daily_reports is
  'Daily internal campaign reporting. Update counters with an atomic upsert/increment statement, never a read-modify-write sequence in application code.';

comment on column public.promotion_campaigns.updated_at is
  'Application-managed timestamp. This repository does not use a generic database updated_at trigger; future trusted server-side update routes must set this column explicitly.';

comment on column public.promotion_campaign_daily_reports.updated_at is
  'Application-managed timestamp. This repository does not use a generic database updated_at trigger; future trusted server-side update routes must set this column explicitly.';
