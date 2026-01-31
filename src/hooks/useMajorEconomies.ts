import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MajorEconomyMetric {
    metric_id: string;
    metric_name: string;
    unit: string;
    as_of_date: string;
    value: number;
    staleness_flag: string;
}

export interface MajorEconomyReserves {
    country_code: string;
    country_name: string;
    fx_reserves_usd: number;
    gold_tonnes: number;
    as_of_date: string;
}

export interface MajorEconomyRow {
    code: string;
    name: string;
    flag: string;
    gdp_nominal: number;
    gdp_ppp: number;
    growth: number;
    cpi: number;
    policy_rate: number;
    fx_reserves: number;
    gold_reserves: number;
    debt_gold_ratio: number;
    dependency_ratio: number;
    last_updated: string;
    staleness: string;
}

const COUNTRY_CONFIG: Record<string, { name: string; flag: string }> = {
    US: { name: 'United States', flag: '🇺🇸' },
    CN: { name: 'China', flag: '🇨🇳' },
    IN: { name: 'India', flag: '🇮🇳' },
    JP: { name: 'Japan', flag: '🇯🇵' },
    EU: { name: 'Eurozone', flag: '🇪🇺' },
    RU: { name: 'Russia', flag: '🇷🇺' }
};

export function useMajorEconomies() {
    return useQuery({
        queryKey: ['major_economies'],
        queryFn: async () => {
            const codes = Object.keys(COUNTRY_CONFIG);

            // 1. Fetch macro metrics from vw_latest_metrics
            const { data: metrics, error: metricsError } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, value, last_updated_at, staleness_flag')
                .or(codes.map(c => `metric_id.ilike.${c}_%`).join(','));

            if (metricsError) throw metricsError;

            // 2. Fetch reserves from country_reserves
            const { data: reserves, error: reservesError } = await supabase
                .from('country_reserves')
                .select('country_code, fx_reserves_usd, gold_tonnes, as_of_date')
                .in('country_code', codes)
                .order('as_of_date', { ascending: false });

            if (reservesError) throw reservesError;

            // 3. Fetch gold price for ratio calculation
            const { data: goldPrice } = await supabase
                .from('vw_latest_metrics')
                .select('value')
                .eq('metric_id', 'GOLD_PRICE_USD')
                .single();

            const gp = goldPrice?.value || 0;

            // Manual distinct on (country_code) since reserves might have history
            const latestReserves = codes.reduce((acc: any, code) => {
                const latest = reserves?.find(r => r.country_code === code);
                if (latest) acc[code] = latest;
                return acc;
            }, {});

            // 3. Assemble rows
            const rows: MajorEconomyRow[] = codes.map(code => {
                const countryMetrics = metrics?.filter(m => m.metric_id.startsWith(code));
                const res = latestReserves[code];

                const findVal = (suffix: string) => countryMetrics?.find(m => m.metric_id.endsWith(suffix));

                const gdpNom = findVal('GDP_NOMINAL_TN');
                const gdpPpp = findVal('GDP_PPP_TN');
                const growth = findVal('GDP_GROWTH_YOY');
                const cpi = findVal('CPI_YOY');
                const policy = findVal('POLICY_RATE');
                const debt = findVal('DEBT_USD_TN') || (code === 'US' ? findVal('UST_DEBT_TOTAL') : null);
                const dependency = findVal('DEPENDENCY_RATIO');

                // Debt/Gold Ratio Calculation: Debt / (Gold Tonnes * 32150.75 * Gold Price)
                let debtGoldRatio = 0;
                if (gp > 0 && res?.gold_tonnes > 0) {
                    const debtValue = Number(debt?.value || 0);
                    // If US, debt (UST_DEBT_TOTAL) is in absolute USD. If others, in Trillions USD.
                    const debtInUSD = (code === 'US' && !debt?.metric_id.includes('TN')) ? debtValue : debtValue * 1e12;
                    const goldValueUSD = res.gold_tonnes * 32150.75 * gp;
                    if (goldValueUSD > 0) {
                        debtGoldRatio = debtInUSD / goldValueUSD;
                    }
                }

                return {
                    code,
                    name: COUNTRY_CONFIG[code].name,
                    flag: COUNTRY_CONFIG[code].flag,
                    gdp_nominal: Number(gdpNom?.value || 0),
                    gdp_ppp: Number(gdpPpp?.value || 0),
                    growth: Number(growth?.value || 0),
                    cpi: Number(cpi?.value || 0),
                    policy_rate: Number(policy?.value || 0),
                    fx_reserves: Number(res?.fx_reserves_usd || 0) / 1e9, // USD bn
                    gold_reserves: Number(res?.gold_tonnes || 0),
                    debt_gold_ratio: debtGoldRatio,
                    dependency_ratio: Number(dependency?.value || 0),
                    last_updated: gdpNom?.last_updated_at || res?.as_of_date || '',
                    staleness: gdpNom?.staleness_flag || 'no_data'
                };
            });

            return rows;
        },
        staleTime: 1000 * 60 * 30, // 30 min
    });
}
