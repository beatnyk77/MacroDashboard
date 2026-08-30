BEGIN;

SET ROLE service_role;

DO $$
  DECLARE
  base_snapshot_id uuid := '11111111-1111-1111-1111-111111111111';
  revised_snapshot_id uuid := '22222222-2222-2222-2222-222222222222';
  superseded_snapshot_id uuid := '33333333-3333-3333-3333-333333333333';
  invalid_status_snapshot_id uuid := '55555555-5555-5555-5555-555555555555';
  self_revision_snapshot_id uuid := '66666666-6666-6666-6666-666666666666';
  wrong_metric_snapshot_id uuid := '77777777-7777-7777-7777-777777777777';
  older_revision_snapshot_id uuid := '88888888-8888-8888-8888-888888888888';
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
    superseded_snapshot_id,
    'net-liquidity',
    'net-liquidity',
    '{"value":125,"unit":"index"}'::jsonb,
    '2026-08-30T00:00:00Z',
    '2026-08-31T13:00:00Z',
    '1.0.2',
    'hash-superseded',
    'superseded',
    NULL
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
      base_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":126,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T14:00:00Z',
      '1.0.3',
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
      '{"value":127,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T14:30:00Z',
      '1.0.4',
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
      self_revision_snapshot_id,
      'net-liquidity',
      'net-liquidity',
      '{"value":128,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T15:00:00Z',
      '1.0.5',
      'hash-self',
      'verified',
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
      '{"value":129,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T16:00:00Z',
      '1.0.6',
      'hash-wrong-metric',
      'verified',
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
      '{"value":130,"unit":"index"}'::jsonb,
      '2026-08-30T00:00:00Z',
      '2026-08-31T11:00:00Z',
      '1.0.7',
      'hash-older',
      'revised',
      revised_snapshot_id
    );
    RAISE EXCEPTION 'older revision unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      NULL;
  END;

  PERFORM 1
    FROM public.metric_publication_snapshots
   WHERE snapshot_id = revised_snapshot_id
     AND data_status = 'revised';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'expected revised snapshot was not written';
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
