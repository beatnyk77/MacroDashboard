CREATE OR REPLACE FUNCTION public.refresh_us_sector_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.us_sector_summary;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_us_sector_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_us_sector_summary() TO service_role;
