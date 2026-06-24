alter table public.promotion_campaign_surfaces
drop constraint promotion_campaign_surfaces_campaign_id_fkey;

alter table public.promotion_campaign_surfaces
add constraint promotion_campaign_surfaces_campaign_id_fkey
foreign key (campaign_id)
references public.promotion_campaigns(id)
on delete cascade;

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

    select coalesce(array_agg(surface order by surface), '{}'::text[])
    into v_current_surfaces
    from public.promotion_campaign_surfaces
    where campaign_id = v_current.id;
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
      from public.promotion_campaign_daily_reports
      where campaign_id = v_current.id
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

  delete from public.promotion_campaign_surfaces
  where campaign_id = v_current.id
    and not (surface = any(v_next_surfaces));

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
