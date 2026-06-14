SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict e3i7f2Fdm4rtcIbW9ei3qTwC5LjHqnycKHbytU4OWhW1KaRFmAyEeU0R9aEmkL0

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	53e38dfe-c899-491d-897e-9e80724ff339	authenticated	authenticated	aaron.smart2000@gmail.com	$2a$10$n4M4Aex4xLEbNfHYRGhua.QsfiOwPhunmk999kQEvoBA2aKgYW0eK	2026-04-25 17:57:15.861809+00	\N		\N		\N			\N	2026-05-28 11:47:01.543726+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-25 17:57:15.845692+00	2026-05-28 11:47:01.60187+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	98676ed9-6cf2-4471-8e5b-766e892e1818	authenticated	authenticated	jeffrey.pearce@yahoo.com	$2a$10$D3SI0Eg9VUyyngxrkFZb/uLWTer69KpfGWZX/iAifrWClYhmEJ62y	2026-05-28 18:41:28.732103+00	\N		2026-05-28 18:40:36.518693+00		\N			\N	2026-06-02 18:06:43.920718+00	{"provider": "email", "providers": ["email"]}	{"sub": "98676ed9-6cf2-4471-8e5b-766e892e1818", "email": "jeffrey.pearce@yahoo.com", "email_verified": true, "phone_verified": false}	\N	2026-05-28 18:40:36.477438+00	2026-06-02 18:06:43.951096+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	6eb4e006-0d56-4600-bb45-887a885e7ee0	authenticated	authenticated	aaron.george.smart@gmail.com	$2a$10$qwCECQg8Uf3FSn7WYOq1luW1.X7LejkZQmgq7daIKu3k7tungyPz6	2026-04-14 20:58:10.009073+00	\N		2026-04-14 20:58:04.240172+00		\N			\N	2026-06-01 16:31:24.301087+00	{"provider": "email", "providers": ["email"]}	{"sub": "6eb4e006-0d56-4600-bb45-887a885e7ee0", "email": "aaron.george.smart@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-14 20:58:04.22264+00	2026-06-02 18:39:36.864659+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
6eb4e006-0d56-4600-bb45-887a885e7ee0	6eb4e006-0d56-4600-bb45-887a885e7ee0	{"sub": "6eb4e006-0d56-4600-bb45-887a885e7ee0", "email": "aaron.george.smart@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-04-14 20:58:04.235503+00	2026-04-14 20:58:04.235547+00	2026-04-14 20:58:04.235547+00	cc5e537a-111b-4e6d-9cf3-ebd72462d4f0
53e38dfe-c899-491d-897e-9e80724ff339	53e38dfe-c899-491d-897e-9e80724ff339	{"sub": "53e38dfe-c899-491d-897e-9e80724ff339", "email": "aaron.smart2000@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-25 17:57:15.858794+00	2026-04-25 17:57:15.858851+00	2026-04-25 17:57:15.858851+00	fc1e4f7b-2596-4d60-a60e-dd2508494c97
98676ed9-6cf2-4471-8e5b-766e892e1818	98676ed9-6cf2-4471-8e5b-766e892e1818	{"sub": "98676ed9-6cf2-4471-8e5b-766e892e1818", "email": "jeffrey.pearce@yahoo.com", "email_verified": true, "phone_verified": false}	email	2026-05-28 18:40:36.510211+00	2026-05-28 18:40:36.510261+00	2026-05-28 18:40:36.510261+00	3f120191-069d-4f29-aa1a-1cd92e81bc5a
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
634a823e-1996-45de-a354-989bd0c2f6d3	53e38dfe-c899-491d-897e-9e80724ff339	2026-05-28 11:47:01.544845+00	2026-05-28 11:47:01.544845+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	195.184.250.239	\N	\N	\N	\N	\N
38a42013-cabf-4b38-9779-29fcfaec1594	53e38dfe-c899-491d-897e-9e80724ff339	2026-05-01 14:34:00.001209+00	2026-05-01 14:34:00.001209+00	\N	aal1	\N	\N	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36	195.184.250.239	\N	\N	\N	\N	\N
89052671-8f0a-425f-9e5d-cecfd0b01cb1	98676ed9-6cf2-4471-8e5b-766e892e1818	2026-06-02 18:06:43.921902+00	2026-06-02 18:06:43.921902+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	24.44.19.228	\N	\N	\N	\N	\N
d2eb61ef-6c6c-4be2-8125-bba0bac95c9f	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-06-01 16:31:24.302005+00	2026-06-02 18:39:36.876864+00	\N	aal1	\N	2026-06-02 18:39:36.876756	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	195.184.250.239	\N	\N	\N	\N	\N
6cb84d61-121f-43dc-8856-dd97bf73d298	53e38dfe-c899-491d-897e-9e80724ff339	2026-05-11 12:35:44.534162+00	2026-05-12 17:01:16.760914+00	\N	aal1	\N	2026-05-12 17:01:16.760802	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	194.105.135.13	\N	\N	\N	\N	\N
fecd6f6b-e3b9-4232-a752-022966a23b38	53e38dfe-c899-491d-897e-9e80724ff339	2026-05-27 15:15:10.764871+00	2026-05-28 10:53:40.379747+00	\N	aal1	\N	2026-05-28 10:53:40.379599	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	195.184.250.239	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
38a42013-cabf-4b38-9779-29fcfaec1594	2026-05-01 14:34:00.091747+00	2026-05-01 14:34:00.091747+00	password	d47d3fde-5804-4d36-bf8b-b88b15f7a22a
6cb84d61-121f-43dc-8856-dd97bf73d298	2026-05-11 12:35:44.586022+00	2026-05-11 12:35:44.586022+00	password	1d424cca-10c4-4d8e-9291-d3c9708bec0a
fecd6f6b-e3b9-4232-a752-022966a23b38	2026-05-27 15:15:10.828826+00	2026-05-27 15:15:10.828826+00	password	75781495-426d-41a3-91da-b2de42258157
634a823e-1996-45de-a354-989bd0c2f6d3	2026-05-28 11:47:01.617196+00	2026-05-28 11:47:01.617196+00	password	b4e0832e-93d4-488b-a6e5-5ab3b9df4126
d2eb61ef-6c6c-4be2-8125-bba0bac95c9f	2026-06-01 16:31:24.313162+00	2026-06-01 16:31:24.313162+00	password	78f3637d-04b8-4507-83bf-b46670e26e1d
89052671-8f0a-425f-9e5d-cecfd0b01cb1	2026-06-02 18:06:43.957319+00	2026-06-02 18:06:43.957319+00	password	3e0291b6-5088-4b4f-b6d3-78fa9d0b5315
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	85	3uylvnhyj6ye	53e38dfe-c899-491d-897e-9e80724ff339	f	2026-05-01 14:34:00.046762+00	2026-05-01 14:34:00.046762+00	\N	38a42013-cabf-4b38-9779-29fcfaec1594
00000000-0000-0000-0000-000000000000	102	oh7zwgbxbns5	53e38dfe-c899-491d-897e-9e80724ff339	t	2026-05-11 12:35:44.558458+00	2026-05-11 18:02:46.003034+00	\N	6cb84d61-121f-43dc-8856-dd97bf73d298
00000000-0000-0000-0000-000000000000	174	veaxcm5x6owv	6eb4e006-0d56-4600-bb45-887a885e7ee0	t	2026-06-01 16:31:24.308542+00	2026-06-02 11:26:19.599151+00	\N	d2eb61ef-6c6c-4be2-8125-bba0bac95c9f
00000000-0000-0000-0000-000000000000	177	dx2uv4tkwyvp	6eb4e006-0d56-4600-bb45-887a885e7ee0	t	2026-06-02 11:26:19.613255+00	2026-06-02 12:25:49.056064+00	veaxcm5x6owv	d2eb61ef-6c6c-4be2-8125-bba0bac95c9f
00000000-0000-0000-0000-000000000000	178	eljemh5vpdmv	6eb4e006-0d56-4600-bb45-887a885e7ee0	t	2026-06-02 12:25:49.067686+00	2026-06-02 16:31:15.621187+00	dx2uv4tkwyvp	d2eb61ef-6c6c-4be2-8125-bba0bac95c9f
00000000-0000-0000-0000-000000000000	179	wv7btl25f2m7	6eb4e006-0d56-4600-bb45-887a885e7ee0	t	2026-06-02 16:31:15.63851+00	2026-06-02 17:37:57.942821+00	eljemh5vpdmv	d2eb61ef-6c6c-4be2-8125-bba0bac95c9f
00000000-0000-0000-0000-000000000000	140	cxytp5fcij3p	53e38dfe-c899-491d-897e-9e80724ff339	t	2026-05-27 15:15:10.802465+00	2026-05-27 16:13:24.804272+00	\N	fecd6f6b-e3b9-4232-a752-022966a23b38
00000000-0000-0000-0000-000000000000	181	3ttvwoa6kqxz	98676ed9-6cf2-4471-8e5b-766e892e1818	f	2026-06-02 18:06:43.945529+00	2026-06-02 18:06:43.945529+00	\N	89052671-8f0a-425f-9e5d-cecfd0b01cb1
00000000-0000-0000-0000-000000000000	180	wo6canwrywr3	6eb4e006-0d56-4600-bb45-887a885e7ee0	t	2026-06-02 17:37:57.960905+00	2026-06-02 18:39:36.831818+00	wv7btl25f2m7	d2eb61ef-6c6c-4be2-8125-bba0bac95c9f
00000000-0000-0000-0000-000000000000	182	n57jd4bmzoet	6eb4e006-0d56-4600-bb45-887a885e7ee0	f	2026-06-02 18:39:36.85289+00	2026-06-02 18:39:36.85289+00	wo6canwrywr3	d2eb61ef-6c6c-4be2-8125-bba0bac95c9f
00000000-0000-0000-0000-000000000000	107	ntridwmgoola	53e38dfe-c899-491d-897e-9e80724ff339	t	2026-05-11 18:02:46.019929+00	2026-05-12 07:47:27.895338+00	oh7zwgbxbns5	6cb84d61-121f-43dc-8856-dd97bf73d298
00000000-0000-0000-0000-000000000000	141	4kgkn7w4yflr	53e38dfe-c899-491d-897e-9e80724ff339	t	2026-05-27 16:13:24.825277+00	2026-05-28 10:53:40.341131+00	cxytp5fcij3p	fecd6f6b-e3b9-4232-a752-022966a23b38
00000000-0000-0000-0000-000000000000	143	f3uzh6x6df2i	53e38dfe-c899-491d-897e-9e80724ff339	f	2026-05-28 10:53:40.353795+00	2026-05-28 10:53:40.353795+00	4kgkn7w4yflr	fecd6f6b-e3b9-4232-a752-022966a23b38
00000000-0000-0000-0000-000000000000	112	46esdrgc43bc	53e38dfe-c899-491d-897e-9e80724ff339	t	2026-05-12 07:47:27.917781+00	2026-05-12 17:01:16.707553+00	ntridwmgoola	6cb84d61-121f-43dc-8856-dd97bf73d298
00000000-0000-0000-0000-000000000000	114	dx6fikfe5gbw	53e38dfe-c899-491d-897e-9e80724ff339	f	2026-05-12 17:01:16.7298+00	2026-05-12 17:01:16.7298+00	46esdrgc43bc	6cb84d61-121f-43dc-8856-dd97bf73d298
00000000-0000-0000-0000-000000000000	144	uurcapz7ufbh	53e38dfe-c899-491d-897e-9e80724ff339	f	2026-05-28 11:47:01.568059+00	2026-05-28 11:47:01.568059+00	\N	634a823e-1996-45de-a354-989bd0c2f6d3
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."restaurants" ("id", "name", "subregion", "neighbourhood", "cuisines", "venue_latitude", "venue_longitude", "venue_energy", "venue_scene", "venue_crowd", "venue_music", "venue_setting", "venue_price", "created_by", "archived_at", "created_at", "google_place_id", "google_maps_uri", "formatted_address", "google_rating", "google_user_ratings_total", "google_price_level", "google_editorial_summary", "google_phone_number", "google_website_uri", "google_open_now", "google_opening_hours", "google_good_for_groups", "google_good_for_watching_sports", "google_live_music", "google_outdoor_seating", "google_reservable", "google_serves_beer", "google_serves_brunch", "google_serves_cocktails", "google_serves_dessert", "google_serves_dinner", "google_serves_vegetarian_food", "google_serves_wine", "venue_noise_level", "venue_seating_types", "venue_formats", "venue_indoor_outdoor", "venue_reservation_friendly", "venue_group_friendly", "venue_good_for_conversation", "venue_good_for_cocktails", "venue_good_for_dinner", "venue_good_for_casual_meetups", "venue_vibes", "menu_experience_tags", "google_types", "google_primary_type", "google_photo_refs", "google_business_status", "google_last_synced_at") FROM stdin;
7	Bus Stop Diner	Midtown	\N	{diner,american}	40.8203471	-73.95522749999999	Moderate	{Social,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$	6eb4e006-0d56-4600-bb45-887a885e7ee0	\N	2026-05-11 19:39:09.282092+00	ChIJ1-1nIGb2wokRGkbd6xcyibc	https://maps.google.com/?cid=13225156859072955930&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA	3341 Broadway, New York, NY 10031, USA	3.90	977	PRICE_LEVEL_INEXPENSIVE	Diner where usual list of breakfast items & burgers share menu space with healthier salads & wraps.	(212) 690-2150	http://busstopdiner.nyc/	t	{"Monday: 12:00 AM – 11:55 PM","Tuesday: 5:00 AM – 11:55 PM","Wednesday: Open 24 hours","Thursday: Open 24 hours","Friday: Open 24 hours","Saturday: Open 24 hours","Sunday: Open 24 hours"}	t	t	f	\N	t	t	t	t	t	t	t	t	Moderate	{Tables,Booths}	{Restaurant}	{Indoor}	f	t	t	f	t	t	{Social,Chill,Casual}	{Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options",Brunch,Cocktails,"Shareable food","Late-night food"}	{diner,breakfast_restaurant,meal_delivery,food_delivery,restaurant,food,point_of_interest,establishment}	diner	{places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-tVkD4UbBh2rnw_HRnN4YCrfzrU17o3ZBi18UGw2Tp4w5wSZU970XD0Z5beHBaLJcYvRtM7lQJOThJBnZy_XZ-H-WLWz3L4MVHwJZkrRugkI-D2IP5BZ41xRU_fJGYFiyuzvuhpXN1NyVL8M-S3TeKpOVWKovzEYCIn1EIbWXFKcsgQkL9K8uXr60WyQnw0Cd8vBNREFMFXzwgkV5ztn2Afo_HEAaNhwRsaUDkXnIsUQq7Fhg8vPkGsOqEcA6VFwZhNP3M2-oTyJAAs2OMMLRWJL9dlkybcqpp4aOXhlMpDGdA0zNj8NxzofsW7SSYI302RvoWrz9f-HRsRx_qryrovPzabSih7MXm2Ssl9pyeR2uC9qRWAVLbTaMgEce2pasGdE66H5lulsQa4v39yChev-KHANZllXuKm3MRXygTIQeHT,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-uQCnpFpnEZZfDuKnLffT_poGWDliVUETi75G1HCHJjMt7PoJZXCv_4tHZZGZvXujILt8poRIiak2l6-C0qU2mG2BTMiQnq78vFYV4RHQBGW8WvDrBNs7CWzpeHigdxrPK_fNbwjhPKdnVHifvpQuoAybCRVTUDdow8CjIVCb2q8wsuaS2BuQPT3MEJ0xHdzAXKBaH4BfWMDqdh8xnvxbWDwByOO0SM3AhqnXWNYg_emzUSwYzrUiHqhba_pTb7nmNZ7YMD2DlmUWVfW-99XTvLZ0apQgfbKpMMK8w4QFRBdTx7HDnyLkfWoMhR5ehq7kOEYY96XPwKkQhRu5FSgGb4hj6RGpQY-kAt1DdXhtWyKpbX2izd8XLWSxItuJlqIw3u4nlFuV0yV-qAoh6GrBMUKyVTIat2c9dGWI3nTbw,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-ulX2WR_sEY2wP7o1UPDKRgcTKlovXyNuGeMl-dORtMTXP9tfPUPS5gfCT9avhpPZj9Rey3Xxy-hkO8FQBwiX2DRKAtoJ6jHxtUPycHk5HAJBB4l5Re7kwX5RbFL7ohuSzFbV7U6atljqrjZU_QRF69H6oSg_UreFRzfzB4q2ETLe5PQagnmuPwYKBrux18oGmhnK20jgDREF9hY1KSIriYOe9uPJxGbbApzfob5vatN1fTdmX4DUd20rohEg-cUbbUOz7nNOfFGsthDg80Fz_KcYR4Z5aQOYz9Z7grT8mPjU-NV8taExzWR90vAA65JklGyOjedIr47cAcxGs_Tyynq-YtEOgkNBnmAVmZ2ZwN2Wp6qnP9UVNqkDXOKQ2e_x4UaTHWvBcEHTDyaK-8r5nIdGHKjnRs3LANBXXwVzFqv6LE,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-vooXp4pbyvFxnTzTNjnGvTJkS_8-a2mE7PNtSTNZiLhMt3gOoZxid7Xi2E6j-0IVE5HDCPCosknJyEEkduwVcw6CUQ8c6vaFulZptgZizz7c_lXd4fiQ-jfgEV41zaDGuA7fKQaUUnXyOiucZkdUdBgzFb1hEeym-2hBn8dmiWgZTdduQnPYcMvuGlXsBEm0Q-vhYN0NDQqjG3qVmjSCd32TzqEVBxQysb2efCVcOn46QzCWSCnXzGr5wyN5iJ0lKzrAvOKNUuiaU0exIcdguJoGOqwzmV2dR5jMUIKcZb6ClE9lpOW1aU-REoHULtbUqv5IQBLHWM6exV2s_GLY55EvrwOPGWX6edlxUT_4qN1P34y4nrBYFh44rMYrbQ8GbroKaoEvXzxOGM_I-O8cW2FK7JP4JP8yHJwny63mWdpQ,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-usUjwghegDLuEkgaaAReUM5wHk9w45BDFUJ70FygOtgS4l4kdckfsWf-9stes3vM0PHIurEu9yftaY9YHsBm_hVLTRvyojQdsyTzMzDJmfng6z_kVIh8bf58MMMZ0men5WitX5rNRn0Lxr5e9vAlahxsEH6IX1nGUROvrl5ssvyy2UjikSpZlvNpSzUlFcjtv0-PLf6BjZXpZAGlMaskOJsd44D5iWVkFvjgLYsrkaEHA58whuf_1jICPZMfgkeqw9gzHrpwYM2PBL-JLhDLCENtJBXFcOKonxLawAO3bUX3ekUu6LqjrxJb4UErJzdJRJkLaTCBUvhGVh5WQ5UNdSUYwG6LjNB7VQ2AKiibWNGOUjifdLIJCRfegAkZLZpAwE94fkbvKOnlsDtThytOI9BiaH7OnTuCHGca5W34L-DZmZ,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-tEVY4A8VHnHjlACBPJquJSCdBo19wBD23GxxBKcW1fY0aNFebAiS1EojAQjNmhOec27LfYI9VeyudzfAi25kn0vxjCWty90k0xLz6tCrkfIzdBQGL8-TALeaCKft1-carmLD8QYi5hQBOKdDZTIYq4fuWRYUNEQRSLVKOKVMo0Q8iRLun8KM5FFstg1GeSbHamYklDKlQ55Uh8qNgVPk5iHT9_pNfF67N66YWrroik2VgzUA3NqNWraIUVENk229mg7JNSRmqADTDLgBQaCFAxC9CwwiVzj5d7vaeSYlrsrGgk2ta1YOdE9stoYBedsBhAuVfAFi4ODtaXgQbu9OtiXUD3fMuxC8BDCbeAnKZUV_oMI-71hUBMDVSKuJn7psnfV5lteguaKEg4w0mqmgyaoYC8EfC5QylWM8a-AN4cd62q,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-sxuuJGyOe86U3iMyqhNvezQIoVrQKiGZGCizEggS2yINlpQsm8ptBizlPzC90DxIYF3b_pmnLdjHmPbz0gzrw_x9n2M0kh1HwfXdDeZzsWYt4A4GxQtTwuzBNvBpSGPeN5e0JUu4ojPC6cgJWaisPAv5hNYbD4H8Cw02gnAQP9uofJCQ5l2_vM17YHGJr3WqB1o5o1Zu6Ss6DLrm7pYXEEra9N8bqUHGkgSzISpQ2Yo17XW4lOSvlhVaXyORXJA4TeixpZm87Vkxskxx11gIwnzcbwAVDoKu6mAJ7zSteMnfk_auGy0iPqQgTHKvbKk_RnJ-AgIjuwb9ByncRkE7ykNey_dsTF798IereypoyzxAxojkjBC-bIAOcAcOWMCgcwHYBW3QQBaA_WmQ2mkJIKeo7ZTFJEfg-VMXEavbnNQg,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-twxC-eAFx1_YGmtv693iyQiWF9JAQDsnqJb9fd_P5pIGRqyCBbJ1aO09T87hBlnhOVx0nSFONIKT1V4Fk3NRjdq-UFDFQyFxErnHajHW-U1icJjBXBwENtDYWiuJoFOogMO80GcMfI_YvdDcEbx3cx_LRS76PE9WibdBV-WT-UQ1eWoAvRsxWGa2B1kjSgEzCsO5WHG5G2FkhGH9Yx_qNGI8NhMOEIhggWTLXfEcAhRptKPbB4fHvfirZasIr4tZvnGh4WK9mLsNdllnHAriUkbjBPkYjGzymFTkUPs4Jxx4oOjFt8grXSeapdtnWKb8RryrZ3_OI4cjEdab9j6vLpBDU68xmMj0-w1rp18YMkXvQM6IbG4IG2zYNvLd4SluzS11Z0H7pyhheJ_IvV5fMwd4Ak0lzFfUInwuoCaAB8Rw,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-vuf4ZnvLxQOuJBxH8K4vOw6k7ysTJM8eTDHLq_3LnmUwtzxLmBGwPPtFdP5gGSuccZrrBIPTrjTRSj5cL0bUZFdt6dUki2F0U8KBskseaKKxA00Kps00tPzY01C8gLEqgAoOmicTYBxyqXoRKbsDxGFNYziaW9Sjup6F37XLPk5cTwOIP6l9_MYh9TZxt6A6ungVg1mweJ_ZD7oDZAoB1h9TLAUDKDzjFslrDKmc929ZfwokuUofqvXcjqyTGR64sONDXP6dFs_aeqVOl7b88TZ9mcYWLvWlxMVvX-T9mUMgkaFkMzwDAXdc356t9tTcdZLXrpP6GE1AXqVlsVlXLsajMJhRcVkhjazKKaaBRo1D2BGC6NnonqX8bPp8y7j6b_wH3WZW4OI63tlaSyyXsmLDD1fNA2FUn8cT0do5bcEY2y,places/ChIJ1-1nIGb2wokRGkbd6xcyibc/photos/Ab43m-t_qjFOsiyjScRmNQp2MJ_rNkQQLVvXZ7elq5rJQWJSuhSmW6Hd0k6qQMod0uQ1UWt_wADbmXfZN9R_t8vJ0Qn2wMvsTs9xL5e7JODM8IVtX-B12rcNnDiCFoytT6MnabdFnhdMdBYC03pCEiE1IVFEvrBYjJzisxrJNBQDlFEBqFfkYriClI9hELUf8orY_EOaUmeXWNgx8b3vSU5NEnoJUeZJ0GVhWKwpVq8oqUik63YqfLhLmiRCe4ToCVTG0ez0vwXRFZgXc1iHjth0tcG8B1dp-QpFY2vwnZ9TB_a2fKCJmZQyzLCYtRKeDDrnuGBP_LU2Y20Ql4YivQWaQpEMkYNpcmn6kbhVs-io4b2nrM0KXGx0q6U3y-9omy82rtatIgw4Q0vVRrRBnIaxKLCi3qYXst6oktDIx7Qb3W8ynoBlkhGylx_C4nA4h-Zw}	OPERATIONAL	2026-06-02 09:59:09.363+00
6	Paisley	Midtown	\N	{indian}	40.72233550000001	-74.0095819	Moderate	{Social,Date}	{Mixed,Young,Professional}	{Background}	{Restaurant}	$$$	6eb4e006-0d56-4600-bb45-887a885e7ee0	\N	2026-05-11 17:14:06.205591+00	ChIJkcGDV21ZwokRDmQkwy7Qfao	https://maps.google.com/?cid=12285204257797596174&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA	429 Greenwich St, New York, NY 10013, USA	4.60	597	PRICE_LEVEL_EXPENSIVE	Pan-Indian plates, craft cocktails & wine are served at this sprawling haunt with a wraparound bar.	(212) 274-8003	https://paisleyrestaurantnyc.com/	f	{"Monday: Closed","Tuesday: 11:30 AM – 10:00 PM","Wednesday: 11:30 AM – 10:00 PM","Thursday: 11:30 AM – 10:00 PM","Friday: 11:30 AM – 11:00 PM","Saturday: 11:30 AM – 11:00 PM","Sunday: 11:30 AM – 9:30 PM"}	t	f	f	t	t	t	t	t	t	t	t	t	Moderate	{Tables}	{Restaurant}	{Indoor}	t	t	t	t	t	t	{Social,After-work,Trendy,Cozy,Date-night,Foodie}	{Cocktails,Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options","Late-night food"}	{indian_restaurant,restaurant,food,point_of_interest,establishment}	indian_restaurant	{places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-snTWoVwk4CvZ4Fv8w4-a6aEgJU8IvvbcTcXV7D0BsKikxC32nC0RWP54HnD5GPMYJbV_33YfAxQL9AQnHwyY3edZ6Bj0yo2EVtpXTgwG6NsqV3MP9QdUidDQW91AMMaWPxH78Y3XBtrEgcQ3vbUWU8Wh3l0xrp3sADahCcf0SsirOPQcCSSzmvuOY1MQ8BexCo2oplsC_m91Hmx8v5Ocv3Z9ujaDF88TTmb6rk-NH-rUudqR9495IKtDFtqf9MwHcQhXJmuaHpt9ZeyGoqJmh7ffR3Km8zL-SL4HareTRnzbgDjUZ319DT580RCLiU8RzeeDw_P5LlGL5ld_pC7omyAJbXlYF8qzLq83lGGayVlxIMEa-RQ6lIAIdzzLbolo6JxBob0YCHJ2KMRnOACwj8kEcfo9Fyfu_LYLL1Ef2U-aY,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-tb7vgzmXWys3m2Q5IwAmIVunAhOho5bAW95j9gkUfbeAgl9LBzB_ivNGuNdQ48QuuD68uEcO-1lH2cLZOqu3y9pu5S28HDZi5LHGIJJU5QvPaxIeOJ-S3qfYjQtdhNf8pXMGFkqHWNVZ5nYTwCx1pByXGjuC13q1BfYJIOWY-6L0Sq56r-HgxqGq_t3dXXAOrSLzjjmWsf2m547CYR3V5WNmhpmmtOq0yv495b7P6dNrGzSQ_oT6snBc3U9iwECdCVpypYjSy1C5nCZrByQon4xHpLBkKgaNxeHb-GEhS2bpxS-6GsarXGz5XlIgAuYtr8r7Rg0Bl7xZWTK2w3uqCgPibJbMw58IvksEjORurmSri5aNlA_z-fouptyDgKcDf2E0w1eH9W-pZP8S0sYlUdZM2VNgVOwi2-GCif4jjc_Jdm,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-u9TuNG4G3BEJU7yeDisGuQrcaVGyJPT7aq_veG4qkvzvK_fmnYzCNhierJKSl9gL6caZ_65DZrEo94zDRPj1HjEqtjhWR5HfkDkf5RvXqI_L0wvBO1h0LtWavf8iQ1ozA99X8njm72kNFkZUHGpgBLa_UGP_ZcQpt8nay4bFdE_trTcRNH-18YoFMh9ajF7_0l1YxMUDlFz_vl_aSBnnL4cjixT7KZNPQVH6EqdZN3hsK9xVgVvlLlf9wUw6sEt3EwaOXroxeYD4mIIDqdVT7TyeKH2ij03_KkROoXbvJG62vswrOBYk6BtzlZh02kUdFrtq3qBPljVYjnhHr7j2t-SJre9x0jatBvl_fd9p8uwDxp2b80PljTp41e4sAa_4k4pDcwDMrf74Dh-gwaWlLBeQYez-IG7JNEVyR3jBwrDGWqIaCc4pdwRXn8MFTF,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-vjEQt9gtATypnT5GNF18kzqLt4PeV9iHIblmpK2Fzah9vCEqKhn6P2vTPahJFnz1Fq2rxjw-9TtZseO_mYCfJEjl-nWZaI-f4YcTMvi_fG3Wsmkt7FgIyyepN6FJhBmQwCj5olwf_5pVngUDqX-SdFH8B6Uii2og9iRTQPPx4I78Q-urQGVgYSlOxJD3OWn_yvLxe9wz8mSJYGNMLLyzOUtkE9kWJ_5uHCC1sC-lsQv_rZkiDnW0mk05ToQB6AZaHQkL8tUd-t3qSbnNLAQ5e2njcMfBnVSw58OA3xKmRNEH4-1XTn2HxvGfrua_FY54TGgEJdfjoMxx33heSgAnnmUcqrDBuL90uGbfiwpxcuuRcn1P2anHkp3L1yzlsRHItMXJD9ZL_QjP3Yj2IVnbaW5yy6Jil4WQHkqHyjhO8VtcbMPy8OhQa22CVsV6uF,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-uMTIbFg1Pp5Fv5dzL2JuJEhK9Dje2r-R6T3IMxhquiT4I1WECj9U3xu1w6vmTLLWd-HZCVKrUnvLZ16ru0vyNKsDoHrPhZ4fPDn1KX4n-Rb_HpLRtJl0Vs7jfm4OMTX3-5cK396wOC6rRrJF7BOue9cM_rX8ex2aS7hYFk6tu3VjtCdYuPhMwSPvlsFXegeS4rF2vkzPifIjZfF37NkpuZQw5vqHjlfATztCkS3d7ztZWrCelX28s9H5XIiOeCpAIPAR6hUV9UjOdxAwDhNbjA86jGEQJ50apjNY1gRsrwJzT_jOvSlvEiSwZQfvKT28SHuoSkftZyC_QT2gMC5PNlgdwy2YHx-Fg7p1aw92c5-jW9JbdOSW62NiYl8vyLzR2MhSMkFXymsA68TsIA4xJsEipW9KRnHVUopp_HmxtZZ5C0Q0IcOzzYG7BttHFs,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-t9TwRroNE6peiEmab9AUSm_5mZzf4rpYgAlVXG5tOSrOgN0BasLg3v_SHeFeOuJIjYVA9lZ7_7Qtseo_xA1Kc7n3eDjEcpUSBsSG-o_pxsE_371ZPXJevjTQyhCjMzTSSOJBL0K0L4KDfJ5QNWjr0o93vQCIEFc1LWLo-l2s_NTixVo0TrQNLeIpN7y3-RjJ4QR0yzzpqmEw8MCltRgGRQ4Jgz_V0333Sdu5fX-zHwVJh5FIURb5GwCQfXGreLU1kOWl1scvon36Pf8Oj8sI6FU0GHr2Jdem5fW-b4halaMBPfwentpYWCNC2KsoJvAU6QJ-kGO5y9sAwfqcFHqc1EPu7ZMQgkaqrVICvScXkiXMJ2RmDrQ3amks8M5kO1ov3sh9hmtpG2cK5RNXxYhG-b_BaavHJhSRxZR9gjuRz89w,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-ulzV1bjL9sqh4ILJTLFVcVtElQQZ-amlZfG-xyG-mDajgHXg-IjSG18oz4CPwHV6vTxObCqIqaKHhY2VCRv37pZQ_EP_bFGnxOVFCXuKxe8ceJrbqWotXni3HXUzNuU-I7ZVg2YAIiSo1Ol8xDNzf57ktwvrh6njB5M8ZCxJPhy3gVx7TpOL-zsm1Jxd4DpbVok_EGUhlbZ_KW4wNmH0Oblzrrds9BCloeosQE79IqHXv9yFypVuQDvIrif-_vWBi6dru4Nojngrz-timVqA3y4bgDZkSFeWdyqXs48hZxd-9Esjb5T8ngvHn4H-L-HnbbdJtZadZ8Dld5Y6NuhRDnkbF3rTSG4sUz9hdEtz_z-7i5bU9Kqicwm79U2YtBIiUgi_iKCPOzb6PmTZ7tqVLSU-_P2oookcY5S-Yg-0DWs7srg-xPocGmVu-8dCKA,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-tq5V9A_6blu7VE-Nu1Y1NNkYgNLGeMlMGjqJpg-qqzqBVs8BMy3sq8WUS9-qS5JhXopUDNoABHILpjWbf2IIRuBm4tSfPapSTwC1Lt94RKdINf17FUM4giN057u2VFExejNr20kM2x3KInNw1hRg960vozx6c4zlemAFcWQFpWEznPDN66y0HBx_YY1pGflAkt2bhAIWcany9HXXHAhG-59LG6YH_uAXMMODbctwWo_NaqI-TWtuKVH9_1lF-dRNghbrXSVqtqNOikiF3HIGARM51haZXiywE6hdgy2CRurfR_V2v205LICxyczKqiJvwLvV2rZB_NkCvzfslGWkRDoAnzfyrpugxi_44v6IYJylnxyyciPUEYuEEc9g0I_epH_XjyNmI4Tj4OPsFPGFuvqarsLvmXoE34wHOBjOj9QlISTd9gpOh47PHfAxwG,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-uaLcNA2Du7Rl4zJErCnbcO2JsARna93MwSRtyjgQUdDcfL2k6DUF-J1UzO-layuMMIdl-fo-j_abO7tAbwrb-kSbZI_Ksvm6ExFJaOv_NYFz9vi5_pFgtLj0T6CqpbLzYPQHmR6r85vs1FX8XX0XONXerdpPj3g2HKvfwCBNiO179HaZoEfgEHxcTmfYmgbRCmX6T_hIEbGMSD-f4ZzBRraHXV6ySigTYCXZoyGoHZ3JM7tWup7vx1-BMv1zmK84SuAnJ6W2nZXg2DSTW3yutpGT2WqhHILSH9pXTZLzv_iJ9i7zFsN2Qy2dQtlRK5BNmyEZjoqLCBB8UiWl2vfaQRyMA6gFQYY8yoDfdcywxlA-AHVf_TD3L5hE8q3TKy2mJvfVoBDR8W7GgVnx1fZEwNv_kUS7NLJjW0e9xR3rI4-fv6VRg15NurPcj92RxH,places/ChIJkcGDV21ZwokRDmQkwy7Qfao/photos/Ab43m-upOJ6-X8LBa3BJbl8KnwSpNOj-rCogS_Ha2qm01NWeoUz69TU7vY2rXzECzdU--7xL8GHV8pY5ESmcqdkGmIS35vpZcVQ91PzElDu4Fk8NUlW3fdyUzuX_a0syzUM4_XHIs2LGPtOnzR6nwtGpkzfjxcw1awQ-R_0CzDnLhevy-B4IBEEZcP-9cYC_9O-Pazt4NU-jnFf9ud_ODICgTG0YoGbJXiyADJTUjaxRyQATAotQ4QMAmnrbarX_lcktNaQzzORWeK1QZ64oNn9gMgbDzSxnXholxsp0gxFzwVlsVKLQ1TQtNWqzSvC79MJd3svc8khZnO1RBMTQikMJwZwLtNpDztq6OWMcBuVR0uQid_j15_n0WrX8UIlZlj3W7Bjx9DFMI829y5AgUhsn5NRkSHrXMSPjwHjwtRpowoJ3K-xbdXOZ8KdKCNKbFA}	OPERATIONAL	2026-06-02 09:59:09.087+00
4	Gallagher’s Steakhouse NYC	Midtown	\N	{}	40.7628486	-73.9838549	Moderate	{Social}	{Professional,Upscale}	{Background,Live}	{Restaurant}	$$$$	6eb4e006-0d56-4600-bb45-887a885e7ee0	\N	2026-04-25 18:24:55.991651+00	ChIJFQ55zVdYwokRUyAEIvUGfHw	https://maps.google.com/?cid=8970052207722635347&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA	228 W 52nd St, New York, NY 10019, USA	4.60	9479	PRICE_LEVEL_VERY_EXPENSIVE	Iconic steakhouse offering classic cuts & raw bar items in renovated digs with red banquettes.	(212) 586-5000	http://gallaghersnysteakhouse.com/	f	{"Monday: 11:45 AM – 10:00 PM","Tuesday: 11:45 AM – 10:00 PM","Wednesday: 11:45 AM – 10:00 PM","Thursday: 11:45 AM – 10:00 PM","Friday: 11:45 AM – 11:00 PM","Saturday: 11:45 AM – 11:00 PM","Sunday: 11:45 AM – 10:00 PM"}	t	f	f	f	t	t	f	t	t	t	f	t	Quiet	{Tables}	{Restaurant}	{Indoor}	t	f	f	f	t	f	{Social,After-work,Upscale,Date-night,"Live music"}	{Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options","Gluten-free options"}	{steak_house,bar,restaurant,food,point_of_interest,establishment}	steak_house	{places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-uOFbx3BrpdJEhxcE8HzylWAB_-uTny3V7le4Pk0UjRkC_PCDhnGqf_g6uOx1UmLLeoYy0UzZkEPqFvBnxvQvjeCbwil8YAPb93eajgknc3KPNJMV8Foy6qqokruVhc67HGQJPNOdEsIAeSQmo4RDDSLo-qHJInMrP7R9iS7g6XfTS8VcZYhoW2AkqbUwjjmxN_cSN14m_0Azu9_FplOiTsOX5loCbrMHjkelfybiIo9B9tXAxI1sZBf7iAjseQCeoc5bSTDI3HHTrgoesHxgxmbH2fNlPpIQxFC84XPT0yKeMrZ9-SSTPRRpK3kKPwdosZmS5LajKYmZ2oCe6GsQ2TJYjNe_st-aVIhdltNPhP4QXPFXFeLfvH3RTfxGW2SA__x5wYczAopTvErH1VeG-6DluABsm_FS8mV2b_EiBwiaRzOynihMVctsGPC9oR,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-vJlFuFh8VC5OrnCyS81F10C8KI3cm555rWIJiL0Gu8T39EsXIGRvqGMBEVrww7pwluh4OZzi1-yCCQceLHkie3iVvyuLwp03auGx-IqcCc578DKmH4G2PRYhaROPXhEIT1jvsqKqqZicU5N7RBi3G_M80TreagfVhPCGcc4oYA9wCCVIFRuh0UabWS7PLp2uT18jwi3QFhcn0EVYFYM68EVfKSCG0TbNFV4cC79uJPHCGyA9Kwfgu6KmsSZn4FB1MO2d1A7eSqn_6Nx8XLigLICKSE8m06e9PpXdZw5gUCpNY7Jvy-7pmot15JZVf94uCGG_wRCjn1EA4C9TzpLM2EyEcDhrKlK5to16m9t2xt0R5PlTXhVHPY8Xv79G_qF0PkBPAixVpBSF-Ha1ECGCJY6PJJOPVOAO3MVXJGapNA6cU7,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-u68h2vlOrGzk3oK-FdvkIDAw7Ey1kaLQ1z0yNusvD_HzVHuEQuQ0307Yvhye2Al2VXfN9y4FLjN8WMIdB53bfTnIgVK8oZcrA17qVEeRkt0Y9liE7s1jbVFoUu3_GvCHG1RcrwrNhLe-mFp9yO5pHNDLucTUjXxwd2uTF76f0xWJuminSQjiUM48lP0C_FIK_pvn3oCQZdpmQVP-7j6_WhebV_T41VaYYDvuE7NXBPSxba1C2nO60xwSLx0WILmQg6Ds40-P32299jr4K9iTadmpWQ5MC2fOAZ4pSuC28fLAd17QZPQKJo0p37zAo1tvIzNhLrobGiZknNTaIiXo15aS3BqBPXf4tpvBNJ0_euYjY7_4SN2Y2EHIEVp9ZEmDcQPU2L6ehDH6E7rTN94XZf2EzDLl32lSLpzPu_R2jxaIsY-Rbr0e5kALwqtfc7,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-s40YUFWy8qLPLR3emHrXkL32R0njadsOewdnAbMPXJDjGmZVePENXT5laoa--vC2eoJaXa-jKGd5zgtokRsOCAmFIRR39NfQmoDIw_myGhNbdiBK7lxw4p8jmuyxY5WqJuvseFwDJjv1Wc5hhYs28MT3gERD0meaSB3i3TrRQG4Oiule5IqkVDpajrXHu31Q26YMssYHEcOpN3iYxpEI93dFgnDjWslggkmZ-yVm2yNbfOHfnybSlUEbMEuF6Q5EXyPALn5qcwVX8mT7f7TGCsVV5KmU7ibPKduHv9Yb-kSqfPIK3SdKx6xBD0Y_EB6Li2N6BMh38Onz6xFfaQ91rLcuQZj-clDH2tWi9pjEudFw7JH0EYgbgLycVrzFL_fnVSF-O48gKqQ4k0dN0orwko05oMSgl9_OPvo7esogFzgRcEBFA-yTynNoY8YjeZ,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-uzTcrRu2eB6faIJvSPGeYuEOdOrjhkFgwRhcvHL5Fv4xjVIit1ZTXOnZPTF2NPGp5S20cY7gyZ9wHR6j-_kYYwhhaXgHciSCsFkZpE9g4ODUIBnHQpU1NUUrDXugVsCaSWn9fa1vMSldPdiPpzhqF70MG2VpVDN5hg7xU5KrQBLbDdyFLdv8Ac3Pni297o__7Fpog7x8eRYIxBCIMD14-NPnMU_4GRPkChBCygCO-hPZB43wBybJ4qo7nMj5hQ2y9VOl4V02ZktHJS-0GddWh1TpAob6HZQbKtPfjtpRiAWoDZOysxKQhdU-AvBBstE_DbUIxBnjtyQvmXKlnZ4yhPproJjY6q88Rer3iQ6j8zoQefoT8qbAJCOaBXgYvQOSmaFzbgGfEPGMdZFHMWEFaVfFfBMXiEpUc9LYueQsFqiIYSYu42PVR9bVu0CQ,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-u0pwk_g5uFwljA9lfd0Lh_v0P3MTkP7AVcbbCey0vcQniOcqcEpsfYKPoxJkugnow7Q4DP9Lhlg7dchnYZR90Ns-D0-6IaeqYrHfnZwhmQF6yVdZJuki4zI4oI3fSiZmqf7Vwupn33dqV1PFJoVwqCX3M1uGJ2dCJehuj1u5JlIlxRIP_eKJYZpkwZgT0iwSzdScpwSF-TTeU6PWRuQpT8QR74iAeJlNaNDuzn94roWF432-rC0IzB2X5nU8D1awVs1IcKYJNG5Ka6vuFRiYjjP98reMm-nnCfs0qN74UHQS_2wf4d60IBj55VKMfFV9SOcwnXSCJyn_jo3wr-jbAj6IKWIUoymhh18oNZD9zAwVuTasEHEyBb7PN26skGlzd5JFGWBFkZwUQacHkTbhRWvFfXSmPYYDqUF56eKS17CR07tXaPbnqEpf5Xq8vC,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-uZQZi9Y_8ITKIF8L2pfviaDLRfE6Zkgjot7JlKPhAp-V9lbrtY_3nY2O383uAGoEvouvKkj6IfbTKCL2kw1ndgj0AR5PFusEv2yX4euizJC_W-z9BzpNQ8uLzVGnOOltd5ineax_91h-Cks3TErM0htJP3zxK1K7DY2SRuQQnyCvuq10DnOOvshsxrizPYJ8tOz--BXuFi2xxTqTsa4GX2OaoIQdKXKLDG3PPPgleSzyVH6lM3C0G0L2sxV6nhMjYIbNcK5fp9g78jtUEyFg-FuASgXlVmDx_MJi-AsHwwm8bE7bpSFLPeLJcVU_4eBKiycMJt_qFSw4eJavYcGlKuSqGkyBjViif_yXgq1-RDMgvB9uY-CzeiLcN3usw-iRPlFcVpehq6MbGAhtmcaOkROqa92Rlqyj314uR4EBEOg2eFMO3OLqHgdWS0YrEu,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-ue0O5rV9FYOpK-LJ3eVDgOqmnQ2Vr0wVBjfvPzjlqmlUTQFacTKH4V4Ru8HAE-axLLLB_CW-9H6AslNifnme3YC2FNo7vD0PnUDErfHhBLW7TEjLAq3rinwvEeD3gTQo7IhfcrYBXkNbYF9BEdQ4kAa8nQEbnZYH2C5TA1W8Gd2TRje58RESyLLNxysRIxeJSvlIvfnDU5oIpLIhjKXDLTiRM7H324VNhoOtqwwRfNhPHikSuBMLelmOnkGLlXDQQEAaR732MsuA1Zn4C3mRkeR8wr1qEkth6fx_aVHznfj-vVd5j7B0zMGdZi9r-FTyWFaoyDJMw2J3GGr3a7o5YDoIKL_7vBTa6IDqpxzhLjP8rISFFd8fZGvsk9arJSoUD4OYbYmDXqccv0ifpsg3gE661iWIkxqSVXHsb2T6j_WS9Hs-exbY0Yz_PiIWUU,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-ueO1jQD4epiHw_odKJ9wZKAUFCOi795P1SRrFX8Hhu6QyzDu8XYmOw3c-vK9tPbCV7Is9cDM_CSCMnzUw1sbWsakL-ed0gy5WA-6i7IrJaHGlF2bvUOnpX9JBweyZLH1beU2f4WcGudAHiqfSyRRFbq3GWLzgSmimbBuSSjcBKAkZRIie5553G3PmrpFec456uLz1EYe5dT7eq11AYYrfpqYkd2mEck45PZbCIFWaL7H7oRJYzdGoSSymjz-ANNXf1hZDs5nHnLpyy_SHNXhcf9-WNAMzDk7E7Mt99vB8hfY6z5pecaGe13C0y3tgUK2MRTenNuVJmroIBOiktYs9GIkxqhcYNzKERW3OVas7tvMkVDp-IiWzGxpO9SHhUDNkgBDyyZXzTRKNJIOZMfvEEizL4RYg9re3oKZXVyFcuqoIb5arBKVuHHUq0oSLc,places/ChIJFQ55zVdYwokRUyAEIvUGfHw/photos/Ab43m-u8AvVlbCp5D22ZxUhKUGRwZW4WlFC3pKz7-OLPdcfoTQQR0rB2SX6lwwfNRSR7kb2GmhIi_dKcTKZw7SlEnalgD2TNMYBQcHMtTEVPzGoj-GbNXT1NXvt-9Ag3uEqEKzu9aYRKX-oGuP_4q-iVw_GVTybj_6AS4ybRZOSVLFFSYnckxeyAdLBdUU_JniN9YBPbOevizsLRtrkwEM25g1m1jnw3V-IcJfpQjCktt6atJ2b3NiMy7DW-TNDLdxCLt0r7s5_3SVK9ngjLM0WNUVSetIuUEdE7wnrsj_bWmQDDKHvREP8PocUHF3q8vfLc5yBHPmNJi8pJIq6A3bk0-A5rveR_Tw0g3WC7CROSqm5ISNQEnHjHGrNiB0EWvf0qRRqTH69syAXNQthXVaPrl6EFYXfWrGcuNi4BQAB2iinopM6E6aM7k6mKXok5BWis}	OPERATIONAL	2026-06-02 09:59:08.34+00
3	Banter NYC	Midtown	\N	{burgers,bbq,american}	40.727927799999996	-74.0009847	Moderate	{Social,Date,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$$	6eb4e006-0d56-4600-bb45-887a885e7ee0	\N	2026-04-24 15:27:16.691214+00	ChIJE2lK_41ZwokRd26avZGNTsc	https://maps.google.com/?cid=14361571918821879415&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA	169 Sullivan St, New York, NY 10012, USA	4.50	1126	PRICE_LEVEL_MODERATE	Cozy cafe with a patio featuring elevated, health-conscious fare, plus espresso and select cocktails.	\N	http://www.banternyc.com/	f	{"Monday: 8:00 AM – 3:00 PM","Tuesday: 8:00 AM – 3:00 PM","Wednesday: 8:00 AM – 3:00 PM","Thursday: 8:00 AM – 3:00 PM","Friday: 8:00 AM – 3:00 PM","Saturday: 8:00 AM – 4:00 PM","Sunday: 8:00 AM – 4:00 PM"}	\N	f	f	t	f	t	t	t	t	\N	t	t	Moderate	{Tables}	{Restaurant}	{Indoor,Outdoor}	f	t	t	t	t	t	{Social,Date-night,Outdoor,After-work}	{Cocktails,Wine,Beer,Dessert,"Vegan/vegetarian options",Brunch}	{brunch_restaurant,cocktail_bar,australian_restaurant,breakfast_restaurant,bar,coffee_shop,cafe,restaurant,point_of_interest,food_store,food,store,establishment}	brunch_restaurant	{places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-vjyIqEzcAX2_leM0PoWXw5xGfBqfWMABEEp_XcOxThCQ_1Z0dE3D-0IxpBNxS4H35-nDDclK1bWxvoYbUOMeV0B943ySr8VQOts_vTupCI3Zm9F8CuNfJyS2f1Wcw9WnPvwu3hSETVtvdsNtBb5QkexIOqd9y0nDhGN2F3sMkSJE0Igjn1lSwPPWxKbU4vzD6a6V6FWJdltpnokBjy9RiFc5kSUtqkjZmsnqED3zaFESAcU2LCiBqJNJwG93pYuTMR_ezlM5n0JuZxsLMgGfWl-xAtSdJ_kVRK9q1Zc4-N5Ac0oKJ9f12TRIlf4-7exkPf_BKAEwp0cqrUCXdQ9qNjSSDSzzG0AaDQ8OXTFsN234-YQOz6LrXas_NPCejM1uZ-JCeLdPoYXpMcZ_UI0hdCGEtm1cxNVm-oNI6ikE-6n8Oj,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-uSdd3jXU-tMgznBz8Ej2Uii5At3fLluWV0xZrwJ0CiCnS_dh92viryMkdE_DDEbi_g6wJXMMZfU5jYYeMJSmY5VvGURWA8Xm2MRBju2wUkPmYox8LKcOVKtNC2QjPaXC-GQHH77wrsX38Pv_pXF7A7EYx7IRlYbBJwrWoCJBCeutZF0KNkjU_0LXwtdFOgCzcthstHw-5tdlzkYlsod5a40cf4fEPG-gES8wQa_7VvhFXl9zqtEdp19M3bz-WNQebh03fzSbXe1EPbmQTDX0Ju_So8lmjISVsq01sjD_W4mTwZloj9cT1U0kkxBPjxxQ3ehLl6R6-bUlZzGSeE1Ebw58dORpEun9YYHcFqTCI2Q8TPSEXfx-_ChJbtf7DWkLQIOazVzWRGidl-AshlJwSZU377r3cf9fdEgF8ORowCV-M5C99G24ZU91CAx-uQ,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-vzChsXymmBxdMR2fSfp_GBmoywkg5msEbQ63cMtShMqOFYt2-r4mEzTokpxjgiHDui15nnpe_h16jSETK1XbJnb9G-DZ78je0sSBg9IqN4mL8-4wdpBlPWcyC0e8OJKCxsrFrUTpJaI8SmQ-e5QUFlV_EuehLIu6uuaxFGta1XDyOotrUD0DileHf7OJsuQ2xQ8j5g21CLtp3aQzlhI2FmdxxDyO_ePK9RW6ui_l4kEiqvI7VjYAKdawFyYueSAjZLupW65w3JUQHaDXh7Pf7JBGeYPFCMOeF07siLjpZ-rpPe6CitvfnI6BrFQ0ozDq3nxYd-pgULRSr-BLXigRDq5Zrgmx7DxLBmQ-gi5KngfiDmt6bSd2dQlt_90uyXQ08V16PqxIQvjr3TBegxuFe739yRRyk0vD3lWA72sfRvDg,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-uXFFUK3-7E1oyntZKL32yKIvAjc1egtYbjrP8Q_EArDlqEyXsuPJ5MoNCaMLxZCEkvvNODH-tFLV2TYrfomytjUw7fA6TJCmy2W1MUcgmxR41YnG3F-5LDffS4KC9LBDlRWOkG8N8z3X_XI-fVogmqbqDfpO8_8UbVszhZJH8nFhQDJBsaVbBEb4YKUziJK8jGGk0KnZszwRFcosYBVX9wcRCY9U67JeI_7KkomuxgWPU1QtR1i1IcRR3q7UHgIXAG1ZaKYYiKJ6_YQ-N8wQ8sLxTes1g3cOEHX7v3VQQsBXHZZEKGDzKy86_sM_LMmfkimPwomnqfjVPNV6OFMkhAB1IT_iVk3KH0cS9_HaHHQ2fLY6aPPifjNBrXhpSUefC1QpXfspcA3cezh7_SaPqmdZVqTECNqwmr1NxTXtEC1_r79HGqMyTTUV2xjA,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-th__4SR0GZJKbpCHdZ89Fi7PsJ-K_U_vE4muJ-u_l8wSwu6lmm4fVDm_Qsr_gW0-6sepTg_HugmXqtbHf3YPA05eULPZB-xOUpt3TyvpbVNWFl4_3Y1lF57EMvTB_TnS7U2LlgD1SgbgNzkDHhJ4DwYy-rq6jr_Pi9W0voG1Vwd3hb6AYpaQl3ZiGe4thQLrmMHfDTM_0GokUZOdrVv9DeR3piky78x1nFksunjiTIfRAKPsiS69gLIk-3HQNOPWbjxHBscJ_AjbEWHs-qUZuwTRjOZIfwAllbB_5i6FghAAgQQlscvz5rBp6XeSDCcSbOsNfT07YwWhxc9auq9Bh9ViBUaBM9BkUE337Px2LP3lT_XH2kUTGnSPLoJ90PgdEWzbvewPfXeoOf8DHSREVLSnfLZCoJnHmU4wEHrgVAH071-2T4DqojD-185xLl,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-v4_pZ4Kv6ndDYemAdKklwbG1Sll6zu61fj7WeUm3QFDZ6H58QB1QOVPleJ_8wg7h7THYYmFe9HWd4LR6LOFbtJBAtA6q7fxWjh_xubLRFhuXv3HkYjEx89GbHZbF0AReEG9hbLpmknvmcDeQDNQKbuB2wMb3EOwQAk9aVRQy99iPO5tgA12u4ElZh2LuLAjYSHEzrZByMgl6-6OyktGsKguC-nNbK6xmYFRtPC2x5gq24l5k0Ys7uM_Qj8D2WJrs3PBaIkc6oSyA2kO_1mC-Oyc8zt7ndQ9Tc4rYXT2Rub9ni4Q49H7_NL12y_Zv36TK3qFYQy3NsLTq0puaDtp-Zmc5OhlJ-2TG9WruXFGA1y77KuW36kybyvGQMtvYWiauiOWiCnrazYAQM2IQfc5W_81_jMW34MPCR7YIsWjZcBehVAJPMjOYs58xAecQ,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-sfAVlQG2FT0YRTkkJoJCbSTKqwpPaqQP8T0jB9fr74x_nU-OPDxRWmQfRUp5GU9LmngtJouXK-caDyaNdDJgOnPaHvySfXsGPbAD1dvbqSldLhJpt0uA5LNaYMEVaAkdjyHurpcgtDHR1ovj8CpwOfTTNSE-WF3bz7NSTiWGPGjCyugTRX5MMeVJPl7MNKfsevjfNsVVvPVCqg1CPllS9u_xpQsryQCZhVa9hsFgbLwdldhejqiUwAdlQvXu5R-ha4bcfpQPmLSj27Drmj8WHDm6g7N7ORqoVJkf1xAPcDx7bjms5AoKGK9H5Xr2-bt-Qd182XwF0FiCivlp69KRQ_1u5DfezsvLe4zVpyZVDLPNZ1t4_7tBAqScX99UN8nQf9RGpTmaaPR7ULPUOwGA395Xz1fQB7t-5dSubcj8MKq5SE_sOWMIedyTh5nQ,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-tzyLe-u1JEdChB9GhdXQ4CL6_m3Uvdx6jEZWwUeBPYZP4DTxVVfkdmJaLrJ1ASQ6fROFljKik6-6XvSA6gS4SJOSwq-LjP6Z0sDycZBPJCJPaqbxhcePJoFWpMjVNWDS3ewRK9pXs8RPlD6Ek4yyxxCVTVo1kA5Mz7nFrW7EuYgYM4mrBjwS63K4eSiZk-c-GHDjYxzSXf2Zz4zuOC-Iwxw2SMzqt5Ro8SPkp7L7RFY34Vp8oG7MKY0ePQmijTnU8ASXhimhjW7L-X6tlpAkUjKc-Wsh0yO8Xhp6oU3Kyt2F5VZD4rtne1Swrtlq3sPTXNvak08ELJ7lWkUIEIa_0EOgdXvC9YIHO6MsKGNdNeWaxgBrNfdlcvuU7j4P29leyOnUO7Un-CLedUywtXQvoz6C3szZHbLSsIHlCjkfoU1vUDDXKF5j7NkmlcB0Ch,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-saZnn-Aa9a1ca7bZdCxg_ttr0QCFQVh1SunnzRIRp3c0OFBMKW33yh1kjJAXqibuKc9YfQUU85V7BPWGzHwsUTaLDJDGHQUEIqUVMe8Klcu4_IkDZ95BjzBbETH3PrnCzByFzhA-8AWwThARC7ugNCVcQ73EBfHTIHzmaGc5q1sGeDkuzSbJ81xtvZRN9GG6Rh2aGs2bxOzkTGMV0IgDriS_W0zM3CeA74Ae9A8KA5X57pY-HKxmX5HeZCHEyJKEw-lA3MhNI6hZu3ZADnOrmbjIL-w3jJUpVhtevLfUan4_6J6tfoTlLtawEuAGTBu33PBu-pRaFgoJBkGz99-XhPBNqP6dI6S4MNDt3WRiLYgtVc6gbTnK2XkkSVSDOQa6sw1IxcKrWYmFn5suhADpJNgB7b4fGa77pIvWJLsUL10RLsKQIICF7iTOkRGyp6,places/ChIJE2lK_41ZwokRd26avZGNTsc/photos/Ab43m-s-X3YVfcCq23jdFwumup9-NEoiKuw4n8mvsIAiiZLmtp4M4etFKZbgbtHfBXQlQ7BwqAviu_tvZf47u9vddjlCnH9PxIamNXv8avrSjToNAUSjp2ZPrCOfmxZKHd4dkONFzgDD_zTCylR6tzIOu-xlGfXKWjnHiyn29ToRoCwxHb5lL-5ZltIZ5uHE2XWFZYOom_jFL6PAVliHteLEyYTIH-CMkZQoegsEHgY6XFFx6EX9b_mq1UZ07x-kuMlOywr9PanAFjFcH6aK8NDgEh4M_fR2lCoSIubr23c6dedrHAhNTPVhq5iae9gK3fSkBA3QisnnxPPavD_nTOZEC0u6eZJjFlcZ9zt8MgStSEF3lZFxME8ejkX9k623flKy5vd2YiMnou9pGX029dP8ylYcnE_GZ8_OVyM0dn-w_FbpS2T4}	OPERATIONAL	2026-06-02 09:59:07.785+00
5	Raku	Midtown	\N	{noodles,asian,japanese}	40.727247899999995	-74.0025495	Moderate	{Social,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$$	6eb4e006-0d56-4600-bb45-887a885e7ee0	\N	2026-05-11 17:12:36.477362+00	ChIJo3cQ0GxZwokRUukfD7IRfKk	https://maps.google.com/?cid=12212655745977542994&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA	48 MacDougal St, New York, NY 10012, USA	4.50	1860	PRICE_LEVEL_MODERATE	Busy, minimal-chic room offering house udon specialties and Japanese small plates.	\N	http://rakunyc.com/	f	{"Monday: 5:00 – 9:30 PM","Tuesday: 12:00 – 9:30 PM","Wednesday: 12:00 – 9:30 PM","Thursday: 12:00 – 9:30 PM","Friday: 12:00 – 10:00 PM","Saturday: 11:30 AM – 10:00 PM","Sunday: 11:30 AM – 9:30 PM"}	t	f	f	t	t	t	f	t	t	t	t	t	Moderate	{Tables,Booths,"Bar seating",Counter,Communal}	{Restaurant}	{Indoor}	t	t	t	t	t	t	{Social,Outdoor,After-work,Chill,Casual,Trendy,Foodie}	{Cocktails,Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options","Small plates","Gluten-free options","Shareable food","Late-night food"}	{japanese_restaurant,restaurant,food,point_of_interest,establishment}	japanese_restaurant	{places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-s4Udaq4iUtFRtzQmZlBk9tqWv_6wp-X07gdCOjOKM2-nvHNPF_a45vXdXW8cqEcQ0h6h5W1841EGf2dtqlUzPxIZgvZ3McVdFSRQKS2D3bo0Vq_sC8icQ4Ckwic6l8j6UFAc-23xq0hayCS74bB3oNoTUj3efWBQY6OLurcFlC6yQwUbeRVifZ-Xt9ILMR-ZRzHRFoKOEZFlTLyZm9fs8qsqt4Ci9JES49TVXIEynDcW_h2urSVJh9Bwoe9bU2r6WGzWkp41tPYPNgf4E6T4pkoLXYfplq_PipKPqdtqXyaGYZpwSdO6XwDiTyfruB6Zcr-it5Hxp8bL6Kml66IdBOAXaEL7bAgjRuH37ZbwPwyDZX3cfRTAFyiVjK83fuLXXgWagpSP8xr3iTxs5zhzmqZbFDKgBF1PFBT_X8g7pHUA,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-viu63MpFMplQcsbhXP1rlHc8I23jqwaLJuRjvnXxpCdrNewILVwjLyePuL3V-eXj48ysVCOIMY4NnLIHGyy_B3edEHs26xB5lpXouNiCgZkEskhj6dM8C_OuUk63pTZcslfr1e4TZKHxRZoGfQo_92AMLjq-uRzeup6WCf9STyrkFgX3_xgTe6KBA3YypCfXfunhpwt3cmcId_nzXae_WQQnO3IcIgI3UD-GJBkxtQ6OEsZsJn2toFbzJv_hmPm8AIsTkyfClLVPzOnB1OHwltnJuzzTXKretcZakqiadU88lt3oJpUS_IY2twoG6q721QOkNhQZjysOzXNFvQ2CaO1tkp3lxgjZNquT2CYUgCz_0sTRGn5mqcM5SszRJYX_851nM1yeGZDvcIbX3Tg1QJeidAZYlyMyDz3xa4uXM9ow,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-vNO49yoUxjqO4aJgku3z4ypbUuVUaygeH-mbaFrhrLzlSNOM1FBVGissqbqNGRHAir7HOIkMYpv6cTy1pUN8j-CeEqSYr6zq7vRA8oa2NiE_QQ4Rk1CVDoXBAaTYW1n7quBh-_9j1NZuVEcB3mkmncSynXqnCbEdwRhZI9EgUacWVqPWjjH_992QvUfg7p0YdUJPrrF03Di7-EalyNGz7nDB5eUbi8nm24LPHNLlRTTCAIqmLmNXEvTboVczpoTslSxpSp7UTHvy-UDanwaSCPCOTGl7ktzXPUoYMRDeo0yp0oTAckBrK32i_n6sclAlwpep0t5tOQ4wWzJNn1vQCYTfKzB8kdra4UVYT3J1dFkyix6eaeMUbez83JWolmkRY1RJXwgcSYauW34iw4mFNoKkwz2U86pUwha_9tUeWvm6_Gmx9bsVmcCPOk0Awq,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-tOgTZCJpgphbNFnAxseCQKd-5AsokJyhIFisn0kRDHwbpYTHKeyVIvFsxjxcJRwDb99qPLWHDWBhfBH0kcZX5cguvISsg0G6fpksIfpzmXHBJ7l60gW2A8A6V7wQogzAzkBFOsRSm6J8xruTP9uGVJZukhI3VVKYNeg4pu7_Lf7mRoqY9NNzRi3CX9RjQg2ulI66tHyWiwdWGukzF_OARG8PlNyNHdTCpwrcwXgHuHQLTIYA_5TJPNSf0RV2J-CpI0hcLd1mKJiRg3ya_KqCoc-fNkfO4h8Mj1g3yrT5vGW1dA6hEB0yZYCadodLqFKJAbMP-Y21ZB64OoqTt_z4vJRbxLHuvyT8mDPbiHvJduhVaYfx71qV73B65KqCwka6F8G9fbSkh1sZEwncc9moNpHMWCsTEEHkq1DRH2idZ35UNy-yCwoPGGJvQtOKVS,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-vvwblrNgMg8nERkMcR0A_wLoijDE392vsELJo9ssqflfVffv7We3z7JCrrNVFCAXP-auQ3LZMA0hWdEPlbq8wz6YZ7SH0R9UjlJs_U2dvuBzBG0MmRd0cCAExsvOW5ZCAc_vpEO3cqbTnsnCqQjzhT998C79o0lAZeepD12cVUC_-QAw3r7NXcOhJ4nYuTlRBR1mc5bQpvhpp-RL9SFI8m_842fOYwLADJqwUv9b57fy5MvcDN1YXd5Pn-5Vx6gxQbllQrOoGosynXn8MtAiJ1dHAzUBnjzuLcrWXyCMKurYluoSV97K2f9k2l3luGQSYpdVxOAPU5qw6P_WMSHRPyyK3CHMwSFi5dG696mtQ09FcOifkswHbg4DCoL2UkjG82hupFIva8rJqaSgPaCKUAFLHq_gRecLTGHvPMpJmH8dljLxUUhTO3VasYVOjp,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-spdbg2vz-XDs30t1P91Im6mVNtcqHXwcNCUIhob4eDWFSoaCfKQvQrkeLvz5lbEynrMFQY1IAfH0Ynzyt4-3f1fWBjaEPA2oB65PpmRG1uS1paZC00n1UHaRV31kwLvHrZ7fbLFFtqoVHdADydTZAoTUnXpSYWUjsuqo8mdNzy4x4rXtnqDyKfo55Jogp4uFvtMVtjeKEi_5tYUSoUxqx8ssNjyoIAi10HvZP_9mmB_zEEFelLr3PQRcTWvxA63RfQCxZCP0cmHYjJrrYwPWfumtItdiZ44PLTBSEnOtj1To76y6udWmdQYAQZ4F-j_hWDDxxfZ6B5cTUugCR7R4PVZQ1Us72L-wV8jvtDjG0ys_X8XAt_7gv9aJhGLX3JWszSyMBgh9cwY4e7VE1fzjrbwJIrrZNJ31p6Es6_a6yH9c0ZkcV5aYX0ql-fTA,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-tEwvQyZkL36tO64PgkfVYgXGo3sD2skvqP1ouYYd51Pl1rc39UgsdrP94zFK_2VuKhbRsI1EuAowIzS2WakAnlowQT5UQbJRGfGgBxaQbsAcJCfbcUnrG7g8dZE1tyILcVxjnoBYAIDLydXVC87dhi8YIQc1xPuLvMCTzd87reWlfiW2JPwbeXmt_So8MDQR8qY1PnTEHKMMVSXx-H6akPGQZ-Na9rX1dKIg7NWIWxfHUg8JgKFB11q_3r1ouNDjTIZRNQjwIre3iAd4Mve7PvlMuj_jyJnwGdo5mSmGFgRKF7Bd9LRSKCDDJVka9G4TZU_bE46XVp6z8k_EAfmIJzW3rbCMVU_7b4QWUZb-VDA5ngS3mNbyHUeVz56coaiIUcMrB14DgOfsrsL0RVAVCW3s-TOmzXOO7IYwEylV44LHM9nmaHeLUBrg6ZcA,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-uXyJDdOy2DgjLe2pJgrLaDpHvG4Vaa6fUrzswgifWvXqBjaJU4yWgXTE8f4NMjxTNzEXlE6kLtUyzyKWR27OQBkFDBkXoAdnTrS-W6YgjtfNg37aCFMxe-TD00ZQ-FVKt1SPScFSqAHjP7GwCyOetvTCBmK85GIr4YzU3dvtiOnl5rejk5fX_xMhTWncdf-ECI9Ev2kwcNTlD83SD2If5WqULzHc8AgpbYOHP6crzqIIWAZydgGgUlS4mSU58CvvXLmweb6ArQAzVGqIVzAnti6lZQRFExRX5S5uaxlJK1jEgE-PvYl6WMDZbS89oGZf6SIt-qEzzpdNyPZ1T7wyVIuTDOIEKohmtCgacuunn58MWrfRv7CZMmqnmngeqdqgHQ9wLQpIx28GeolQr3nms_0a1SweHJaNwyfpWDk7cEKIbz-FaV_ielpzEQ1A,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-vJnig7TSs_EYyB_j0KSoJqKvmiWV6zdhe571PXKQq2W7quiLjF77bWSBri0fF7mkkNrqZw1nhhbhf70xOA4oK2KlTBEqVRqg377lbR34x30zy8n1ZegQqDOVhpQRbd2rnC3licOcfMyJASqMp5LATIwa_q3dZj8lQWCZ7IYMkRalMpdoHT4WHiKu90TWWtJWCVDYEXKplY1-aS0OTEdUCLLiW80awo7B93woCEPpR6sY6LoYFpwqcq7kaX-hh2XZ5M8SirL6G_5HH5qY-RPHmMwQTUZ8-vh-ANtNjyMnNTdbC0zHeiY3HrOoKuUv3FxHmTmVl0QxuAQRVoLl0GopfiPMiMWNEIvK8aUVhQ8MTNlWSzpXFadOSi6VnhVOXUL8M0Y2hPqqAqy1ncdToX9d28Pt5BM_u2emaYp9-7d-vd_Co,places/ChIJo3cQ0GxZwokRUukfD7IRfKk/photos/Ab43m-s8p0b-R001ZYGaY97ABlYfkNdsbXiCCOqI0ctXlSylASZbXV8PCfa7r36LLNdBvAMa4rNOK2waWUp0gO-56_fQYGrb8stRDqSCKtd1drc2siahLDCisE6TBTe-qe4Iujcgior-W3I3YFzqwxisy92267h6MOghLbPLooSFgxnhux2M-fXwdGVxmS5R86mhG6CTlhpTNVh9YqoQ8jAFue59Lyt_7X4Pb-Qnu5PxMbv7rEYVr3XPmUcQPqrebWe68iK6IJgDTmrZtmrH_NwR1o9Ys9NxPsWdp4AFmXi9zcLyYO46M9vYn_kgGD65ZaoTZGHD3OfTcVhgIdS28dMdyPiFekHxHA3BozP9V85UsX_4LRx-cWRl61VouWYkU8Cw2W-VZg5J0p0_nXONz6RXe2-PT30vsilfYl2zdnl3eBYnfQ}	OPERATIONAL	2026-06-02 09:59:08.724+00
8	Le Baobab Gouygui	Midtown	\N	{"west african",african}	40.802343	-73.9510933	High	{Social,Party,Solo}	{Mixed}	{Background,DJ,Live}	{Restaurant,Bar}	$	6eb4e006-0d56-4600-bb45-887a885e7ee0	\N	2026-05-11 19:42:28.41531+00	ChIJ99DG_RD2wokR4v64upVjBOI	https://maps.google.com/?cid=16286251647212519138&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAIYBCAA	120 W 116th St, New York, NY 10026, USA	4.10	585	PRICE_LEVEL_INEXPENSIVE	Warm, comfy locale presenting a variety of classic African dishes, including lamb & fish stews.	(212) 864-4700	https://www.lebaobabharlem.com/home	f	{"Monday: 1:00 PM – 1:00 AM","Tuesday: 1:00 PM – 1:00 AM","Wednesday: 1:00 PM – 1:00 AM","Thursday: 1:00 PM – 1:00 AM","Friday: 1:00 PM – 1:00 AM","Saturday: 1:00 PM – 1:00 AM","Sunday: 1:00 PM – 1:00 AM"}	t	\N	f	f	t	f	t	f	t	t	f	f	Lively	{Tables,Booths,"Bar seating",Counter}	{Restaurant,Bar}	{Indoor}	f	t	t	t	t	t	{Social,Chill,Trendy,High-energy,Date-night,After-work,"Live music","Sports/bar scene"}	{"Full dinner",Dessert,Brunch,Cocktails,Wine,Beer,"Small plates","Vegan/vegetarian options","Gluten-free options","Shareable food","Late-night food"}	{halal_restaurant,meal_delivery,food_delivery,restaurant,point_of_interest,food,establishment}	restaurant	{places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-tLMhxRdIHP2xJSR_wpZHqluR0alYGVrFkdOb7qWxKZQMT9GMeXHdz2Q27x6X83D9UpnsMwRgq3w_j2Vaju9Y9Sp070XrBWXtNtT15BFTtQogkHvxzucLk3FRdlboUnSwOypU9_Oa_L1isTenbSIOptp5iKbGzAKGY8cTShblaS1Ko4mESyvoZOYStEW8bhjMsmffizmeN_o0vBndftk8Wt_WhWPmx2hCnt8RF4y_FIAYFtKFm8puCIeCmzHl7c39QCC0wqWeAAtXc5zsi-AASvjHi7sQ-UzSZTdHrkvbH2zQbCyLpNDX_In7xM9ZXu4qOJ55Mudh8w85JIrENKYdBKb3oh6UgYPAPTXS9UB57EzjlVApVoeRtOZYxoRnTZqiTV8xRO0Ikn4Vjgm_dS69k7tC6VhXSDuKDM8eTJQIfU1A,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-sRTTMK9b4jru4jcAGAqweW_JldxYGlPE_4WvWGBXmrosRhHLK8QUuMX_ZEUER3QCH_jmdxb0Oh2aJZMOr4LGwMjfprGcc4MTu3kW7-Ym8cxoRge_a2zwS2ffy-3JP6Ij2nnopcAMeNrHHA9d-hJNndZZRuwSHaO_Tk7m8zeicTD4rbJ_7FaMoXYUMK5Cu5xpfZC2oLFVdBRUKY5eDwOW4y5XLcz2akl6gze8HHL1hHiajqqlfo99yxYf6tmQLDzgnDkMpax05cKmJo9ZEsDEPH16R2oFF0AfPh5d5Epl4eIlh5QXnd_0q7GU-QZyogCsDiid9eLcEN4xH_oIWZLhA61kLxJ8UwR6CGEx3UWE_lpdYFXWMQacNJwaFcYSSjtGDFpDoQ-exWqI8cXDIfwTPHcaBO4Xol3s6lrHH3MWeFk0Bx,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-syovjv276s2Nrj0APnT8TDmK4mUlgplMIeZObdfFR8s_LlhjvFVYPgC3drE_nDTuGup4G3C3R2s0elH-Vj8JZuxk5miDVy63LchmVYATvd_u3n8w6M-6S-eIz4nG4CHZMz9oV5PAfR9EHzGWvFylWeRQZUm5SrchzvKi1YWPovVagYm25gCSd2OeC7RLjvnvsUUpWcqxHkp_Ymsx5zSGcPSxO5KZ6wFcqkqq_EZy6T69sHenupLUZr5gakuXFd_abJ4IO_7eljC5j-GczWvwr2A8BH6-cO9Kpx16FpBFg0-H4BH2zST3ftE-DNn4XsOVsI3CiCYIPmFBBIlTsasHCJJqhgNqZRsHmIcKSN4AENQuNKIHpYnMwYPxaWb5RXZmRxIJcxYw0x6wS7ozhi1wQhQ2VF2NoBzVHt93Cf-9nVL-BsdxaNmV6RJoj4Kg,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-sK2cJx65aaDe6zdKq_HrVGkrl0XsiphmFJG-BDYHkYwQzYB_zWIdmKOdfNJ4ovuZwgjcsTZcIeTpxJYDgBMaID78b49XBi0Mju29I-_lAqMSEYIJqJz-QdrpmUplEAtpNtz0a8DraZFqbMDhPa0lpyiIYMfoh70e_0EjpequfOAWNBdYmgdfsOsIxTwypr8TpwSOK0SO2lVuHdkRS_bUYBXyGaAb69SA6M1SomyfiymqColqPWQEGtBFaeMk77W3HCsoqmyD87C9EwU6w1Y-URRvN7K-UuJv2f5ffJHoWUeROPIo1dJxpuXF6tZHBsO8GYhLBajdaisAydZAqw7woq90rK9_nCYVJ1yXH2rYtE7z0czr0JawZqfMszLRJWDbKnqzAz1j85ItTGpAD6uakmwDpvChlJ_XZmp29g0uatLQ,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-vilZaLDnYfM-0WX56AunwDUBDKgoiNh9iTz6LmuHqz9qsWbsFQARORLpwZg6dwpNqkO84kB5eqCXoW9p-H2Tj4JIno7fmxrYvJCD6Gvdj6shZvj9kb_DdVTi9Kq4PQKWkfCUAXRyJN5_TGHa22jZ4X2Xa2MCKN3sA6xhPa5EwJeys92ZTYjG9qrExHGJYOcTs8Q8jnqaj4_gGvuD905wEb_nBKGcPKIePzpvr_gfIT657vajuoHBQL_AN9lSUa-wsFg3V0-c4XQ-RlOp_QSgL_TkvewE6XePh4BGfWPIxfojTVqbELqIbDs8cMBfqoV9Vnhlcsse-menq-K5x63EAzHyb6b6ee7j-9xMM4pbFO3iC6T-Kc2OOByw26JGlVDqHlwivEmq0VeEmjw5D_HrZ63o0cIQrl1IzDE0X7MFPuTkR6,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-tDp3wSB0j2nvXbM62E2EGwHAj0hS8P8eb2jFsxQFkf2ltKFFYHxXg4jHRl1rJ51ShnJxKf3kVKDY5wD7GphBf9kHXK81TN6R7zBkEzEj9MU6vMzeKL0pmt7apPaFPR41a9x30GE1tyncFubHsEY3v9uiRVNzcRapmZ_q5sHAyHcWsF17UcnP79fzUerTI9J2h85TuM2QpjcTa_3zJCwXQsnjwd23KGQObsn5dGXULy2SrD1ir0_EP4pk3l6fe5Yp5Yu_Lq2rnzng4WDp9lnLlvZgEZvxBarWWO9E3jlkjlqqc0pEezuPKgwqZbAEFewUlvw_ZRIRezLxR1KiM6yIdXSh7TeLgYi6y-9b8kjlsueHCz4ULJgnkCL3fipSY0102FiqRvrJAFcACIY6LExwgXcl7RXMTmjHZeUtOBi9OyKW-n,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-viNoIxF73VqNa_vCA6tht6--vBYAvSW1W81E1soyNFRkBa6Q58t2jTA17BpiT75_H4Rvhgw8grsE2gksLzOnnDdLORzR6yDkl4vfkaJg03LBjZAUguAVMbcrKvxag0A-jOeYGaJfmFT1027_Hc5yqr1kNdyeQZBgzycBXISiEbCnSrR5uITWsdiTYBTAvXY-MXH5rouq4Za-Wqz4pyMhPBXdM32uPM5yJu92S5eblZ6qm2OzHKQ0PsLX3Yna2R61iLX6bjD9UmsIkX0Zxa-w5EztDlofB0nYriQyIZQq6IpI4IffWF9sOLiDgWBv9b8kJXJFV0J8AlPEp4FvSKB8jnoLrWxSWyvIzi_yX9zd-QH26sP5VqwL2hUTYATWJfLfbEPsTyAnVPbKCH6idvAn6d7P-rMzCqAQyjjKOn-2f6T3Bz,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-vL58GDVm-lfvHHdCxHbDp2Ucoo4eJYBm1aqDQlujD5G9D9DBhYAzWKkPF9Yej7fOk1JObVAMioi4Xp_7tnkcFZJaaRb11ULjLQvIHHh3hVKkmUYYdhkOtTw60siI0PMvTkftb0kGBAJqqCzDyxaH8Gbzb2wV-VZpELPMp7XSaLUz9DJ1Ir-Jp5QwreKaafNKLJTO4rc53qPrJUa3sctaCi0K3aShtRGK1t_2XAkCEmx4V8NJemZyUdXse2FgFJsoy57l1KBKeNUYExre7orRTIMqhnolMMQCx0W-fwa8GeDY4bRjnpFfHdxTxTpmXF8F1QLfkllT1o1oP0hinFd-_3uklSIzOEOgCLfs1LT-FRBD7eZ4VtgbwZ762YjtYW5xiDO2ZiCPO-LTqhZywUwSYbsj_kVe_M7VF3GesMgCLAn9n2,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-uhZpo17_rgGoOYJXk2lYgVlCHiL_bnyNi25wFyrRZEwQHNDg8MZuUT6L85pi5rRmorRjPf4n_rK52rxbDmaB0uWtdBcvEWUFIOEguV9yidCOn8GQoJUpXGpJUToa0uHz2Vzli9orAaWnk40v7_ol_afF6wAH6pdR3cv0H1kTErnbLbJj0639skkfynZbdJe0BtpK2LYxlrDe2DqCdhzvM97Brpb34KlSQe77QBweGeYzLB0IHZZ4z8rjTHCori32LP5W7gU-6tlSWJl3fJqq73iQnebZh7QtOJXmckz8SsxglnObFKj-8MRqQWL2_LsiZY1bZi5FAbf6MlhT-xBPaOxFsvm6_BabPKlGibF2zY75el6pHqBtPxakiifkvD2uVbYIGPFRfyXi8XYj9ce8mWEB235ZHAOI_xhr5BgJUhsw,places/ChIJ99DG_RD2wokR4v64upVjBOI/photos/Ab43m-uDMBGmqCgWE1d-WCmX_A0eIzFAyZ-yvjj504JCVjzbHhP6XaMcqNGASgzhUM3P65OFMh1bkIImPlfBAdAeCS4GU7VEpLID9VxBDf-6ah4eoK1JzjgpZH8ttiyNZ7Do19qsbdT4MnCwA3KxwqWW5y-smlgabCQVNj5FEUsQTADNtuocOTQGsKH6VI4HzDj_2iR03quxU1GZ1fBTrQ-D3IxJ7kt2hw2SPQX87sACPQfHhBpGdkdyG-wsZPwkyVjwCxmGDvnE1agO3FouCyahUpkLBfZ6uDmU94lbVZNmlB3ADWFVuqligOf93hpeG4VkjlhsIgicDSyUswbTYKc0LQewEeknrS0jiE8srVJzoci9386TyPQpxy7fZt1JZwBi0MjG6a_g8q3aE0ejtgc6sEwWtMoTo0wk3PrGX8kkNTXIFA}	OPERATIONAL	2026-06-02 09:59:09.715+00
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."events" ("id", "title", "intent", "starts_at", "restaurant_name", "restaurant_subregion", "restaurant_neighbourhood", "restaurant_cuisines", "capacity", "description", "status", "created_by", "created_at", "duration_minutes", "minimum_viable_attendees", "viability_status", "archived_at", "venue_energy", "venue_scene", "venue_crowd", "venue_music", "venue_setting", "venue_price", "venue_latitude", "venue_longitude", "restaurant_id", "google_open_now", "google_opening_hours", "google_good_for_groups", "google_good_for_watching_sports", "google_live_music", "google_outdoor_seating", "google_reservable", "google_serves_beer", "google_serves_brunch", "google_serves_cocktails", "google_serves_dessert", "google_serves_dinner", "google_serves_vegetarian_food", "google_serves_wine", "venue_noise_level", "venue_seating_types", "venue_formats", "venue_indoor_outdoor", "venue_reservation_friendly", "venue_group_friendly", "venue_good_for_conversation", "venue_good_for_cocktails", "venue_good_for_dinner", "venue_good_for_casual_meetups", "venue_vibes", "menu_experience_tags") FROM stdin;
8	Burger Night	friendship	2026-04-30 15:26:00+00	Banter NYC	Midtown	\N	{burgers,bbq,american}	12	\N	cancelled	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-04-24 15:27:32.017751+00	120	2	healthy	2026-04-25 10:43:45.108+00	Moderate	{Social,Date,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$$	40.7279278	-74.0009847	3	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	{}	\N	\N	\N	\N	\N	\N	{}	{}
11	Curry Night	friendship	2026-05-15 19:00:00+00	Paisley	Midtown	\N	{indian}	6	\N	open	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-11 17:15:01.776848+00	120	2	at_risk	\N	Moderate	{Social,Date}	{Mixed,Young,Professional}	{Background}	{Restaurant}	$$$	40.7223355	-74.0095819	6	t	{"Monday: Closed","Tuesday: 11:30 AM – 10:00 PM","Wednesday: 11:30 AM – 10:00 PM","Thursday: 11:30 AM – 10:00 PM","Friday: 11:30 AM – 11:00 PM","Saturday: 11:30 AM – 11:00 PM","Sunday: 11:30 AM – 9:30 PM"}	t	t	t	t	t	t	t	t	t	t	t	t	Moderate	{Tables}	{Restaurant}	{Indoor}	t	t	t	t	t	t	{Social,After-work,Trendy,Cozy,Date-night,Foodie}	{Cocktails,Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options","Late-night food"}
12	Grab and Go	friendship	2026-05-18 18:30:00+00	Bus Stop Diner	Midtown	\N	{diner,american}	6	\N	open	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-11 19:42:54.675231+00	60	3	at_risk	\N	Moderate	{Social,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$	40.8203471	-73.9552275	7	t	{"Monday: 12:00 AM – 11:55 PM","Tuesday: 5:00 AM – 11:55 PM","Wednesday: Open 24 hours","Thursday: Open 24 hours","Friday: Open 24 hours","Saturday: Open 24 hours","Sunday: Open 24 hours"}	t	f	f	f	f	t	t	t	t	t	t	t	Moderate	{Tables,Booths}	{Restaurant}	{Indoor}	f	t	t	f	t	t	{Social,Chill,Casual}	{Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options",Brunch,Cocktails,"Shareable food","Late-night food"}
9	Burger Night	friendship	2026-04-30 15:38:00+00	Banter NYC	Midtown	\N	{burgers,bbq,american}	4	\N	open	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-04-25 15:39:10.925147+00	120	2	healthy	2026-05-11 17:10:36.034+00	Moderate	{Social,Date,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$$	40.7279278	-74.0009847	3	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	{}	{}	\N	\N	\N	\N	\N	\N	{}	{}
10	Posh Steak Night	friendship	2026-05-08 18:22:00+00	Gallagher’s Steakhouse NYC	Midtown	\N	{}	5	\N	open	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-04-25 18:25:21.397787+00	120	5	forced_go	2026-05-11 17:10:38.697+00	Moderate	{Social}	{Professional,Upscale}	{Background,Live}	{Restaurant}	$$$$	40.7628486	-73.9838549	4	f	{"Monday: 11:45 AM – 10:00 PM","Tuesday: 11:45 AM – 10:00 PM","Wednesday: 11:45 AM – 10:00 PM","Thursday: 11:45 AM – 10:00 PM","Friday: 11:45 AM – 11:00 PM","Saturday: 11:45 AM – 11:00 PM","Sunday: 11:45 AM – 10:00 PM"}	t	f	f	f	t	t	f	t	t	t	f	t	Quiet	{Tables}	{Restaurant}	{Indoor}	t	f	f	f	t	f	{Social,After-work,Upscale,Date-night,"Live music"}	{Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options","Gluten-free options"}
14	Noodle Night	friendship	2026-06-04 12:15:00+00	Raku	Midtown	\N	{noodles,asian,japanese}	12	\N	open	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-06-02 12:15:35.004655+00	120	2	healthy	\N	Moderate	{Social,Solo}	{Mixed,Young}	{Background}	{Restaurant}	$$	40.7272479	-74.0025495	5	f	{"Monday: 5:00 – 9:30 PM","Tuesday: 12:00 – 9:30 PM","Wednesday: 12:00 – 9:30 PM","Thursday: 12:00 – 9:30 PM","Friday: 12:00 – 10:00 PM","Saturday: 11:30 AM – 10:00 PM","Sunday: 11:30 AM – 9:30 PM"}	t	f	f	t	t	t	f	t	t	t	t	t	Moderate	{Tables,Booths,"Bar seating",Counter,Communal}	{Restaurant}	{Indoor}	t	t	t	t	t	t	{Social,Outdoor,After-work,Chill,Casual,Trendy,Foodie}	{Cocktails,Wine,Beer,"Full dinner",Dessert,"Vegan/vegetarian options","Small plates","Gluten-free options","Shareable food","Late-night food"}
13	Middle Eastern Night	friendship	2026-05-28 17:46:00+00	Le Baobab Gouygui	Midtown	\N	{"west african",african}	6	\N	open	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-26 17:46:31.447108+00	120	4	at_risk	\N	High	{Social,Party,Solo}	{Mixed}	{Background,DJ,Live}	{Restaurant,Bar}	$	40.802343	-73.9510933	8	f	{"Monday: 1:00 PM – 1:00 AM","Tuesday: 1:00 PM – 1:00 AM","Wednesday: 1:00 PM – 1:00 AM","Thursday: 1:00 PM – 1:00 AM","Friday: 1:00 PM – 1:00 AM","Saturday: 1:00 PM – 1:00 AM","Sunday: 1:00 PM – 1:00 AM"}	t	\N	f	f	t	f	t	f	t	t	f	f	Lively	{Tables,Booths,"Bar seating",Counter}	{Restaurant,Bar}	{Indoor}	f	t	t	t	t	t	{Social,Chill,Trendy,High-energy,Date-night,After-work,"Live music","Sports/bar scene"}	{"Full dinner",Dessert,Brunch,Cocktails,Wine,Beer,"Small plates","Vegan/vegetarian options","Gluten-free options","Shareable food","Late-night food"}
\.


--
-- Data for Name: event_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."event_feedback" ("id", "event_id", "user_id", "venue_rating", "group_rating", "would_join_again", "notes", "created_at", "updated_at") FROM stdin;
2	9	6eb4e006-0d56-4600-bb45-887a885e7ee0	4	3	t	\N	2026-05-01 15:57:23.309456+00	2026-05-01 15:57:23.267+00
\.


--
-- Data for Name: event_signups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."event_signups" ("id", "event_id", "user_id", "status", "restaurant_match_score", "personal_match_score", "personal_match_summary", "created_at", "updated_at", "day_of_confirmation_status", "day_of_confirmation_at") FROM stdin;
139	10	6eb4e006-0d56-4600-bb45-887a885e7ee0	going	62	89	Best overlap in this event: shared event intent, both flexible on travel.	2026-05-06 16:47:29.268053+00	2026-05-07 17:53:59.56+00	pending	\N
151	13	6eb4e006-0d56-4600-bb45-887a885e7ee0	going	69	50	You are currently the first attendee. Group fit will update as others join.	2026-05-28 13:45:28.482028+00	2026-05-28 13:48:20.916+00	confirmed	2026-05-28 13:48:20.916+00
136	9	53e38dfe-c899-491d-897e-9e80724ff339	going	74	98	Best overlap in this event: shared event intent, same subregion.	2026-04-25 18:28:59.687686+00	2026-04-30 14:20:59.415+00	confirmed	2026-04-30 14:20:59.415+00
127	9	6eb4e006-0d56-4600-bb45-887a885e7ee0	going	75	98	Best overlap in this event: shared event intent, same subregion.	2026-04-25 15:39:41.66452+00	2026-04-30 14:21:32.301+00	confirmed	2026-04-30 14:21:32.301+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."notifications" ("id", "user_id", "type", "title", "body", "read_at", "created_at", "email_status", "email_sent_at", "email_attempted_at", "email_error", "email_provider_id", "event_id") FROM stdin;
58	53e38dfe-c899-491d-897e-9e80724ff339	event_at_risk	Event at risk	Burger Night at Banter NYC is now at risk. Too few people have confirmed today, so check your dashboard and decide whether you still want to go.	\N	2026-04-30 14:20:59.721156+00	sent	2026-04-30 14:21:00.534+00	2026-04-30 14:21:00.534+00	\N	83f70aa4-a7b7-4630-a444-bad1034de3f3	9
59	53e38dfe-c899-491d-897e-9e80724ff339	event_follow_up	How did the event go?	How was Burger Night at Banter NYC? Leave feedback on your dashboard so the next events improve.	\N	2026-05-01 14:29:45.333553+00	sent	2026-05-01 14:29:45.725+00	2026-05-01 14:29:45.725+00	\N	049a7c75-19ef-4a7f-8e2f-d6cc6fd06274	9
63	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_follow_up	How did the event go?	How was Burger Night at Banter NYC? Leave feedback on your dashboard so the next events improve.	2026-05-11 17:20:53.09+00	2026-05-02 14:22:11.441289+00	sent	2026-05-02 14:22:11.754+00	2026-05-02 14:22:11.754+00	\N	92c8a855-1231-491f-8253-afc08ce015eb	9
64	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_signup	Event signup confirmed	You're in for Posh Steak Night at Gallagher’s Steakhouse NYC. Restaurant and personal scores are now live on your dashboard.	2026-05-11 17:20:53.09+00	2026-05-06 16:47:29.57948+00	sent	2026-05-06 16:47:29.827+00	2026-05-06 16:47:29.827+00	\N	f0e5606c-c425-4e0f-b78d-3c572b542400	10
68	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_at_risk	Event at risk	Posh Steak Night at Gallagher’s Steakhouse NYC is now at risk. Too few people have confirmed today, so check your dashboard and decide whether you still want to go.	2026-05-11 17:20:53.09+00	2026-05-08 08:30:24.050856+00	sent	2026-05-08 08:30:24.442+00	2026-05-08 08:30:24.442+00	\N	3ac4662b-5244-4d20-b41f-c197b0ee00cb	10
71	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_reminder_24h	Event reminder: 24 hours to go	Posh Steak Night at Gallagher’s Steakhouse NYC is coming up in about 24 hours.	2026-05-11 17:20:53.09+00	2026-05-08 14:53:16.025778+00	sent	2026-05-08 14:53:16.492+00	2026-05-08 14:53:16.492+00	\N	fb5b3f2f-21e2-4b0b-9f1a-5f9f8cb81fec	10
74	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_day_confirmation	Confirm you are still going today	Posh Steak Night at Gallagher’s Steakhouse NYC is today. Confirm on your dashboard if you are still going.	2026-05-11 17:20:53.09+00	2026-05-08 14:53:16.928912+00	sent	2026-05-08 14:53:17.114+00	2026-05-08 14:53:17.114+00	\N	dcd1efbd-1298-441c-ba9e-2b41c2f7f520	10
76	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_follow_up	How did the event go?	How was Posh Steak Night at Gallagher’s Steakhouse NYC? Leave feedback on your dashboard so the next events improve.	2026-05-11 17:20:53.09+00	2026-05-09 14:53:15.339936+00	sent	2026-05-09 14:53:15.777+00	2026-05-09 14:53:15.777+00	\N	e06b438c-be71-4a40-a6c3-eefc20ca93af	10
83	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_update	Event will still proceed	Posh Steak Night at Gallagher’s Steakhouse NYC is still going ahead. The host team has forced it to proceed despite the low same-day count.	2026-05-11 17:20:53.09+00	2026-05-11 17:10:30.381743+00	sent	2026-05-11 17:10:30.69+00	2026-05-11 17:10:30.69+00	\N	95e91ca2-5780-40b7-91f5-4b171240b258	10
88	6eb4e006-0d56-4600-bb45-887a885e7ee0	event_follow_up	How did the event go?	How was Middle Eastern Night at Le Baobab Gouygui? Leave feedback on your dashboard so the next events improve.	\N	2026-05-29 14:42:45.616759+00	sent	2026-05-29 14:42:46.178+00	2026-05-29 14:42:46.178+00	\N	0f0eea2b-1a18-4e0e-b1df-21f4b74a02dd	13
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "display_name", "city", "region", "subregion", "neighbourhood", "intent", "max_travel_minutes", "bio", "created_at", "cuisine_preferences", "preferred_energy", "preferred_scene", "preferred_crowd", "preferred_music", "preferred_setting", "preferred_price", "home_latitude", "home_longitude", "preferred_vibes", "drinking_preferences", "dietary_restrictions", "conversation_preference", "age_range_comfort", "group_size_comfort", "profile_photo_url") FROM stdin;
53e38dfe-c899-491d-897e-9e80724ff339	John Lennon	New York City	Manhattan	Downtown	Downtown	friendship	45	Legend	2026-04-25 17:59:32.407643+00	{greek,american,curry,burgers}	{Chill,Moderate}	{Social,Solo}	{Young,Mixed}	{None,Background}	{Bar,Lounge,Restaurant,Outdoor}	{$,$$}	40.7510737	-73.9875145	{Chill,Social,Casual,Trendy,After-work,"Live music",Outdoor,Foodie}	{"Open to anything",Beer}	{"No dietary restrictions"}	{Conversation-first}	{20s,30s}	{2-4}	\N
6eb4e006-0d56-4600-bb45-887a885e7ee0	David	New York City	Manhattan	Downtown	Long Island City	friendship	45	erfrgrgr	2026-04-14 21:11:00.224926+00	{italian,french}	{Chill,Moderate}	{Social}	{Young,Mixed}	{Background,Live,None}	{Restaurant,Bar}	{$,$$}	40.74471	-73.94844	{Chill,Social,Casual,Date-night,Foodie,After-work,"Live music"}	{Beer,"Open to anything"}	{"No dietary restrictions"}	{Balanced}	{20s,30s}	{2-4}	https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Bass_logo.svg/1280px-Bass_logo.svg.png
98676ed9-6cf2-4471-8e5b-766e892e1818	Jeff	New York City	Manhattan	Midtown	Midtown Manhattan	friendship	30	Easy going, pubs, Mexican, Thai, American	2026-05-28 18:44:21.922486+00	{mexican,thai,american}	{Moderate,Chill}	{Social}	{Mixed}	{None}	{Bar,Outdoor}	{$$}	40.7549309	-73.9840195	{Chill,Social,Casual,After-work,"Sports/bar scene"}	{Beer,Wine,"Open to anything"}	{"No dietary restrictions"}	{Balanced}	{40s+,30s,"Mixed ages"}	{4-6}	\N
\.


--
-- Data for Name: saved_restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."saved_restaurants" ("id", "restaurant_id", "user_id", "created_at") FROM stdin;
10	3	53e38dfe-c899-491d-897e-9e80724ff339	2026-04-25 17:59:40.026299+00
12	4	53e38dfe-c899-491d-897e-9e80724ff339	2026-04-25 18:28:09.680196+00
24	7	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-11 19:44:00.791393+00
28	3	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-14 22:13:36.424656+00
29	6	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-14 22:13:36.877858+00
30	8	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-05-14 22:13:38.172343+00
42	3	98676ed9-6cf2-4471-8e5b-766e892e1818	2026-05-28 18:44:40.506595+00
43	5	6eb4e006-0d56-4600-bb45-887a885e7ee0	2026-06-02 12:15:53.303207+00
\.


--
-- Data for Name: venue_traits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."venue_traits" ("restaurant_id", "cuisine_tags", "vibe_tags", "setting_tags", "social_fit_tags", "price_band", "confidence_score", "source", "generated_at") FROM stdin;
3	{burgers,bbq,american}	{Social,Date-night,Outdoor,After-work,Casual}	{Restaurant,Indoor,Outdoor}	{Social,Date,Solo,Mixed,Young,Group-friendly,Conversation-first}	$$	1.00	google_places+rules	2026-06-02 09:59:07.912+00
4	{}	{Social,After-work,Upscale,Date-night,"Live music"}	{Restaurant,Indoor}	{Social,Professional,Upscale}	$$$$	0.83	google_places+rules	2026-06-02 09:59:08.396+00
5	{noodles,asian,japanese}	{Social,Outdoor,After-work,Chill,Casual,Trendy,Foodie}	{Restaurant,Indoor,Outdoor}	{Social,Solo,Mixed,Young,Group-friendly,Conversation-first}	$$	1.00	google_places+rules	2026-06-02 09:59:08.753+00
6	{indian}	{Social,After-work,Trendy,Cozy,Date-night,Foodie,Casual}	{Restaurant,Indoor,Outdoor}	{Social,Date,Mixed,Young,Professional,Group-friendly,Conversation-first}	$$$	1.00	google_places+rules	2026-06-02 09:59:09.117+00
7	{diner,american}	{Social,Chill,Casual}	{Restaurant,Indoor}	{Social,Solo,Mixed,Young,Group-friendly,Conversation-first}	$	1.00	google_places+rules	2026-06-02 09:59:09.392+00
8	{"west african",african}	{Social,Chill,Trendy,High-energy,Date-night,After-work,"Live music","Sports/bar scene",Lively,Casual}	{Restaurant,Bar,Indoor}	{Social,Party,Solo,Mixed,Group-friendly,Conversation-first}	$	1.00	google_places+rules	2026-06-02 09:59:09.738+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 182, true);


--
-- Name: event_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."event_feedback_id_seq"', 3, true);


--
-- Name: event_signups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."event_signups_id_seq"', 152, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."events_id_seq"', 14, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."notifications_id_seq"', 89, true);


--
-- Name: restaurants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."restaurants_id_seq"', 8, true);


--
-- Name: saved_restaurants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."saved_restaurants_id_seq"', 43, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict e3i7f2Fdm4rtcIbW9ei3qTwC5LjHqnycKHbytU4OWhW1KaRFmAyEeU0R9aEmkL0

RESET ALL;
