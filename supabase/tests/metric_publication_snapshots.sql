BEGIN;

SET ROLE service_role;

DO $$
  DECLARE
  base_snapshot_id uuid := '11111111-1111-1111-1111-111111111111';
  revised_snapshot_id uuid := '22222222-2222-2222-2222-222222222222';
  corrected_snapshot_id uuid := '33333333-3333-3333-3333-333333333333';
  invalid_superseded_snapshot_id uuid := '44444444-4444-4444-4444-444444444444';
  invalid_status_snapshot_id uuid := '55555555-5555-5555-5555-555555555555';
  self_revision_snapshot_id uuid := '66666666-6666-6666-6666-666666666666';
  wrong_metric_snapshot_id uuid := '77777777-7777-7777-7777-777777777777';
  older_revision_snapshot_id uuid := '88888888-8888-8888-8888-888888888888';
  unlinked_revised_snapshot_id uuid := '99999999-9999-9999-9999-999999999999';
  linked_verified_snapshot_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  column_record record;
  index_count integer;
  rel_row_security boolean;
  policy_count integer;
BEGIN
  SELECT data_type, udt_name
    INTO column_record
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'metric_publication_snapshots'
     AND column_name = 'payload';

  IF column_record.data_type <> 'jsonb' THEN
    RAISE EXCEPTION 'expected payload to be jsonb, got % (%)', column_record.data_type, column_record.udt_name;
  END IF;

  SELECT data_type, udt_name
    INTO column_record
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'metric_publication_snapshots'
     AND column_name = 'published_at';

  IF column_record.data_type <> 'timestamp with time zone' THEN
    RAISE EXCEPTION 'expected published_at to be timestamptz, got %', column_record.data_type;
  END IF;

  SELECT data_type, udt_name
    INTO column_record
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'metric_publication_snapshots'
     AND column_name = 'revision_of';

  IF column_record.data_type <> 'uuid' THEN
    RAISE EXCEPTION 'expected revision_of to be uuid, got %', column_record.data_type;
  END IF;

  SELECT data_type, udt_name
    INTO column_record
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'metric_publication_snapshots'
     AND column_name = 'superseded_at';

  IF column_record.data_type <> 'timestamp with time zone' THEN
    RAISE EXCEPTION 'expected superseded_at to be timestamptz, got %', column_record.data_type;
  END IF;

  SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
   WHERE schemaname = 'public'
     AND tablename = 'metric_publication_snapshots'
     AND indexname = 'idx_metric_publication_snapshots_slug_published_at'
     AND indexdef ILIKE '%(slug, published_at DESC)%';

  IF index_count <> 1 THEN
    RAISE EXCEPTION 'expected slug/published_at index';
  END IF;

  SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
   WHERE schemaname = 'public'
     AND tablename = 'metric_publication_snapshots'
     AND indexname = 'idx_metric_publication_snapshots_metric_id_observed_at'
     AND indexdef ILIKE '%(metric_id, observed_at DESC)%';

  IF index_count <> 1 THEN
    RAISE EXCEPTION 'expected metric_id/observed_at index';
  END IF;

  SELECT c.relrowsecurity
    INTO rel_row_security
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = 'metric_publication_snapshots';

  IF rel_row_security IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'expected RLS enabled on metric_publication_snapshots';
  END IF;

  SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'metric_publication_snapshots';

  IF policy_count < 2 THEN
    RAISE EXCEPTION 'expected read and service policies on metric_publication_snapshots';
  END IF;

  INSERT INTO public.metric_publication_snapshots (
    snapshot_id,
    metric_id,
    slug,
    payload,
    observed_at,
    published_at,
    methodology_version,
    source_snapshot_hash,
    data_status,
    revision_of
  )
  VALUES (
    base_snapshot_id,
    'net-liquidity',
    'net-liquidity',
    '{"value":123,"unit":"index"}'::jsonb,
    '2026-08-30T00:00:00Z',
    '2026-08-30T12:00:00Z',
    '1.0.0',
    'hash-base',
    'verified',
    NULL
  );

  INSERT INTO public.metric_publication_snapshots (
    snapshot_id,
    metric_id,
    slug,
    payload,
    observed_at,
    published_at,
    methodology_version,
    source_snapshot_hash,
    data_status,
    revision_of
  )
  VALUES (
    revised_snapshot_id,
    'net-liquidity',
    'net-liquidity',
    '{"value":124,"unit":"index"}'::jsonb,
    '2026-08-30T00:00:00Z',
    '2026-08-31T12:00:00Z',
    '1.0.1',
    'hash-revised',
    'revised',
    base_snapshot_id
  );

  INSERT INTO public.metric_publication_snapshots (
    snapshot_id,
    metric_id,
    slug,
    payload,
    observed_at,
    published_at,
    methodology_version,
    source_snapshot_hash,
    data_status,
    revision_of
  )
  VALUES (
    corrected_snapshot_id,
    'net-liquidity',
    'net-liquidity',
    '{"value":125,"unit":"index"}'::jsonb,
    '2026-08-30T00:00:00Z',
    '2026-08-31T13:00:00Z',
    '1.0.2',
    'hash-corrected',
    'corrected',
    revised_snapshot_id
  );

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      invalid_superseded_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":126,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T13:30:00Z',
      '1.0.3',
      'hash-superseded',
      'superseded',
      NULL
    );
    RAISE EXCEPTION 'standalone superseded snapshot unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      base_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":127,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T14:00:00Z',
      '1.0.4',
      'hash-duplicate',
      'verified',
      NULL
    );
    RAISE EXCEPTION 'duplicate snapshot_id unexpectedly succeeded';
  EXCEPTION
    WHEN unique_violation THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      invalid_status_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":128,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T14:30:00Z',
      '1.0.5',
      'hash-invalid',
      'draft',
      NULL
    );
    RAISE EXCEPTION 'invalid data_status unexpectedly succeeded';
  EXCEPTION
    WHEN check_violation THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      unlinked_revised_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":129,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T14:45:00Z',
      '1.0.6',
      'hash-unlinked-revised',
      'revised',
      NULL
    );
    RAISE EXCEPTION 'revised snapshot without revision_of unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      linked_verified_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":130,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T14:50:00Z',
      '1.0.7',
      'hash-linked-verified',
      'verified',
      corrected_snapshot_id
    );
    RAISE EXCEPTION 'verified snapshot with revision_of unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      self_revision_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":131,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T15:00:00Z',
      '1.0.8',
      'hash-self',
      'revised',
      self_revision_snapshot_id
    );
    RAISE EXCEPTION 'self-revision unexpectedly succeeded';
  EXCEPTION
    WHEN check_violation OR foreign_key_violation OR raise_exception THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      wrong_metric_snapshot_id,
      'fiscal-dominance-meter',
      'fiscal-dominance-meter',
      '{"value":132,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T16:00:00Z',
      '1.0.9',
      'hash-wrong-metric',
      'corrected',
      base_snapshot_id
    );
    RAISE EXCEPTION 'cross-metric revision unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      NULL;
  END;

  BEGIN
    INSERT INTO public.metric_publication_snapshots (
      snapshot_id,
      metric_id,
      slug,
      payload,
      observed_at,
      published_at,
      methodology_version,
      source_snapshot_hash,
      data_status,
      revision_of
    )
    VALUES (
      older_revision_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":133,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T11:00:00Z',
      '1.0.10',
      'hash-older',
      'revised',
      corrected_snapshot_id
    );
    RAISE EXCEPTION 'older revision unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      NULL;
  END;

  PERFORM 1
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = corrected_snapshot_id
     AND data_status = 'corrected'
     AND revision_of = revised_snapshot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'expected corrected snapshot was not written';
  END IF;

  PERFORM 1
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = base_snapshot_id
     AND payload = '{"value":123,"unit":"index"}'::jsonb
     AND data_status = 'verified'
     AND superseded_at = '2026-08-31T12:00:00Z'::timestamptz;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'expected base snapshot to stay immutable and be superseded by revised snapshot';
  END IF;

  PERFORM 1
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = revised_snapshot_id
     AND payload = '{"value":124,"unit":"index"}'::jsonb
     AND data_status = 'revised'
     AND revision_of = base_snapshot_id
     AND superseded_at = '2026-08-31T13:00:00Z'::timestamptz;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'expected revised snapshot to stay immutable and be superseded by corrected snapshot';
  END IF;

  PERFORM 1
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = corrected_snapshot_id
     AND superseded_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'expected corrected snapshot to remain current';
  END IF;
END $$;

RESET ROLE;
SET ROLE anon;

DO $$
BEGIN
  PERFORM 1
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = '22222222-2222-2222-2222-222222222222'::uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'published snapshot is not readable by anon';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    UPDATE public.metric_publication_snapshots
       SET payload = jsonb_set(payload, '{value}', '999'::jsonb, true)
     WHERE snapshot_id = '22222222-2222-2222-2222-222222222222'::uuid;
    RAISE EXCEPTION 'anon update unexpectedly succeeded';
  EXCEPTION
    WHEN insufficient_privilege OR raise_exception THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    DELETE FROM public.metric_publication_snapshots
     WHERE snapshot_id = '22222222-2222-2222-2222-222222222222'::uuid;
    RAISE EXCEPTION 'anon delete unexpectedly succeeded';
  EXCEPTION
    WHEN insufficient_privilege OR raise_exception THEN
      NULL;
  END;
END $$;

RESET ROLE;
SET ROLE authenticated;

DO $$
BEGIN
  BEGIN
    UPDATE public.metric_publication_snapshots
       SET payload = jsonb_set(payload, '{value}', '1000'::jsonb, true)
     WHERE snapshot_id = '22222222-2222-2222-2222-222222222222'::uuid;
    RAISE EXCEPTION 'authenticated update unexpectedly succeeded';
  EXCEPTION
    WHEN insufficient_privilege OR raise_exception THEN
      NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    DELETE FROM public.metric_publication_snapshots
     WHERE snapshot_id = '22222222-2222-2222-2222-222222222222'::uuid;
    RAISE EXCEPTION 'authenticated delete unexpectedly succeeded';
  EXCEPTION
    WHEN insufficient_privilege OR raise_exception THEN
      NULL;
  END;
END $$;

ROLLBACK;
