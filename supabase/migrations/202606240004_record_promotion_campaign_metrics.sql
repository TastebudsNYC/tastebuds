create function public.record_promotion_campaign_metric(
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
    where pc.status = 'active'
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
    where pc.status = 'active'
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

revoke all on function public.record_promotion_campaign_metric(text, text, bigint, text) from public;
revoke all on function public.record_promotion_campaign_metric(text, text, bigint, text) from anon, authenticated;
grant execute on function public.record_promotion_campaign_metric(text, text, bigint, text) to service_role;
