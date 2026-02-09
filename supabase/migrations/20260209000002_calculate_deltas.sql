-- Migration: Delta Calculation Procedure
-- Purpose: Populates delta_wow and delta_mom in metric_observations

CREATE OR REPLACE FUNCTION public.calculate_metric_deltas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update WoW deltas (7-day window) for daily metrics
    UPDATE public.metric_observations mo
    SET delta_wow = sub.delta
    FROM (
        SELECT 
            metric_id, 
            as_of_date,
            value - LAG(value, 7) OVER (PARTITION BY metric_id ORDER BY as_of_date) as delta
        FROM public.metric_observations
        WHERE metric_id IN (SELECT id FROM public.metrics WHERE native_frequency = 'daily' AND is_active = true)
        AND as_of_date > (CURRENT_DATE - INTERVAL '90 days')
    ) sub
    WHERE mo.metric_id = sub.metric_id AND mo.as_of_date = sub.as_of_date;

    -- Update WoW for weekly metrics (LAG 1)
    UPDATE public.metric_observations mo
    SET delta_wow = sub.delta
    FROM (
        SELECT 
            metric_id, 
            as_of_date,
            value - LAG(value, 1) OVER (PARTITION BY metric_id ORDER BY as_of_date) as delta
        FROM public.metric_observations
        WHERE metric_id IN (SELECT id FROM public.metrics WHERE native_frequency = 'weekly' AND is_active = true)
        AND as_of_date > (CURRENT_DATE - INTERVAL '90 days')
    ) sub
    WHERE mo.metric_id = sub.metric_id AND mo.as_of_date = sub.as_of_date;

    -- Update MoM deltas for daily: LAG 30
    UPDATE public.metric_observations mo
    SET delta_mom = sub.delta
    FROM (
        SELECT 
            metric_id, 
            as_of_date,
            value - LAG(value, 30) OVER (PARTITION BY metric_id ORDER BY as_of_date) as delta
        FROM public.metric_observations
        WHERE metric_id IN (SELECT id FROM public.metrics WHERE native_frequency = 'daily' AND is_active = true)
        AND as_of_date > (CURRENT_DATE - INTERVAL '90 days')
    ) sub
    WHERE mo.metric_id = sub.metric_id AND mo.as_of_date = sub.as_of_date;

    -- Update MoM for Monthly: LAG 1
    UPDATE public.metric_observations mo
    SET delta_mom = sub.delta
    FROM (
        SELECT 
            metric_id, 
            as_of_date,
            value - LAG(value, 1) OVER (PARTITION BY metric_id ORDER BY as_of_date) as delta
        FROM public.metric_observations
        WHERE metric_id IN (SELECT id FROM public.metrics WHERE native_frequency = 'monthly' AND is_active = true)
        AND as_of_date > (CURRENT_DATE - INTERVAL '90 days')
    ) sub
    WHERE mo.metric_id = sub.metric_id AND mo.as_of_date = sub.as_of_date;

END;
$$;
