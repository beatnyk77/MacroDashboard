import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface StateConflictRisk {
    state_code: string;
    state_name: string;
    gulf_remittance_exposure: number; // Estimated % of state GSDP or share of total
    fiscal_dependency: number; // State Debt as % of GSDP
    risk_score: number; // 0-100 normalized
}

export interface ConflictImpactData {
    brentPrice: number;
    fxReserves: number;
    remittanceFlows: { date: string; value: number }[];
    resilienceMetrics: {
        metric: string;
        val1990: string;
        val2025: string;
        status: 'IMPROVED' | 'DEGRADED' | 'NEUTRAL';
    }[];
    stateRisks: StateConflictRisk[];
}

// Heuristic Gulf Exposure Weights (Share of total remittances to India)
const GULF_EXPOSURE_WEIGHTS: Record<string, number> = {
    'KL': 0.28, // Kerala
    'TN': 0.16, // Tamil Nadu
    'UP': 0.13, // Uttar Pradesh
    'KA': 0.09, // Karnataka
    'MH': 0.08, // Maharashtra
    'BR': 0.07, // Bihar
    'PB': 0.05, // Punjab
    'AP': 0.04, // Andhra Pradesh
    'TS': 0.04, // Telangana
    'RJ': 0.03, // Rajasthan
    'GJ': 0.03, // Gujarat
};

export function useIranConflictImpact() {
    return useQuery({
        queryKey: ['iran_conflict_impact'],
        queryFn: async (): Promise<ConflictImpactData> => {
            // 1. Fetch Latest Brent Price
            const { data: brentData } = await supabase
                .from('metric_observations')
                .select('value')
                .eq('metric_id', 'OIL_BRENT_PRICE_USD')
                .order('as_of_date', { ascending: false })
                .limit(1);

            // 2. Fetch India FX Reserves Time Series
            const { data: fxData } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', 'IN_FX_RESERVES')
                .order('as_of_date', { ascending: true });

            // 3. Fetch State Fiscal Health
            const { data: stateData } = await supabase
                .from('india_state_fiscal_health')
                .select('state_code, state_name, debt_gsdp_pct');

            // 4. Construct Resilience Metrics (1990 vs 2025)
            // Values based on historical WB/RBI data and current projections
            const resilienceMetrics = [
                {
                    metric: 'FX Reserve Cover',
                    val1990: '14 Days',
                    val2025: '11 Months',
                    status: 'IMPROVED' as const
                },
                {
                    metric: 'Total Remittances',
                    val1990: '$2.1 Billion',
                    val2025: '$125 Billion',
                    status: 'IMPROVED' as const
                },
                {
                    metric: 'Current Account % GDP',
                    val1990: '-3.1%',
                    val2025: '-1.2%',
                    status: 'IMPROVED' as const
                },
                {
                    metric: 'Import Dependence (Oil)',
                    val1990: '45%',
                    val2025: '87%',
                    status: 'DEGRADED' as const // We are more dependent on the commodity, but have more FX
                }
            ];

            // 5. Calculate State Risk Scores (Heuristic)
            const stateRisks: StateConflictRisk[] = (stateData || []).map(state => {
                const exposure = GULF_EXPOSURE_WEIGHTS[state.state_code] || 0.01;
                const fiscalStress = Number(state.debt_gsdp_pct) / 100; // Normalized factor
                
                // Risk = (Exposure * 0.7) + (FiscalStress * 0.3)
                const score = (exposure * 100 * 0.7) + (fiscalStress * 100 * 0.3);

                return {
                    state_code: state.state_code,
                    state_name: state.state_name,
                    gulf_remittance_exposure: exposure * 100,
                    fiscal_dependency: Number(state.debt_gsdp_pct),
                    risk_score: Math.min(100, score * 1.5) // Scaling for visual impact
                };
            }).sort((a, b) => b.risk_score - a.risk_score);

            // 6. Mock Remittance Flows for Line Chart (Growth Proxy)
            // In a real scenario, this would be a metric, but we'll interpolate based on GDP/Global growth
            const remittanceTrend = (fxData || []).slice(-24).map(d => ({
                date: String(d.as_of_date),
                value: (Number(d.value) / 600) * 120 // Heuristic: Remittances ~20% of reserves proxy for trend
            }));

            return {
                brentPrice: Number(brentData?.[0]?.value || 82.5),
                fxReserves: Number(fxData?.[fxData.length - 1]?.value || 680),
                remittanceFlows: remittanceTrend,
                resilienceMetrics,
                stateRisks
            };
        },
        staleTime: 1000 * 60 * 60 // 1 hour
    });
}
