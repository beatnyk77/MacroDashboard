-- =====================================================
-- Phase 3 Phase 3: Indian Pulse Expansion Metrics
-- =====================================================

-- Register new PLFS metrics
INSERT INTO public.metrics (id, name, description, frequency, native_frequency, display_frequency, source, unit, tier, category, expected_interval_days)
VALUES 
    ('IN_LFPR', 'Labor Force Participation Rate', 'Percentage of population working or looking for work (PLFS)', 'quarterly', 'quarterly', 'quarterly', 'MoSPI', 'Percent', 'core', 'macro_regime', 90),
    ('IN_WAGE_GROWTH', 'Average Earnings / Wage Growth', 'Average weekly earnings for regular salaried employees (PLFS)', 'quarterly', 'quarterly', 'quarterly', 'MoSPI', 'INR', 'core', 'macro_regime', 90),
    ('IN_HOURS_WORKED', 'Average Hours Worked', 'Average number of hours worked in a week (PLFS)', 'quarterly', 'quarterly', 'quarterly', 'MoSPI', 'Hours', 'core', 'macro_regime', 90)
ON CONFLICT (id) DO NOTHING;

-- Register ASI derived metrics
INSERT INTO public.metrics (id, name, description, frequency, native_frequency, display_frequency, source, unit, tier, category, expected_interval_days)
VALUES 
    ('IN_ASI_GVA_TOTAL', 'India ASI - Total GVA', 'Gross Value Added from Annual Survey of Industries (All India)', 'annual', 'annual', 'annual', 'MoSPI ASI', 'crores', 'secondary', 'macro_regime', 365),
    ('IN_ASI_EMPLOYMENT_TOTAL', 'India ASI - Total Employment', 'Total Employment from Annual Survey of Industries (All India)', 'annual', 'annual', 'annual', 'MoSPI ASI', 'thousands', 'secondary', 'macro_regime', 365),
    ('IN_ASI_CAPACITY_UTIL', 'India ASI - Capacity Utilization', 'Average Capacity Utilization Rate from ASI', 'annual', 'annual', 'annual', 'MoSPI ASI', '%', 'secondary', 'macro_regime', 365)
ON CONFLICT (id) DO NOTHING;
