-- Migration: Delta Calculation Procedure (Refactored for Gappy Data)
-- Purpose: Populates delta_wow and delta_mom in metric_observations using time-based lookups

CREATE OR REPLACE FUNCTION public.calculate_metric_deltas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Update WoW deltas (7-day window) for daily metrics
    -- Using a subquery to find the value approximately 7 days ago
    UPDATE public.metric_observations mo
    SET delta_wow = mo.value - sub.prev_value
    FROM (
        SELECT 
            m1.metric_id, 
            m1.as_of_date,
            (SELECT m2.value 
             FROM public.metric_observations m2 
             WHERE m2.metric_id = m1.metric_id 
             AND m2.as_of_date <= m1.as_of_date - INTERVAL '7 days'
             ORDER BY m2.as_of_date DESC 
             LIMIT 1) as prev_value
        FROM public.metric_observations m1
        WHERE m1.metric_id IN (SELECT id FROM public.metrics WHERE native_frequency = 'daily' AND is_active = true)
        AND m1.as_of_date > (CURRENT_DATE - INTERVAL '90 days')
    ) sub
    WHERE mo.metric_id = sub.metric_id 
    AND mo.as_of_date = sub.as_of_date
    AND sub.prev_value IS NOT NULL;

    -- 2. Update WoW for weekly metrics (LAG 1)
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

    -- 3. Update MoM deltas for daily: 30-day window
    UPDATE public.metric_observations mo
    SET delta_mom = mo.value - sub.prev_value
    FROM (
        SELECT 
            m1.metric_id, 
            m1.as_of_date,
            (SELECT m2.value 
             FROM public.metric_observations m2 
             WHERE m2.metric_id = m1.metric_id 
             AND m2.as_of_date <= m1.as_of_date - INTERVAL '30 days'
             ORDER BY m2.as_of_date DESC 
             LIMIT 1) as prev_value
        FROM public.metric_observations m1
        WHERE m1.metric_id IN (SELECT id FROM public.metrics WHERE native_frequency = 'daily' AND is_active = true)
        AND m1.as_of_date > (CURRENT_DATE - INTERVAL '90 days')
    ) sub
    WHERE mo.metric_id = sub.metric_id 
    AND mo.as_of_date = sub.as_of_date
    AND sub.prev_value IS NOT NULL;

    -- 4. Update MoM for Monthly: LAG 1
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
