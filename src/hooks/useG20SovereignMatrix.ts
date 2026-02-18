import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type G20Region = 'G7' | 'BRICS' | 'Other';

export interface G20MatrixPoint {
    code: string;
    name: string;
    flag: string;
    region: G20Region;
    debtGdpPct: number;       // X-axis: Debt/GDP %
    gdpGrowthPct: number;     // Y-axis: Real GDP growth %
    goldTonnes: number;       // Bubble differentiation
    nominalGdpUsd: number;    // Bubble size (USD)
    debtGoldRatio: number;    // Derived: (DebtGDP% * NominalGDP) / (GoldTonnes * GoldPricePerTonne)
    zDebt: number;            // Z-score of debt/GDP
    zGrowth: number;          // Z-score of growth
    dataAvailable: boolean;   // Whether all core metrics have real data
    isStale: boolean;         // Whether data is > 30 days overdue
}

const G20_MEMBERS: Record<string, { name: string; flag: string; region: G20Region }> = {
    US: { name: 'United States', flag: '🇺🇸', region: 'G7' },
    GB: { name: 'United Kingdom', flag: '🇬🇧', region: 'G7' },
    FR: { name: 'France', flag: '🇫🇷', region: 'G7' },
    DE: { name: 'Germany', flag: '🇩🇪', region: 'G7' },
    IT: { name: 'Italy', flag: '🇮🇹', region: 'G7' },
    CA: { name: 'Canada', flag: '🇨🇦', region: 'G7' },
    JP: { name: 'Japan', flag: '🇯🇵', region: 'G7' },
    CN: { name: 'China', flag: '🇨🇳', region: 'BRICS' },
    IN: { name: 'India', flag: '🇮🇳', region: 'BRICS' },
    RU: { name: 'Russia', flag: '🇷🇺', region: 'BRICS' },
    BR: { name: 'Brazil', flag: '🇧🇷', region: 'BRICS' },
    ZA: { name: 'South Africa', flag: '🇿🇦', region: 'BRICS' },
    AU: { name: 'Australia', flag: '🇦🇺', region: 'Other' },
    KR: { name: 'South Korea', flag: '🇰🇷', region: 'Other' },
    MX: { name: 'Mexico', flag: '🇲🇽', region: 'Other' },
    ID: { name: 'Indonesia', flag: '🇮🇩', region: 'Other' },
    TR: { name: 'Turkey', flag: '🇹🇷', region: 'Other' },
    SA: { name: 'Saudi Arabia', flag: '🇸🇦', region: 'Other' },
    AR: { name: 'Argentina', flag: '🇦🇷', region: 'Other' },
    EU: { name: 'Eurozone', flag: '🇪🇺', region: 'G7' },
};

function zScore(value: number, mean: number, std: number): number {
    if (std === 0) return 0;
    return (value - mean) / std;
}

export function useG20SovereignMatrix() {
    return useQuery({
        queryKey: ['g20_sovereign_matrix'],
        queryFn: async (): Promise<G20MatrixPoint[]> => {
            const codes = Object.keys(G20_MEMBERS);

            // Build metric ID patterns for all sovereign metrics
            // We need: XX_DEBT_GDP_PCT, XX_GDP_GROWTH_YOY, XX_GDP_NOMINAL_USD or XX_GDP_NOMINAL_TN
            const metricFilters = codes.flatMap(c => [
                `${c === 'GB' ? 'UK' : c}_DEBT_GDP_PCT`,
                `${c === 'GB' ? 'UK' : c}_GDP_GROWTH_YOY`,
            ]);

            // Fetch sovereign metric observations (latest per metric)
            const { data: metricData, error: metricsError } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, value, last_updated_at')
                .or(metricFilters.map(id => `metric_id.eq.${id}`).join(','));

            if (metricsError) throw metricsError;

            // Fetch nominal GDP separately (ILIKE for flexible suffix matching)
            const nominalGdpPromises = codes.map(async (c) => {
                const cc = c === 'GB' ? 'UK' : c;
                const { data } = await supabase
                    .from('vw_latest_metrics')
                    .select('metric_id, value')
                    .ilike('metric_id', `${cc}_GDP_NOMINAL%`)
                    .limit(1)
                    .maybeSingle();
                return { code: c, value: data?.value || 0 };
            });
            const nominalGdpResults = await Promise.all(nominalGdpPromises);

            // Fetch reserves
            const { data: reserves, error: reservesError } = await supabase
                .from('country_reserves')
                .select('country_code, gold_tonnes, gold_usd')
                .in('country_code', codes)
                .order('as_of_date', { ascending: false });

            if (reservesError) throw reservesError;

            // Fetch gold price
            const { data: goldPriceData } = await supabase
                .from('vw_latest_metrics')
                .select('value')
                .eq('metric_id', 'GOLD_PRICE_USD')
                .maybeSingle();

            const goldPriceUsd = goldPriceData?.value || 2650;
            const goldPricePerTonne = goldPriceUsd * 32150.7;

            // De-dup reserves (latest per country)
            const latestReserves: Record<string, { gold_tonnes: number; gold_usd: number }> = {};
            codes.forEach(c => {
                const r = reserves?.find(r => r.country_code === c);
                if (r) latestReserves[c] = { gold_tonnes: r.gold_tonnes, gold_usd: r.gold_usd };
            });

            // Assemble raw points
            const rawPoints: G20MatrixPoint[] = codes.map(code => {
                const cc = code === 'GB' ? 'UK' : code;
                const member = G20_MEMBERS[code];
                const findMetric = (suffix: string) => metricData?.find(m => m.metric_id === `${cc}_${suffix}`);

                const debtMetric = findMetric('DEBT_GDP_PCT');
                const growthMetric = findMetric('GDP_GROWTH_YOY');
                const nomEntry = nominalGdpResults.find(n => n.code === code);
                const res = latestReserves[code];

                let debtGdpPct = Number(debtMetric?.value || 0);
                const gdpGrowthPct = Number(growthMetric?.value || 0);
                const nominalGdpUsd = Number(nomEntry?.value || 0);
                const goldTonnes = Number(res?.gold_tonnes || 0);

                // FALLBACKS for Top Stale Metrics
                if (code === 'EU' && debtGdpPct === 0) debtGdpPct = 89.9;
                if (code === 'BR' && debtGdpPct === 0) debtGdpPct = 74.4;
                if (code === 'TR' && debtGdpPct === 0) debtGdpPct = 34.4;

                // Calculate Debt/Gold ratio: (Debt% * NominalGDP$) / (GoldTonnes * PricePerTonne)
                let debtGoldRatio = 0;
                if (goldTonnes > 0 && nominalGdpUsd > 0 && debtGdpPct > 0) {
                    const totalDebtUsd = (debtGdpPct / 100) * nominalGdpUsd;
                    const goldValueUsd = goldTonnes * goldPricePerTonne;
                    debtGoldRatio = totalDebtUsd / goldValueUsd;
                }

                const dataAvailable = debtGdpPct > 0 && gdpGrowthPct !== 0;

                // Check staleness (threshold 30 days beyond expected 365 for debt, 90 for growth)
                const now = new Date();
                const debtDate = debtMetric?.last_updated_at ? new Date(debtMetric.last_updated_at) : null;
                const isStale = debtDate ? (now.getTime() - debtDate.getTime()) / (1000 * 3600 * 24) > 400 : true;

                return {
                    code,
                    name: member.name,
                    flag: member.flag,
                    region: member.region,
                    debtGdpPct,
                    gdpGrowthPct,
                    goldTonnes,
                    nominalGdpUsd,
                    debtGoldRatio,
                    zDebt: 0,
                    zGrowth: 0,
                    dataAvailable,
                    isStale
                };
            });

            // Calculate Z-scores across available data points
            const available = rawPoints.filter(p => p.dataAvailable);
            if (available.length > 0) {
                const debtValues = available.map(p => p.debtGdpPct);
                const growthValues = available.map(p => p.gdpGrowthPct);

                const meanDebt = debtValues.reduce((s, v) => s + v, 0) / debtValues.length;
                const meanGrowth = growthValues.reduce((s, v) => s + v, 0) / growthValues.length;

                const stdDebt = Math.sqrt(debtValues.reduce((s, v) => s + (v - meanDebt) ** 2, 0) / debtValues.length);
                const stdGrowth = Math.sqrt(growthValues.reduce((s, v) => s + (v - meanGrowth) ** 2, 0) / growthValues.length);

                rawPoints.forEach(p => {
                    if (p.dataAvailable) {
                        p.zDebt = zScore(p.debtGdpPct, meanDebt, stdDebt);
                        p.zGrowth = zScore(p.gdpGrowthPct, meanGrowth, stdGrowth);
                    }
                });
            }

            return rawPoints;
        },
        staleTime: 1000 * 60 * 30,
    });
}
