-- Source of truth lives in supabase/migrations/.
-- Keep this file as a convenience bootstrap mirror for manual SQL editor use.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  city text not null default 'New York City',
  region text not null default 'Manhattan',
  subregion text not null check (subregion in ('Uptown', 'Midtown', 'Downtown')),
  neighbourhood text,
  intent text not null check (intent in ('dating', 'friendship')),
  max_travel_minutes integer not null check (max_travel_minutes in (15, 30, 45)),
  bio text,
  profile_photo_url text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.availability (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  round_date date not null,
  intent text not null check (intent in ('dating', 'friendship')),
  available boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, round_date)
);

alter table public.availability
add column if not exists intent text;

update public.availability
set intent = coalesce(intent, 'dating')
where intent is null;

alter table public.availability
alter column intent set not null;

alter table public.availability
drop constraint if exists availability_intent_check;

alter table public.availability
add constraint availability_intent_check
check (intent in ('dating', 'friendship'));

alter table public.availability enable row level security;

grant select, insert, update on public.availability to authenticated;

drop policy if exists "Users can view their own availability" on public.availability;
create policy "Users can view their own availability"
on public.availability
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own availability" on public.availability;
create policy "Users can insert their own availability"
on public.availability
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own availability" on public.availability;
create policy "Users can update their own availability"
on public.availability
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.match_rounds (
  id bigint generated always as identity primary key,
  region text not null default 'Manhattan',
  round_date date not null,
  intent text not null check (intent in ('dating', 'friendship')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  participant_count integer not null default 0,
  match_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  unique (region, round_date, intent)
);

alter table public.match_rounds enable row level security;

grant select on public.match_rounds to authenticated;

drop policy if exists "Authenticated users can view match rounds" on public.match_rounds;
create policy "Authenticated users can view match rounds"
on public.match_rounds
for select
to authenticated
using (true);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  round_id bigint not null references public.match_rounds(id) on delete cascade,
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  intent text not null check (intent in ('dating', 'friendship')),
  score integer not null default 0,
  rationale text,
  status text not null default 'proposed' check (status in ('proposed', 'mutual', 'declined')),
  user_a_response text not null default 'pending' check (user_a_response in ('pending', 'accepted', 'declined')),
  user_b_response text not null default 'pending' check (user_b_response in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default timezone('utc', now()),
  check (user_a <> user_b)
);

alter table public.matches
add column if not exists user_a_response text;

alter table public.matches
add column if not exists user_b_response text;

update public.matches
set user_a_response = coalesce(user_a_response, 'pending'),
    user_b_response = coalesce(user_b_response, 'pending');

alter table public.matches
alter column user_a_response set not null;

alter table public.matches
alter column user_b_response set not null;

alter table public.matches
drop constraint if exists matches_status_check;

alter table public.matches
add constraint matches_status_check
check (status in ('proposed', 'mutual', 'declined'));

alter table public.matches
drop constraint if exists matches_user_a_response_check;

alter table public.matches
add constraint matches_user_a_response_check
check (user_a_response in ('pending', 'accepted', 'declined'));

alter table public.matches
drop constraint if exists matches_user_b_response_check;

alter table public.matches
add constraint matches_user_b_response_check
check (user_b_response in ('pending', 'accepted', 'declined'));

alter table public.matches enable row level security;

grant select on public.matches to authenticated;

drop policy if exists "Users can view their own matches" on public.matches;
create policy "Users can view their own matches"
on public.matches
for select
using (auth.uid() = user_a or auth.uid() = user_b);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id bigint references public.matches(id) on delete cascade,
  type text not null check (
    type in (
      'match_proposed',
      'match_accepted',
      'match_confirmed',
      'match_declined'
    )
  ),
  title text not null,
  body text not null,
  read_at timestamptz,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  email_sent_at timestamptz,
  email_attempted_at timestamptz,
  email_error text,
  email_provider_id text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id, type)
);

alter table public.notifications
add column if not exists email_status text not null default 'pending';

alter table public.notifications
add column if not exists email_sent_at timestamptz;

alter table public.notifications
add column if not exists email_attempted_at timestamptz;

alter table public.notifications
add column if not exists email_error text;

alter table public.notifications
add column if not exists email_provider_id text;

alter table public.notifications
drop constraint if exists notifications_email_status_check;

alter table public.notifications
add constraint notifications_email_status_check
check (email_status in ('pending', 'sent', 'failed', 'skipped'));

create index if not exists notifications_user_created_at_idx
on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on public.notifications (user_id, created_at desc)
where read_at is null;

create index if not exists notifications_email_pending_idx
on public.notifications (created_at)
where email_sent_at is null and email_status <> 'skipped';

alter table public.notifications enable row level security;

grant select, update, delete on public.notifications to authenticated;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
on public.notifications
for select
using (auth.uid() = user_id);

drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read"
on public.notifications
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
on public.notifications
for delete
using (auth.uid() = user_id);

alter table public.profiles
add column if not exists cuisine_preferences text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_energy text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_scene text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_crowd text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_music text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_setting text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_price text[] not null default '{}';

alter table public.profiles
add column if not exists preferred_vibes text[] not null default '{}';

alter table public.profiles
add column if not exists drinking_preferences text[] not null default '{}';

alter table public.profiles
add column if not exists dietary_restrictions text[] not null default '{}';

alter table public.profiles
add column if not exists conversation_preference text[] not null default '{}';

alter table public.profiles
add column if not exists age_range_comfort text[] not null default '{}';

alter table public.profiles
add column if not exists group_size_comfort text[] not null default '{}';

alter table public.profiles
add column if not exists home_latitude double precision;

alter table public.profiles
add column if not exists home_longitude double precision;

create table if not exists public.restaurants (
  id bigint generated always as identity primary key,
  name text not null,
  subregion text not null check (subregion in ('Uptown', 'Midtown', 'Downtown')),
  neighbourhood text,
  cuisines text[] not null default '{}',
  google_place_id text,
  google_maps_uri text,
  formatted_address text,
  google_rating numeric(3,2),
  google_user_ratings_total integer,
  google_price_level text,
  google_open_now boolean,
  google_opening_hours text[] not null default '{}',
  google_good_for_groups boolean,
  google_good_for_watching_sports boolean,
  google_live_music boolean,
  google_outdoor_seating boolean,
  google_photo_refs text[] not null default '{}',
  google_reservable boolean,
  google_business_status text,
  google_serves_beer boolean,
  google_serves_brunch boolean,
  google_serves_cocktails boolean,
  google_serves_dessert boolean,
  google_serves_dinner boolean,
  google_serves_vegetarian_food boolean,
  google_serves_wine boolean,
  google_types text[] not null default '{}',
  google_primary_type text,
  google_editorial_summary text,
  google_phone_number text,
  google_website_uri text,
  google_last_synced_at timestamptz,
  venue_latitude double precision,
  venue_longitude double precision,
  venue_energy text check (venue_energy in ('Chill', 'Moderate', 'High')),
  venue_scene text[] not null default '{}',
  venue_crowd text[] not null default '{}',
  venue_music text[] not null default '{}',
  venue_setting text[] not null default '{}',
  venue_price text check (venue_price in ('$', '$$', '$$$', '$$$$')),
  venue_noise_level text check (venue_noise_level in ('Quiet', 'Moderate', 'Lively')),
  venue_seating_types text[] not null default '{}',
  venue_formats text[] not null default '{}',
  venue_indoor_outdoor text[] not null default '{}',
  venue_reservation_friendly boolean,
  venue_group_friendly boolean,
  venue_good_for_conversation boolean,
  venue_good_for_cocktails boolean,
  venue_good_for_dinner boolean,
  venue_good_for_casual_meetups boolean,
  venue_vibes text[] not null default '{}',
  menu_experience_tags text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists restaurants_name_idx
on public.restaurants (name asc);

create index if not exists restaurants_unarchived_name_idx
on public.restaurants (name asc)
where archived_at is null;

create unique index if not exists restaurants_google_place_id_idx
on public.restaurants (google_place_id)
where google_place_id is not null;

create table if not exists public.venue_traits (
  restaurant_id bigint primary key references public.restaurants(id) on delete cascade,
  cuisine_tags text[] not null default '{}',
  vibe_tags text[] not null default '{}',
  setting_tags text[] not null default '{}',
  social_fit_tags text[] not null default '{}',
  price_band text check (price_band in ('$', '$$', '$$$', '$$$$')),
  confidence_score numeric(4,2) not null default 0.5,
  source text not null default 'google_places+rules',
  generated_at timestamptz not null default timezone('utc', now())
);

create index if not exists venue_traits_generated_at_idx
on public.venue_traits (generated_at desc);

alter table public.venue_traits enable row level security;

grant select on public.venue_traits to authenticated;

drop policy if exists "Authenticated users can view venue traits" on public.venue_traits;
create policy "Authenticated users can view venue traits"
on public.venue_traits
for select
to authenticated
using (true);

alter table public.restaurants enable row level security;

grant select on public.restaurants to authenticated;

drop policy if exists "Authenticated users can view restaurants" on public.restaurants;
create policy "Authenticated users can view restaurants"
on public.restaurants
for select
to authenticated
using (true);

create table if not exists public.saved_restaurants (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (restaurant_id, user_id)
);

create index if not exists saved_restaurants_user_created_idx
on public.saved_restaurants (user_id, created_at desc);

create index if not exists saved_restaurants_restaurant_idx
on public.saved_restaurants (restaurant_id);

alter table public.saved_restaurants enable row level security;

grant select, insert, delete on public.saved_restaurants to authenticated;

drop policy if exists "Users can view their own saved restaurants" on public.saved_restaurants;
create policy "Users can view their own saved restaurants"
on public.saved_restaurants
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own saved restaurants" on public.saved_restaurants;
create policy "Users can insert their own saved restaurants"
on public.saved_restaurants
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own saved restaurants" on public.saved_restaurants;
create policy "Users can delete their own saved restaurants"
on public.saved_restaurants
for delete
using (auth.uid() = user_id);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  title text not null,
  intent text not null check (intent in ('dating', 'friendship')),
  starts_at timestamptz not null,
  duration_minutes integer not null default 120 check (duration_minutes >= 30 and duration_minutes <= 360),
  minimum_viable_attendees integer not null default 2 check (minimum_viable_attendees >= 2 and minimum_viable_attendees <= capacity),
  viability_status text not null default 'healthy' check (viability_status in ('healthy', 'at_risk', 'forced_go', 'cancelled_low_confirmations')),
  restaurant_name text not null,
  restaurant_subregion text not null check (restaurant_subregion in ('Uptown', 'Midtown', 'Downtown')),
  restaurant_neighbourhood text,
  restaurant_cuisines text[] not null default '{}',
  venue_latitude double precision,
  venue_longitude double precision,
  venue_energy text check (venue_energy in ('Chill', 'Moderate', 'High')),
  venue_scene text[] not null default '{}',
  venue_crowd text[] not null default '{}',
  venue_music text[] not null default '{}',
  venue_setting text[] not null default '{}',
  venue_price text check (venue_price in ('$', '$$', '$$$', '$$$$')),
  google_open_now boolean,
  google_opening_hours text[] not null default '{}',
  google_good_for_groups boolean,
  google_good_for_watching_sports boolean,
  google_live_music boolean,
  google_outdoor_seating boolean,
  google_reservable boolean,
  google_serves_beer boolean,
  google_serves_brunch boolean,
  google_serves_cocktails boolean,
  google_serves_dessert boolean,
  google_serves_dinner boolean,
  google_serves_vegetarian_food boolean,
  google_serves_wine boolean,
  venue_noise_level text check (venue_noise_level in ('Quiet', 'Moderate', 'Lively')),
  venue_seating_types text[] not null default '{}',
  venue_formats text[] not null default '{}',
  venue_indoor_outdoor text[] not null default '{}',
  venue_reservation_friendly boolean,
  venue_group_friendly boolean,
  venue_good_for_conversation boolean,
  venue_good_for_cocktails boolean,
  venue_good_for_dinner boolean,
  venue_good_for_casual_meetups boolean,
  venue_vibes text[] not null default '{}',
  menu_experience_tags text[] not null default '{}',
  capacity integer not null default 12 check (capacity > 0 and capacity <= 200),
  description text,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  restaurant_id bigint references public.restaurants(id),
  created_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists events_upcoming_idx
on public.events (starts_at asc)
where status = 'open';

create index if not exists events_unarchived_starts_at_idx
on public.events (starts_at asc)
where archived_at is null;

create index if not exists events_restaurant_id_idx
on public.events (restaurant_id);

alter table public.events enable row level security;

grant select on public.events to authenticated;

drop policy if exists "Authenticated users can view events" on public.events;
create policy "Authenticated users can view events"
on public.events
for select
to authenticated
using (true);

create table if not exists public.event_signups (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'cancelled', 'removed', 'no_show')),
  day_of_confirmation_status text not null default 'pending' check (day_of_confirmation_status in ('pending', 'confirmed', 'declined')),
  day_of_confirmation_at timestamptz,
  restaurant_match_score integer not null default 0 check (restaurant_match_score >= 0 and restaurant_match_score <= 100),
  personal_match_score integer not null default 0 check (personal_match_score >= 0 and personal_match_score <= 100),
  personal_match_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create index if not exists event_signups_event_status_idx
on public.event_signups (event_id, status);

create index if not exists event_signups_user_status_idx
on public.event_signups (user_id, status);

alter table public.event_signups enable row level security;

grant select, insert, update on public.event_signups to authenticated;

drop policy if exists "Users can view their own event signups" on public.event_signups;
create policy "Users can view their own event signups"
on public.event_signups
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own event signups" on public.event_signups;
create policy "Users can insert their own event signups"
on public.event_signups
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own event signups" on public.event_signups;
create policy "Users can update their own event signups"
on public.event_signups
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.event_signups
drop constraint if exists event_signups_status_check;

alter table public.event_signups
add constraint event_signups_status_check
check (status in ('going', 'cancelled', 'removed', 'no_show', 'attended'));

alter table public.notifications
add column if not exists event_id bigint references public.events(id) on delete cascade;

alter table public.notifications
drop constraint if exists notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (
  type in (
    'event_signup',
    'event_update',
    'event_at_risk',
    'event_reminder_24h',
    'event_reminder_2h',
    'event_follow_up',
    'event_attendance',
    'event_day_confirmation',
    'restaurant_removed'
  )
);

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
  campaign_id bigint not null references public.promotion_campaigns(id) on delete cascade,
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

create or replace function public.mutate_promotion_campaign(
  p_action text,
  p_campaign_id bigint default null,
  p_name text default null,
  p_campaign_type text default null,
  p_restaurant_id bigint default null,
  p_event_id bigint default null,
  p_starts_on date default null,
  p_ends_on date default null,
  p_promotion_priority integer default null,
  p_internal_notes text default null,
  p_surfaces text[] default null,
  p_actor_id uuid default null
)
returns table (
  ok boolean,
  campaign_id bigint,
  error text
)
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_current public.promotion_campaigns%rowtype;
  v_current_surfaces text[] := '{}'::text[];
  v_next_name text;
  v_next_campaign_type text;
  v_next_restaurant_id bigint;
  v_next_event_id bigint;
  v_next_starts_on date;
  v_next_ends_on date;
  v_next_promotion_priority integer;
  v_next_internal_notes text;
  v_next_surfaces text[] := '{}'::text[];
  v_next_status text;
  v_has_reporting_data boolean := false;
  v_has_live_surface boolean := false;
  v_restaurant_archived_at timestamptz;
  v_event_archived_at timestamptz;
begin
  if p_action is null then
    return query select false, null::bigint, 'action is required.';
    return;
  end if;

  if p_action not in ('create', 'update', 'activate', 'pause', 'reactivate', 'end', 'delete') then
    return query select false, null::bigint, 'Invalid action.';
    return;
  end if;

  if p_action in ('create', 'update') and p_campaign_type is null then
    return query select false, null::bigint, 'campaignType is required.';
    return;
  end if;

  if array_position(coalesce(p_surfaces, '{}'::text[]), null) is not null then
    return query select false, coalesce(p_campaign_id, null::bigint), 'surfaces contains an invalid value.';
    return;
  end if;

  if p_action <> 'create' then
    if p_campaign_id is null then
      return query select false, null::bigint, 'campaignId is required.';
      return;
    end if;

    select *
    into v_current
    from public.promotion_campaigns
    where id = p_campaign_id
    for update;

    if not found then
      return query select false, null::bigint, 'Campaign not found.';
      return;
    end if;

    select coalesce(array_agg(pcs.surface order by pcs.surface), '{}'::text[])
    into v_current_surfaces
    from public.promotion_campaign_surfaces as pcs
    where pcs.campaign_id = v_current.id;
  end if;

  if p_action = 'create' then
    v_next_name := btrim(coalesce(p_name, ''));
    v_next_campaign_type := p_campaign_type;
    v_next_restaurant_id := p_restaurant_id;
    v_next_event_id := p_event_id;
    v_next_starts_on := p_starts_on;
    v_next_ends_on := p_ends_on;
    v_next_promotion_priority := p_promotion_priority;
    v_next_internal_notes := nullif(btrim(coalesce(p_internal_notes, '')), '');
    v_next_status := 'draft';
  elsif p_action = 'update' then
    if v_current.status = 'ended' then
      return query
      select false, v_current.id, 'Ended campaigns are read-only. Create a new campaign instead.';
      return;
    end if;

    v_next_name := btrim(coalesce(p_name, ''));
    v_next_campaign_type := p_campaign_type;
    v_next_restaurant_id := p_restaurant_id;
    v_next_event_id := p_event_id;
    v_next_starts_on := p_starts_on;
    v_next_ends_on := p_ends_on;
    v_next_promotion_priority := p_promotion_priority;
    v_next_internal_notes := nullif(btrim(coalesce(p_internal_notes, '')), '');
    v_next_status := v_current.status;

    select exists (
      select 1
      from public.promotion_campaign_daily_reports as pcdr
      where pcdr.campaign_id = v_current.id
    )
    into v_has_reporting_data;

    if v_has_reporting_data
      and (
        v_next_campaign_type is distinct from v_current.campaign_type
        or v_next_restaurant_id is distinct from v_current.restaurant_id
        or v_next_event_id is distinct from v_current.event_id
      ) then
      return query
      select
        false,
        v_current.id,
        'Campaign target and type cannot be changed after reporting has begun. Create a new campaign instead.';
      return;
    end if;
  elsif p_action = 'activate' then
    if v_current.status <> 'draft' then
      return query select false, v_current.id, 'Only draft campaigns can be activated.';
      return;
    end if;

    v_next_name := v_current.name;
    v_next_campaign_type := v_current.campaign_type;
    v_next_restaurant_id := v_current.restaurant_id;
    v_next_event_id := v_current.event_id;
    v_next_starts_on := v_current.starts_on;
    v_next_ends_on := v_current.ends_on;
    v_next_promotion_priority := v_current.promotion_priority;
    v_next_internal_notes := v_current.internal_notes;
    v_next_status := 'active';
    v_next_surfaces := v_current_surfaces;
  elsif p_action = 'pause' then
    if v_current.status <> 'active' then
      return query select false, v_current.id, 'Only active campaigns can be paused.';
      return;
    end if;

    update public.promotion_campaigns
    set status = 'paused',
        updated_at = v_now,
        updated_by = p_actor_id
    where id = v_current.id;

    return query select true, v_current.id, null::text;
    return;
  elsif p_action = 'reactivate' then
    if v_current.status = 'ended' then
      return query
      select false, v_current.id, 'Ended campaigns cannot be reactivated. Create a new campaign instead.';
      return;
    end if;

    if v_current.status <> 'paused' then
      return query select false, v_current.id, 'Only paused campaigns can be reactivated.';
      return;
    end if;

    v_next_name := v_current.name;
    v_next_campaign_type := v_current.campaign_type;
    v_next_restaurant_id := v_current.restaurant_id;
    v_next_event_id := v_current.event_id;
    v_next_starts_on := v_current.starts_on;
    v_next_ends_on := v_current.ends_on;
    v_next_promotion_priority := v_current.promotion_priority;
    v_next_internal_notes := v_current.internal_notes;
    v_next_status := 'active';
    v_next_surfaces := v_current_surfaces;
  elsif p_action = 'end' then
    if v_current.status = 'ended' then
      return query select false, v_current.id, 'Campaign is already ended.';
      return;
    end if;

    update public.promotion_campaigns
    set status = 'ended',
        updated_at = v_now,
        updated_by = p_actor_id
    where id = v_current.id;

    return query select true, v_current.id, null::text;
    return;
  elsif p_action = 'delete' then
    if v_current.status <> 'draft' then
      return query select false, v_current.id, 'Only draft campaigns may be deleted.';
      return;
    end if;

    delete from public.promotion_campaigns
    where id = v_current.id;

    return query select true, v_current.id, null::text;
    return;
  end if;

  if p_action in ('create', 'update') then
    select coalesce(array_agg(distinct surface_value order by surface_value), '{}'::text[])
    into v_next_surfaces
    from unnest(coalesce(p_surfaces, '{}'::text[])) as surface_value;
  end if;

  if v_next_name = '' then
    return query select false, coalesce(v_current.id, null::bigint), 'name is required.';
    return;
  end if;

  if v_next_campaign_type not in ('founding_partner', 'sponsored_listing', 'promoted_event') then
    return query select false, coalesce(v_current.id, null::bigint), 'campaignType is invalid.';
    return;
  end if;

  if v_next_starts_on is null or v_next_ends_on is null then
    return query
    select false, coalesce(v_current.id, null::bigint), 'startsOn and endsOn are required.';
    return;
  end if;

  if v_next_starts_on > v_next_ends_on then
    return query
    select false, coalesce(v_current.id, null::bigint), 'start date cannot be after end date.';
    return;
  end if;

  if v_next_promotion_priority is null or v_next_promotion_priority < 0 then
    return query
    select false, coalesce(v_current.id, null::bigint), 'promotionPriority must be a non-negative integer.';
    return;
  end if;

  if v_next_campaign_type = 'promoted_event' then
    if v_next_event_id is null or v_next_restaurant_id is not null then
      return query
      select false, coalesce(v_current.id, null::bigint), 'Promoted event campaigns must target exactly one event.';
      return;
    end if;

    select archived_at
    into v_event_archived_at
    from public.events
    where id = v_next_event_id;

    if not found then
      return query select false, coalesce(v_current.id, null::bigint), 'Event target not found.';
      return;
    end if;

    if v_event_archived_at is not null then
      return query
      select false, coalesce(v_current.id, null::bigint), 'Archived events cannot be used as active campaign targets.';
      return;
    end if;
  else
    if v_next_restaurant_id is null or v_next_event_id is not null then
      return query
      select false, coalesce(v_current.id, null::bigint), 'Restaurant campaigns must target exactly one restaurant.';
      return;
    end if;

    select archived_at
    into v_restaurant_archived_at
    from public.restaurants
    where id = v_next_restaurant_id;

    if not found then
      return query select false, coalesce(v_current.id, null::bigint), 'Restaurant target not found.';
      return;
    end if;

    if v_restaurant_archived_at is not null then
      return query
      select false, coalesce(v_current.id, null::bigint), 'Archived restaurants cannot be used as active campaign targets.';
      return;
    end if;
  end if;

  if exists (
    select 1
    from unnest(v_next_surfaces) as surface_value
    where surface_value not in (
      'restaurant_search',
      'restaurant_category',
      'restaurant_neighbourhood',
      'restaurant_recommendations',
      'event_list',
      'event_explore',
      'event_recommendations'
    )
  ) then
    return query
    select false, coalesce(v_current.id, null::bigint), 'surfaces contains an invalid value.';
    return;
  end if;

  if v_next_campaign_type = 'promoted_event' then
    if exists (
      select 1
      from unnest(v_next_surfaces) as surface_value
      where surface_value not in ('event_list', 'event_explore', 'event_recommendations')
    ) then
      return query
      select false, coalesce(v_current.id, null::bigint), 'Selected surfaces are not compatible with promoted_event.';
      return;
    end if;
  elsif exists (
    select 1
    from unnest(v_next_surfaces) as surface_value
    where surface_value not in (
      'restaurant_search',
      'restaurant_category',
      'restaurant_neighbourhood',
      'restaurant_recommendations'
    )
  ) then
    return query
    select false, coalesce(v_current.id, null::bigint), 'Selected surfaces are not compatible with restaurant campaigns.';
    return;
  end if;

  if v_next_status = 'active' and cardinality(v_next_surfaces) = 0 then
    return query
    select false, coalesce(v_current.id, null::bigint), 'A campaign must have at least one configured surface before it can become active.';
    return;
  end if;

  if v_next_status = 'active' then
    if v_next_campaign_type = 'promoted_event' then
      select exists (
        select 1
        from unnest(v_next_surfaces) as surface_value
        where surface_value = 'event_list'
      )
      into v_has_live_surface;
    else
      select exists (
        select 1
        from unnest(v_next_surfaces) as surface_value
        where surface_value in (
          'restaurant_search',
          'restaurant_category',
          'restaurant_neighbourhood',
          'restaurant_recommendations'
        )
      )
      into v_has_live_surface;
    end if;

    if not v_has_live_surface then
      return query
      select false, coalesce(v_current.id, null::bigint), 'A campaign must have at least one currently live compatible surface before it can become active.';
      return;
    end if;
  end if;

  if p_action = 'create' then
    insert into public.promotion_campaigns (
      campaign_type,
      created_by,
      ends_on,
      event_id,
      internal_notes,
      name,
      promotion_priority,
      restaurant_id,
      starts_on,
      status,
      updated_at,
      updated_by
    )
    values (
      v_next_campaign_type,
      p_actor_id,
      v_next_ends_on,
      v_next_event_id,
      v_next_internal_notes,
      v_next_name,
      v_next_promotion_priority,
      v_next_restaurant_id,
      v_next_starts_on,
      'draft',
      v_now,
      p_actor_id
    )
    returning id into p_campaign_id;

    insert into public.promotion_campaign_surfaces (campaign_id, surface)
    select p_campaign_id, surface_value
    from unnest(v_next_surfaces) as surface_value;

    return query select true, p_campaign_id, null::text;
    return;
  end if;

  update public.promotion_campaigns
  set campaign_type = v_next_campaign_type,
      ends_on = v_next_ends_on,
      event_id = v_next_event_id,
      internal_notes = v_next_internal_notes,
      name = v_next_name,
      promotion_priority = v_next_promotion_priority,
      restaurant_id = v_next_restaurant_id,
      starts_on = v_next_starts_on,
      status = v_next_status,
      updated_at = v_now,
      updated_by = p_actor_id
  where id = v_current.id;

  delete from public.promotion_campaign_surfaces as pcs
  where pcs.campaign_id = v_current.id
    and not (pcs.surface = any(v_next_surfaces));

  insert into public.promotion_campaign_surfaces (campaign_id, surface)
  select v_current.id, surface_value
  from unnest(v_next_surfaces) as surface_value
  where not exists (
    select 1
    from public.promotion_campaign_surfaces as existing_surface
    where existing_surface.campaign_id = v_current.id
      and existing_surface.surface = surface_value
  );

  return query select true, v_current.id, null::text;
exception
  when foreign_key_violation then
    return query
    select
      false,
      coalesce(v_current.id, p_campaign_id),
      'Campaign mutation failed because one or more configured surfaces already have dependent daily report rows.';
end;
$$;

revoke all on function public.mutate_promotion_campaign(
  text,
  bigint,
  text,
  text,
  bigint,
  bigint,
  date,
  date,
  integer,
  text,
  text[],
  uuid
) from public;

revoke all on function public.mutate_promotion_campaign(
  text,
  bigint,
  text,
  text,
  bigint,
  bigint,
  date,
  date,
  integer,
  text,
  text[],
  uuid
) from anon, authenticated;

grant execute on function public.mutate_promotion_campaign(
  text,
  bigint,
  text,
  text,
  bigint,
  bigint,
  date,
  date,
  integer,
  text,
  text[],
  uuid
) to service_role;

update public.profiles
set intent = 'friendship'
where intent is distinct from 'friendship';

update public.events
set intent = 'friendship'
where intent is distinct from 'friendship';

create table if not exists public.event_feedback (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_rating integer not null check (venue_rating between 1 and 5),
  group_rating integer not null check (group_rating between 1 and 5),
  would_join_again boolean not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create index if not exists event_feedback_event_idx
on public.event_feedback (event_id);

alter table public.event_feedback enable row level security;

grant select, insert, update on public.event_feedback to authenticated;

drop policy if exists "Users can view their own event feedback" on public.event_feedback;
create policy "Users can view their own event feedback"
on public.event_feedback
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own event feedback" on public.event_feedback;
create policy "Users can insert their own event feedback"
on public.event_feedback
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own event feedback" on public.event_feedback;
create policy "Users can update their own event feedback"
on public.event_feedback
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.notifications
drop constraint if exists notifications_user_id_match_id_type_key;

create unique index if not exists notifications_match_unique_idx
on public.notifications (user_id, match_id, type)
where match_id is not null;

create unique index if not exists notifications_event_unique_idx
on public.notifications (user_id, event_id, type)
where event_id is not null;

create or replace function public.join_event_signup_safe(
  p_event_id bigint,
  p_user_id uuid
)
returns table (
  ok boolean,
  status text,
  error text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_capacity integer;
  v_event_status text;
  v_existing_status text;
  v_attendee_count integer;
begin
  select e.capacity, e.status
  into v_event_capacity, v_event_status
  from public.events as e
  where e.id = p_event_id
  for update;

  if not found then
    return query select false, 'not_found', 'Event not found.';
    return;
  end if;

  if v_event_status <> 'open' then
    return query select false, 'closed', 'This event is not open for signups.';
    return;
  end if;

  select es.status
  into v_existing_status
  from public.event_signups as es
  where es.event_id = p_event_id
    and es.user_id = p_user_id
  for update;

  if coalesce(v_existing_status, '') = 'going' then
    return query select true, 'going', null::text;
    return;
  end if;

  select count(*)
  into v_attendee_count
  from public.event_signups as es
  where es.event_id = p_event_id
    and es.status = 'going';

  if v_attendee_count >= v_event_capacity then
    return query select false, 'full', 'This table is full. Try a similar table instead.';
    return;
  end if;

  insert into public.event_signups (
    day_of_confirmation_at,
    day_of_confirmation_status,
    event_id,
    status,
    updated_at,
    user_id
  )
  values (
    null,
    'pending',
    p_event_id,
    'going',
    timezone('utc', now()),
    p_user_id
  )
  on conflict (event_id, user_id)
  do update set
    day_of_confirmation_at = null,
    day_of_confirmation_status = 'pending',
    status = 'going',
    updated_at = excluded.updated_at;

  return query select true, 'going', null::text;
end;
$$;

grant execute on function public.join_event_signup_safe(bigint, uuid)
to authenticated, service_role;

drop table if exists public.matches cascade;
drop table if exists public.match_rounds cascade;
drop table if exists public.availability cascade;

alter table public.notifications
drop constraint if exists notifications_match_id_fkey;

alter table public.notifications
drop column if exists match_id;

drop index if exists notifications_match_unique_idx;
drop index if exists notifications_event_unique_idx;

create unique index if not exists notifications_event_unique_idx
on public.notifications (user_id, event_id, type)
where event_id is not null;

alter table public.notifications
drop constraint if exists notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (
  type in (
    'event_signup',
    'event_update',
    'event_at_risk',
    'event_reminder_24h',
    'event_reminder_2h',
    'event_follow_up',
    'event_attendance',
    'event_day_confirmation',
    'restaurant_removed'
  )
);
