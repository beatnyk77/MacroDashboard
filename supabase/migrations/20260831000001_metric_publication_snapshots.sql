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
        ARRAY['verified', 'provisional', 'revised', 'corrected', 'unavailable', 'superseded']
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
    RETURN NEW;
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
  'Append-only publication snapshots for public metric records. New snapshots point backward through revision_of. Revised and corrected snapshots preserve the prior payload; superseded stays in the accepted AuthorityMetricStatus contract for ledger visibility.';

COMMENT ON COLUMN public.metric_publication_snapshots.data_status IS
  'AuthorityMetricStatus contract: verified, provisional, revised, corrected, unavailable, superseded.';

COMMENT ON COLUMN public.metric_publication_snapshots.revision_of IS
  'References the older snapshot for the same metric. Snapshots are immutable once written.';
