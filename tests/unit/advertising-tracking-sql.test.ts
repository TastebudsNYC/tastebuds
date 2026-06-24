import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('advertising attribution SQL', () => {
  it('uses an atomic upsert increment with New York report dates and service-role-only execution', () => {
    const migrationSql = readFileSync(
      'supabase/migrations/202606240004_record_promotion_campaign_metrics.sql',
      'utf8'
    )

    expect(migrationSql).toContain("timezone('America/New_York', now())::date")
    expect(migrationSql).toContain('on conflict (campaign_id, report_date, surface)')
    expect(migrationSql).toContain(
      'impression_count = public.promotion_campaign_daily_reports.impression_count + excluded.impression_count'
    )
    expect(migrationSql).toContain(
      'venue_profile_view_count = public.promotion_campaign_daily_reports.venue_profile_view_count + excluded.venue_profile_view_count'
    )
    expect(migrationSql).toContain(
      'event_view_count = public.promotion_campaign_daily_reports.event_view_count + excluded.event_view_count'
    )
    expect(migrationSql).toContain(
      'save_count = public.promotion_campaign_daily_reports.save_count + excluded.save_count'
    )
    expect(migrationSql).toContain(
      'rsvp_count = public.promotion_campaign_daily_reports.rsvp_count + excluded.rsvp_count'
    )
    expect(migrationSql).toContain(
      'website_click_count = public.promotion_campaign_daily_reports.website_click_count + excluded.website_click_count'
    )
    expect(migrationSql).toContain(
      'revoke all on function public.record_promotion_campaign_metric(text, text, bigint, text) from public;'
    )
    expect(migrationSql).toContain(
      'revoke all on function public.record_promotion_campaign_metric(text, text, bigint, text) from anon, authenticated;'
    )
    expect(migrationSql).toContain(
      'grant execute on function public.record_promotion_campaign_metric(text, text, bigint, text) to service_role;'
    )
  })

  it('rejects invalid metric and target combinations before any report row can be incremented', () => {
    const migrationSql = readFileSync(
      'supabase/migrations/202606240004_record_promotion_campaign_metrics.sql',
      'utf8'
    )

    expect(migrationSql).toContain(
      "if p_target_type = 'restaurant' and v_metric not in ("
    )
    expect(migrationSql).toContain("'venue_profile_view'")
    expect(migrationSql).toContain("'save'")
    expect(migrationSql).toContain(
      "raise exception 'Metric % is not compatible with restaurant targets.', p_metric;"
    )
    expect(migrationSql).toContain(
      "if p_target_type = 'event' and v_metric not in ("
    )
    expect(migrationSql).toContain("'event_view'")
    expect(migrationSql).toContain("'rsvp'")
    expect(migrationSql).toContain(
      "raise exception 'Metric % is not compatible with event targets.', p_metric;"
    )
  })
})
