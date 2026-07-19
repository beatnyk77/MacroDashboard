-- Growth stack: share cards, export leads, regime alerts, daily brief + alert crons.
-- Terminal stays free; these power synthesis cadence + export actionability.

-- 1) Share image URL on briefs (additive)
ALTER TABLE public.daily_macro_briefs
  ADD COLUMN IF NOT EXISTS share_image_url text;

COMMENT ON COLUMN public.daily_macro_briefs.share_image_url IS
  'Public SVG/PNG URL for OG/social share card; set by generate-share-card.';

-- 2) Export Scout lead capture (insert-only for anon)
CREATE TABLE IF NOT EXISTS public.export_scout_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  hs_code text,
  playbook_path text,
  source text NOT NULL DEFAULT 'export-scout',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_scout_leads_created
  ON public.export_scout_leads (created_at DESC);

ALTER TABLE public.export_scout_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "export_scout_leads_anon_insert" ON public.export_scout_leads;
CREATE POLICY "export_scout_leads_anon_insert"
  ON public.export_scout_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    AND char_length(email) <= 254
  );

DROP POLICY IF EXISTS "export_scout_leads_service_all" ON public.export_scout_leads;
CREATE POLICY "export_scout_leads_service_all"
  ON public.export_scout_leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.export_scout_leads IS
  'Optional leads after free Export Scout playbook. No paywall — capture only.';

-- 3) Regime alert send log (≤1 flip email/day)
CREATE TABLE IF NOT EXISTS public.regime_alert_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  as_of_date date NOT NULL,
  from_label text,
  to_label text,
  sent_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT regime_alert_sends_date_unique UNIQUE (as_of_date)
);

ALTER TABLE public.regime_alert_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regime_alert_sends_service_all" ON public.regime_alert_sends;
CREATE POLICY "regime_alert_sends_service_all"
  ON public.regime_alert_sends
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4) Storage bucket for share cards (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'share-cards',
  'share-cards',
  true,
  1048576,
  ARRAY['image/svg+xml', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "share_cards_public_read" ON storage.objects;
CREATE POLICY "share_cards_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'share-cards');

DROP POLICY IF EXISTS "share_cards_service_write" ON storage.objects;
CREATE POLICY "share_cards_service_write"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'share-cards')
  WITH CHECK (bucket_id = 'share-cards');

-- 5) Cron: send-daily-brief 07:30 UTC (after morning brief ~06:45)
SELECT cron.unschedule('send-daily-brief-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-brief-job');

SELECT cron.schedule(
  'send-daily-brief-job',
  '30 7 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/send-daily-brief',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

-- 6) Cron: growth-actions regime-alert 08:00 UTC weekdays
SELECT cron.unschedule('growth-regime-alert-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'growth-regime-alert-job');

SELECT cron.schedule(
  'growth-regime-alert-job',
  '0 8 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/growth-actions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1),
        ''
      )
    ),
    body := jsonb_build_object('task', 'regime-alert'),
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

-- 7) Cron: generate-share-card after brief 07:00 UTC weekdays
SELECT cron.unschedule('generate-share-card-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-share-card-job');

SELECT cron.schedule(
  'generate-share-card-job',
  '0 7 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/generate-share-card',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
      ),
      'x-cron-secret', COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1),
        ''
      )
    ),
    body := jsonb_build_object('type', 'morning_brief'),
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);
