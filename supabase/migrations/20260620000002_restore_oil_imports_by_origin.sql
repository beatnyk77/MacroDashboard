-- Restore oil_imports_by_origin (missing on production despite ingest functions writing to it)

CREATE TABLE IF NOT EXISTS public.oil_imports_by_origin (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    importer_country_code text NOT NULL,
    exporter_country_code text NOT NULL,
    exporter_country_name text,
    import_volume_mbbl numeric NOT NULL,
    as_of_date date NOT NULL,
    frequency text NOT NULL,
    import_cost_usd numeric,
    import_cost_local_currency numeric,
    exchange_rate numeric,
    brent_price_usd numeric,
    last_updated_at timestamptz DEFAULT now(),
    source_id int REFERENCES public.data_sources(id),
    UNIQUE(importer_country_code, exporter_country_code, as_of_date)
);

ALTER TABLE public.oil_imports_by_origin ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'Allow public read access'
          AND tablename = 'oil_imports_by_origin'
    ) THEN
        CREATE POLICY "Allow public read access"
            ON public.oil_imports_by_origin FOR SELECT USING (true);
    END IF;
END $$;