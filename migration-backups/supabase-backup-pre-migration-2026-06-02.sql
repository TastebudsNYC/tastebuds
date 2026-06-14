


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."join_event_signup_safe"("p_event_id" bigint, "p_user_id" "uuid") RETURNS TABLE("ok" boolean, "status" "text", "error" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."join_event_signup_safe"("p_event_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_feedback" (
    "id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "venue_rating" integer NOT NULL,
    "group_rating" integer NOT NULL,
    "would_join_again" boolean NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "event_feedback_group_rating_check" CHECK ((("group_rating" >= 1) AND ("group_rating" <= 5))),
    CONSTRAINT "event_feedback_venue_rating_check" CHECK ((("venue_rating" >= 1) AND ("venue_rating" <= 5)))
);


ALTER TABLE "public"."event_feedback" OWNER TO "postgres";


ALTER TABLE "public"."event_feedback" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_feedback_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_signups" (
    "id" bigint NOT NULL,
    "event_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'going'::"text" NOT NULL,
    "restaurant_match_score" integer DEFAULT 0 NOT NULL,
    "personal_match_score" integer DEFAULT 0 NOT NULL,
    "personal_match_summary" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "day_of_confirmation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "day_of_confirmation_at" timestamp with time zone,
    CONSTRAINT "event_signups_day_of_confirmation_status_check" CHECK (("day_of_confirmation_status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'declined'::"text"]))),
    CONSTRAINT "event_signups_personal_match_score_check" CHECK ((("personal_match_score" >= 0) AND ("personal_match_score" <= 100))),
    CONSTRAINT "event_signups_restaurant_match_score_check" CHECK ((("restaurant_match_score" >= 0) AND ("restaurant_match_score" <= 100))),
    CONSTRAINT "event_signups_status_check" CHECK (("status" = ANY (ARRAY['going'::"text", 'cancelled'::"text", 'removed'::"text", 'no_show'::"text", 'attended'::"text"])))
);


ALTER TABLE "public"."event_signups" OWNER TO "postgres";


ALTER TABLE "public"."event_signups" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_signups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "intent" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "restaurant_name" "text" NOT NULL,
    "restaurant_subregion" "text" NOT NULL,
    "restaurant_neighbourhood" "text",
    "restaurant_cuisines" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "capacity" integer DEFAULT 12 NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "duration_minutes" integer DEFAULT 120 NOT NULL,
    "minimum_viable_attendees" integer DEFAULT 2 NOT NULL,
    "viability_status" "text" DEFAULT 'healthy'::"text" NOT NULL,
    "archived_at" timestamp with time zone,
    "venue_energy" "text",
    "venue_scene" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_crowd" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_music" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_setting" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_price" "text",
    "venue_latitude" double precision,
    "venue_longitude" double precision,
    "restaurant_id" bigint,
    "google_open_now" boolean,
    "google_opening_hours" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "google_good_for_groups" boolean,
    "google_good_for_watching_sports" boolean,
    "google_live_music" boolean,
    "google_outdoor_seating" boolean,
    "google_reservable" boolean,
    "google_serves_beer" boolean,
    "google_serves_brunch" boolean,
    "google_serves_cocktails" boolean,
    "google_serves_dessert" boolean,
    "google_serves_dinner" boolean,
    "google_serves_vegetarian_food" boolean,
    "google_serves_wine" boolean,
    "venue_noise_level" "text",
    "venue_seating_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_formats" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_indoor_outdoor" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_reservation_friendly" boolean,
    "venue_group_friendly" boolean,
    "venue_good_for_conversation" boolean,
    "venue_good_for_cocktails" boolean,
    "venue_good_for_dinner" boolean,
    "venue_good_for_casual_meetups" boolean,
    "venue_vibes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "menu_experience_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "events_capacity_check" CHECK ((("capacity" > 0) AND ("capacity" <= 200))),
    CONSTRAINT "events_duration_minutes_check" CHECK ((("duration_minutes" >= 30) AND ("duration_minutes" <= 360))),
    CONSTRAINT "events_intent_check" CHECK (("intent" = ANY (ARRAY['dating'::"text", 'friendship'::"text"]))),
    CONSTRAINT "events_minimum_viable_attendees_check" CHECK ((("minimum_viable_attendees" >= 2) AND ("minimum_viable_attendees" <= "capacity"))),
    CONSTRAINT "events_restaurant_subregion_check" CHECK (("restaurant_subregion" = ANY (ARRAY['Uptown'::"text", 'Midtown'::"text", 'Downtown'::"text"]))),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'closed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "events_venue_energy_check" CHECK (("venue_energy" = ANY (ARRAY['Chill'::"text", 'Moderate'::"text", 'High'::"text"]))),
    CONSTRAINT "events_venue_noise_level_check" CHECK (("venue_noise_level" = ANY (ARRAY['Quiet'::"text", 'Moderate'::"text", 'Lively'::"text"]))),
    CONSTRAINT "events_venue_price_check" CHECK (("venue_price" = ANY (ARRAY['$'::"text", '$$'::"text", '$$$'::"text", '$$$$'::"text"]))),
    CONSTRAINT "events_viability_status_check" CHECK (("viability_status" = ANY (ARRAY['healthy'::"text", 'at_risk'::"text", 'forced_go'::"text", 'cancelled_low_confirmations'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


ALTER TABLE "public"."events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "email_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "email_sent_at" timestamp with time zone,
    "email_attempted_at" timestamp with time zone,
    "email_error" "text",
    "email_provider_id" "text",
    "event_id" bigint,
    CONSTRAINT "notifications_email_status_check" CHECK (("email_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['event_signup'::"text", 'event_update'::"text", 'event_at_risk'::"text", 'event_reminder_24h'::"text", 'event_reminder_2h'::"text", 'event_follow_up'::"text", 'event_attendance'::"text", 'event_day_confirmation'::"text", 'restaurant_removed'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "city" "text" DEFAULT 'New York City'::"text" NOT NULL,
    "region" "text" DEFAULT 'Manhattan'::"text" NOT NULL,
    "subregion" "text" NOT NULL,
    "neighbourhood" "text",
    "intent" "text" NOT NULL,
    "max_travel_minutes" integer NOT NULL,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "cuisine_preferences" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "preferred_energy" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "preferred_scene" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "preferred_crowd" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "preferred_music" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "preferred_setting" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "preferred_price" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "home_latitude" double precision,
    "home_longitude" double precision,
    "preferred_vibes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "drinking_preferences" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "dietary_restrictions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "conversation_preference" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "age_range_comfort" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "group_size_comfort" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "profile_photo_url" "text",
    CONSTRAINT "profiles_intent_check" CHECK (("intent" = ANY (ARRAY['dating'::"text", 'friendship'::"text"]))),
    CONSTRAINT "profiles_max_travel_minutes_check" CHECK (("max_travel_minutes" = ANY (ARRAY[15, 30, 45]))),
    CONSTRAINT "profiles_subregion_check" CHECK (("subregion" = ANY (ARRAY['Uptown'::"text", 'Midtown'::"text", 'Downtown'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "subregion" "text" NOT NULL,
    "neighbourhood" "text",
    "cuisines" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_latitude" double precision,
    "venue_longitude" double precision,
    "venue_energy" "text",
    "venue_scene" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_crowd" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_music" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_setting" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_price" "text",
    "created_by" "uuid",
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "google_place_id" "text",
    "google_maps_uri" "text",
    "formatted_address" "text",
    "google_rating" numeric(3,2),
    "google_user_ratings_total" integer,
    "google_price_level" "text",
    "google_editorial_summary" "text",
    "google_phone_number" "text",
    "google_website_uri" "text",
    "google_open_now" boolean,
    "google_opening_hours" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "google_good_for_groups" boolean,
    "google_good_for_watching_sports" boolean,
    "google_live_music" boolean,
    "google_outdoor_seating" boolean,
    "google_reservable" boolean,
    "google_serves_beer" boolean,
    "google_serves_brunch" boolean,
    "google_serves_cocktails" boolean,
    "google_serves_dessert" boolean,
    "google_serves_dinner" boolean,
    "google_serves_vegetarian_food" boolean,
    "google_serves_wine" boolean,
    "venue_noise_level" "text",
    "venue_seating_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_formats" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_indoor_outdoor" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "venue_reservation_friendly" boolean,
    "venue_group_friendly" boolean,
    "venue_good_for_conversation" boolean,
    "venue_good_for_cocktails" boolean,
    "venue_good_for_dinner" boolean,
    "venue_good_for_casual_meetups" boolean,
    "venue_vibes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "menu_experience_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "google_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "google_primary_type" "text",
    "google_photo_refs" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "google_business_status" "text",
    "google_last_synced_at" timestamp with time zone,
    CONSTRAINT "restaurants_subregion_check" CHECK (("subregion" = ANY (ARRAY['Uptown'::"text", 'Midtown'::"text", 'Downtown'::"text"]))),
    CONSTRAINT "restaurants_venue_energy_check" CHECK (("venue_energy" = ANY (ARRAY['Chill'::"text", 'Moderate'::"text", 'High'::"text"]))),
    CONSTRAINT "restaurants_venue_noise_level_check" CHECK (("venue_noise_level" = ANY (ARRAY['Quiet'::"text", 'Moderate'::"text", 'Lively'::"text"]))),
    CONSTRAINT "restaurants_venue_price_check" CHECK (("venue_price" = ANY (ARRAY['$'::"text", '$$'::"text", '$$$'::"text", '$$$$'::"text"])))
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


ALTER TABLE "public"."restaurants" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."restaurants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."saved_restaurants" (
    "id" bigint NOT NULL,
    "restaurant_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."saved_restaurants" OWNER TO "postgres";


ALTER TABLE "public"."saved_restaurants" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."saved_restaurants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."venue_traits" (
    "restaurant_id" bigint NOT NULL,
    "cuisine_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "setting_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "social_fit_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "price_band" "text",
    "confidence_score" numeric(4,2) DEFAULT 0.5 NOT NULL,
    "source" "text" DEFAULT 'google_places+rules'::"text" NOT NULL,
    "generated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "venue_traits_price_band_check" CHECK (("price_band" = ANY (ARRAY['$'::"text", '$$'::"text", '$$$'::"text", '$$$$'::"text"])))
);


ALTER TABLE "public"."venue_traits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_signups"
    ADD CONSTRAINT "event_signups_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_signups"
    ADD CONSTRAINT "event_signups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_restaurants"
    ADD CONSTRAINT "saved_restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_restaurants"
    ADD CONSTRAINT "saved_restaurants_restaurant_id_user_id_key" UNIQUE ("restaurant_id", "user_id");



ALTER TABLE ONLY "public"."venue_traits"
    ADD CONSTRAINT "venue_traits_pkey" PRIMARY KEY ("restaurant_id");



CREATE INDEX "event_feedback_event_idx" ON "public"."event_feedback" USING "btree" ("event_id");



CREATE INDEX "event_signups_event_status_idx" ON "public"."event_signups" USING "btree" ("event_id", "status");



CREATE INDEX "event_signups_user_status_idx" ON "public"."event_signups" USING "btree" ("user_id", "status");



CREATE INDEX "events_restaurant_id_idx" ON "public"."events" USING "btree" ("restaurant_id");



CREATE INDEX "events_unarchived_starts_at_idx" ON "public"."events" USING "btree" ("starts_at") WHERE ("archived_at" IS NULL);



CREATE INDEX "events_upcoming_idx" ON "public"."events" USING "btree" ("starts_at") WHERE ("status" = 'open'::"text");



CREATE INDEX "notifications_email_pending_idx" ON "public"."notifications" USING "btree" ("created_at") WHERE (("email_sent_at" IS NULL) AND ("email_status" <> 'skipped'::"text"));



CREATE UNIQUE INDEX "notifications_event_unique_idx" ON "public"."notifications" USING "btree" ("user_id", "event_id", "type") WHERE ("event_id" IS NOT NULL);



CREATE INDEX "notifications_user_created_at_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "notifications_user_unread_idx" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("read_at" IS NULL);



CREATE UNIQUE INDEX "restaurants_google_place_id_idx" ON "public"."restaurants" USING "btree" ("google_place_id") WHERE ("google_place_id" IS NOT NULL);



CREATE INDEX "restaurants_name_idx" ON "public"."restaurants" USING "btree" ("name");



CREATE INDEX "restaurants_unarchived_name_idx" ON "public"."restaurants" USING "btree" ("name") WHERE ("archived_at" IS NULL);



CREATE INDEX "saved_restaurants_restaurant_idx" ON "public"."saved_restaurants" USING "btree" ("restaurant_id");



CREATE INDEX "saved_restaurants_user_created_idx" ON "public"."saved_restaurants" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "venue_traits_generated_at_idx" ON "public"."venue_traits" USING "btree" ("generated_at" DESC);



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_signups"
    ADD CONSTRAINT "event_signups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_signups"
    ADD CONSTRAINT "event_signups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."saved_restaurants"
    ADD CONSTRAINT "saved_restaurants_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_restaurants"
    ADD CONSTRAINT "saved_restaurants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_traits"
    ADD CONSTRAINT "venue_traits_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can view events" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view restaurants" ON "public"."restaurants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view venue traits" ON "public"."venue_traits" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own saved restaurants" ON "public"."saved_restaurants" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own event feedback" ON "public"."event_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own event signups" ON "public"."event_signups" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own saved restaurants" ON "public"."saved_restaurants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can mark their own notifications read" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own event feedback" ON "public"."event_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own event signups" ON "public"."event_signups" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own event feedback" ON "public"."event_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own event signups" ON "public"."event_signups" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own saved restaurants" ON "public"."saved_restaurants" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."event_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_signups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venue_traits" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."join_event_signup_safe"("p_event_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_event_signup_safe"("p_event_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_event_signup_safe"("p_event_id" bigint, "p_user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."event_feedback" TO "anon";
GRANT ALL ON TABLE "public"."event_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."event_feedback" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_feedback_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_feedback_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_feedback_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_signups" TO "anon";
GRANT ALL ON TABLE "public"."event_signups" TO "authenticated";
GRANT ALL ON TABLE "public"."event_signups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_signups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_signups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_signups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."restaurants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."saved_restaurants" TO "anon";
GRANT ALL ON TABLE "public"."saved_restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_restaurants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."saved_restaurants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."saved_restaurants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."saved_restaurants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."venue_traits" TO "anon";
GRANT ALL ON TABLE "public"."venue_traits" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_traits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































