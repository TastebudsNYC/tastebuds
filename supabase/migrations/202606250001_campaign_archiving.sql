alter table public.promotion_campaigns
add column archived_at timestamptz;

alter table public.promotion_campaigns
add column archived_by uuid references auth.users(id) on delete set null;

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

  if p_action not in (
    'create',
    'update',
    'activate',
    'pause',
    'reactivate',
    'end',
    'delete',
    'archive',
    'unarchive'
  ) then
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
    if v_current.archived_at is not null then
      return query
      select false, v_current.id, 'Archived campaigns must be restored before they can be changed.';
      return;
    end if;

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
    if v_current.archived_at is not null then
      return query
      select false, v_current.id, 'Archived campaigns must be restored before they can be changed.';
      return;
    end if;

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
    if v_current.archived_at is not null then
      return query
      select false, v_current.id, 'Archived campaigns must be restored before they can be changed.';
      return;
    end if;

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
    if v_current.archived_at is not null then
      return query
      select false, v_current.id, 'Archived campaigns must be restored before they can be changed.';
      return;
    end if;

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
    if v_current.archived_at is not null then
      return query
      select false, v_current.id, 'Archived campaigns must be restored before they can be changed.';
      return;
    end if;

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
    if v_current.archived_at is not null then
      return query
      select false, v_current.id, 'Archived campaigns must be restored before they can be changed.';
      return;
    end if;

    if v_current.status <> 'draft' then
      return query select false, v_current.id, 'Only draft campaigns may be deleted.';
      return;
    end if;

    delete from public.promotion_campaigns
    where id = v_current.id;

    return query select true, v_current.id, null::text;
    return;
  elsif p_action = 'archive' then
    if v_current.status <> 'ended' then
      return query select false, v_current.id, 'Only ended campaigns can be archived.';
      return;
    end if;

    if v_current.archived_at is not null then
      return query select false, v_current.id, 'Campaign is already archived.';
      return;
    end if;

    update public.promotion_campaigns
    set archived_at = v_now,
        archived_by = p_actor_id,
        updated_at = v_now,
        updated_by = p_actor_id
    where id = v_current.id;

    return query select true, v_current.id, null::text;
    return;
  elsif p_action = 'unarchive' then
    if v_current.status <> 'ended' then
      return query select false, v_current.id, 'Only ended campaigns can be restored from archive.';
      return;
    end if;

    if v_current.archived_at is null then
      return query select false, v_current.id, 'Campaign is not archived.';
      return;
    end if;

    update public.promotion_campaigns
    set archived_at = null,
        archived_by = null,
        updated_at = v_now,
        updated_by = p_actor_id
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
          'restaurant_neighbourhood'
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

create or replace function public.record_promotion_campaign_metric(
  p_metric text,
  p_target_type text,
  p_target_id bigint,
  p_surface text
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_campaign_id bigint;
  v_metric text;
  v_report_date date;
begin
  v_metric := lower(trim(coalesce(p_metric, '')));
  v_report_date := timezone('America/New_York', now())::date;

  if v_metric not in (
    'impression',
    'venue_profile_view',
    'event_view',
    'save',
    'rsvp',
    'website_click'
  ) then
    raise exception 'Invalid promotion metric: %', p_metric;
  end if;

  if p_target_type not in ('restaurant', 'event') then
    raise exception 'Invalid promotion target type: %', p_target_type;
  end if;

  if p_target_id is null or p_target_id <= 0 then
    raise exception 'Invalid promotion target id: %', p_target_id;
  end if;

  if p_surface not in (
    'restaurant_search',
    'restaurant_category',
    'restaurant_neighbourhood',
    'event_list'
  ) then
    raise exception 'Invalid live promotion surface: %', p_surface;
  end if;

  if p_target_type = 'restaurant' and p_surface not in (
    'restaurant_search',
    'restaurant_category',
    'restaurant_neighbourhood'
  ) then
    raise exception 'Surface % is not compatible with restaurant targets.', p_surface;
  end if;

  if p_target_type = 'event' and p_surface <> 'event_list' then
    raise exception 'Surface % is not compatible with event targets.', p_surface;
  end if;

  if p_target_type = 'restaurant' and v_metric not in (
    'impression',
    'venue_profile_view',
    'save',
    'website_click'
  ) then
    raise exception 'Metric % is not compatible with restaurant targets.', p_metric;
  end if;

  if p_target_type = 'event' and v_metric not in (
    'impression',
    'event_view',
    'rsvp',
    'website_click'
  ) then
    raise exception 'Metric % is not compatible with event targets.', p_metric;
  end if;

  if p_target_type = 'restaurant' then
    select pc.id
    into v_campaign_id
    from public.promotion_campaigns as pc
    inner join public.promotion_campaign_surfaces as pcs
      on pcs.campaign_id = pc.id
     and pcs.surface = p_surface
    inner join public.restaurants as r
      on r.id = pc.restaurant_id
     and r.archived_at is null
    where pc.archived_at is null
      and pc.status = 'active'
      and pc.restaurant_id = p_target_id
      and pc.starts_on <= v_report_date
      and pc.ends_on >= v_report_date
    order by
      pc.promotion_priority desc,
      pc.starts_on asc,
      pc.id asc
    limit 1;
  else
    select pc.id
    into v_campaign_id
    from public.promotion_campaigns as pc
    inner join public.promotion_campaign_surfaces as pcs
      on pcs.campaign_id = pc.id
     and pcs.surface = p_surface
    inner join public.events as e
      on e.id = pc.event_id
     and e.archived_at is null
    where pc.archived_at is null
      and pc.status = 'active'
      and pc.event_id = p_target_id
      and pc.starts_on <= v_report_date
      and pc.ends_on >= v_report_date
    order by
      pc.promotion_priority desc,
      pc.starts_on asc,
      pc.id asc
    limit 1;
  end if;

  if v_campaign_id is null then
    return false;
  end if;

  insert into public.promotion_campaign_daily_reports (
    campaign_id,
    report_date,
    surface,
    impression_count,
    venue_profile_view_count,
    event_view_count,
    save_count,
    rsvp_count,
    website_click_count,
    created_at,
    updated_at
  )
  values (
    v_campaign_id,
    v_report_date,
    p_surface,
    case when v_metric = 'impression' then 1 else 0 end,
    case when v_metric = 'venue_profile_view' then 1 else 0 end,
    case when v_metric = 'event_view' then 1 else 0 end,
    case when v_metric = 'save' then 1 else 0 end,
    case when v_metric = 'rsvp' then 1 else 0 end,
    case when v_metric = 'website_click' then 1 else 0 end,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (campaign_id, report_date, surface)
  do update set
    impression_count = public.promotion_campaign_daily_reports.impression_count + excluded.impression_count,
    venue_profile_view_count = public.promotion_campaign_daily_reports.venue_profile_view_count + excluded.venue_profile_view_count,
    event_view_count = public.promotion_campaign_daily_reports.event_view_count + excluded.event_view_count,
    save_count = public.promotion_campaign_daily_reports.save_count + excluded.save_count,
    rsvp_count = public.promotion_campaign_daily_reports.rsvp_count + excluded.rsvp_count,
    website_click_count = public.promotion_campaign_daily_reports.website_click_count + excluded.website_click_count,
    updated_at = timezone('utc', now());

  return true;
end;
$$;
