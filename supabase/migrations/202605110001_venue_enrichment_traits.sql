alter table public.restaurants
add column if not exists google_types text[] not null default '{}';

alter table public.restaurants
add column if not exists google_primary_type text;

alter table public.restaurants
add column if not exists google_photo_refs text[] not null default '{}';

alter table public.restaurants
add column if not exists google_business_status text;

alter table public.restaurants
add column if not exists google_last_synced_at timestamptz;

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
