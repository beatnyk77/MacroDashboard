CREATE TABLE IF NOT EXISTS public.metric_publication_snapshots (
  snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id text NOT NULL,
  slug text NOT NULL,
  payload jsonb NOT NULL,
  observed_at timestamptz,
  published_at timestamptz NOT NULL DEFAULT now(),
  methodology_version text NOT NULL,
  source_snapshot_hash text,
  data_status text NOT NULL,
  revision_of uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT metric_publication_snapshots_revision_of_self_check
    CHECK (revision_of IS NULL OR revision_of <> snapshot_id),
  CONSTRAINT metric_publication_snapshots_data_status_check
    CHECK (
      data_status = ANY (
        ARRAY['verified', 'provisional', 'revised', 'corrected', 'unavailable']
      )
    ),
  CONSTRAINT metric_publication_snapshots_revision_of_fkey
    FOREIGN KEY (revision_of)
    REFERENCES public.metric_publication_snapshots(snapshot_id)
);

ALTER TABLE public.metric_publication_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on metric_publication_snapshots"
  ON public.metric_publication_snapshots;
CREATE POLICY "Allow public read access on metric_publication_snapshots"
  ON public.metric_publication_snapshots
  FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL);

DROP POLICY IF EXISTS "Allow service role full access on metric_publication_snapshots"
  ON public.metric_publication_snapshots;
CREATE POLICY "Allow service role full access on metric_publication_snapshots"
  ON public.metric_publication_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.metric_publication_snapshots TO anon, authenticated;
GRANT ALL ON public.metric_publication_snapshots TO service_role;

CREATE INDEX IF NOT EXISTS idx_metric_publication_snapshots_slug_published_at
  ON public.metric_publication_snapshots (slug, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_metric_publication_snapshots_metric_id_observed_at
  ON public.metric_publication_snapshots (metric_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_metric_publication_snapshots_revision_of
  ON public.metric_publication_snapshots (revision_of)
  WHERE revision_of IS NOT NULL;

CREATE OR REPLACE VIEW public.vw_metric_publication_snapshots_public AS
SELECT
  s.snapshot_id,
  s.metric_id,
  s.slug,
  s.payload,
  s.observed_at,
  s.published_at,
  s.methodology_version,
  s.source_snapshot_hash,
  s.data_status,
  s.revision_of,
  s.created_at,
  NOT EXISTS (
    SELECT 1
      FROM public.metric_publication_snapshots successor
     WHERE successor.revision_of = s.snapshot_id
  ) AS is_current,
  EXISTS (
    SELECT 1
      FROM public.metric_publication_snapshots successor
     WHERE successor.revision_of = s.snapshot_id
  ) AS is_superseded
FROM public.metric_publication_snapshots s;

GRANT SELECT ON public.vw_metric_publication_snapshots_public TO anon, authenticated;
ALTER VIEW public.vw_metric_publication_snapshots_public SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.metric_publication_snapshots_block_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'metric_publication_snapshots is append-only';
END;
$$;

DROP TRIGGER IF EXISTS metric_publication_snapshots_block_update
  ON public.metric_publication_snapshots;
CREATE TRIGGER metric_publication_snapshots_block_update
  BEFORE UPDATE ON public.metric_publication_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.metric_publication_snapshots_block_mutation();

DROP TRIGGER IF EXISTS metric_publication_snapshots_block_delete
  ON public.metric_publication_snapshots;
CREATE TRIGGER metric_publication_snapshots_block_delete
  BEFORE DELETE ON public.metric_publication_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.metric_publication_snapshots_block_mutation();

CREATE OR REPLACE FUNCTION public.metric_publication_snapshots_validate_revision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  prior_snapshot public.metric_publication_snapshots%ROWTYPE;
BEGIN
  IF NEW.revision_of IS NULL THEN
    IF NEW.data_status IN ('revised', 'corrected') THEN
      RAISE EXCEPTION 'revised and corrected snapshots must set revision_of';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.data_status NOT IN ('revised', 'corrected') THEN
    RAISE EXCEPTION 'revision_of requires data_status revised or corrected';
  END IF;

  SELECT *
    INTO prior_snapshot
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = NEW.revision_of;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'revision_of must reference an existing snapshot';
  END IF;

  IF prior_snapshot.metric_id <> NEW.metric_id THEN
    RAISE EXCEPTION 'revision_of must reference the same metric';
  END IF;

  IF prior_snapshot.published_at >= NEW.published_at THEN
    RAISE EXCEPTION 'revision_of must reference an older snapshot';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.metric_publication_snapshots existing_successor
     WHERE existing_successor.revision_of = prior_snapshot.snapshot_id
  ) THEN
    RAISE EXCEPTION 'revision_of must reference the current active snapshot';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS metric_publication_snapshots_validate_revision
  ON public.metric_publication_snapshots;
CREATE TRIGGER metric_publication_snapshots_validate_revision
  BEFORE INSERT ON public.metric_publication_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.metric_publication_snapshots_validate_revision();

COMMENT ON TABLE public.metric_publication_snapshots IS
  'Append-only publication snapshots for public metric records. New snapshots point backward through revision_of. Revised and corrected snapshots preserve the prior payload, and current versus superseded state is derived from successor rows.';

COMMENT ON COLUMN public.metric_publication_snapshots.data_status IS
  'AuthorityMetricStatus contract: verified, provisional, revised, corrected, unavailable.';

COMMENT ON COLUMN public.metric_publication_snapshots.revision_of IS
  'References the older snapshot for the same metric. Snapshots are immutable once written, and successor rows define when an older snapshot becomes superseded.';

COMMENT ON VIEW public.vw_metric_publication_snapshots_public IS
  'Public snapshot feed with derived current and superseded flags. Rows stay immutable; successor links determine which snapshot is current.';
