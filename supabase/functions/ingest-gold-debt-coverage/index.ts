import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const G20_COUNTRIES = [
    { code: 'US', fx: 'USD' },
    { code: 'GB', fx: 'DEXUSUK', invert: true },
    { code: 'FR', fx: 'DEXUSEU', invert: true },
    { code: 'DE', fx: 'DEXUSEU', invert: true },
    { code: 'IT', fx: 'DEXUSEU', invert: true },
    { code: 'EU', fx: 'DEXUSEU', invert: true },
    { code: 'CA', fx: 'DEXCAUS' },
    { code: 'JP', fx: 'DEXJPUS' },
    { code: 'CN', fx: 'DEXCHUS' },
    { code: 'IN', fx: 'DEXINUS' },
    { code: 'BR', fx: 'DEXBZUS' },
    { code: 'ZA', fx: 'DEXSFUS' },
    { code: 'AU', fx: 'DEXUSAL', invert: true },
    { code: 'KR', fx: 'DEXKOUS' },
    { code: 'MX', fx: 'DEXMXUS' },
    { code: 'RU', fx: 'USD' }, // Fallback
    { code: 'ID', fx: 'USD' }, // Fallback
    { code: 'TR', fx: 'USD' }, // Fallback
    { code: 'SA', fx: 'USD' }, // Fallback
    { code: 'AR', fx: 'USD' }  // Fallback
];

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-gold-debt-coverage', async (ctx) => {
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

        // Fetch latest gold price
        const { data: goldData } = await supabase
            .from('vw_latest_metrics')
            .select('value')
            .eq('metric_id', 'GOLD_PRICE_USD')
            .single();
        const goldPriceUsd = goldData?.value || 2650;

        // Fetch gold reserves
        const { data: reserves } = await supabase
            .from('country_reserves')
            .select('country_code, gold_tonnes');

        // Provide defaults if not found
        const safeReserves = reserves || [];

        // Fetch metrics 
        const { data: metrics } = await supabase
            .from('vw_latest_metrics')
            .select('metric_id, value');

        const metricMap = new Map((metrics || []).map(m => [m.metric_id, m.value]));

        const results = [];
        const date = new Date().toISOString().split('T')[0];

        for (const country of G20_COUNTRIES) {
            const code = country.code === 'GB' ? 'UK' : country.code;

            // Debt % and Nominal GDP
            const debtPct = Number(metricMap.get(`${code}_DEBT_GDP_PCT`) || 0);
            const rawNomGdp = metricMap.get(`${code}_GDP_NOMINAL_TN`) ?? metricMap.get(`${code}_GDP_NOMINAL_USD`) ?? 0;
            const nomGdpTn = Number(rawNomGdp);

            let nominalGdpUsd = nomGdpTn;
            if (nomGdpTn > 0 && nomGdpTn < 1000) {
                // Treat as trillions
                nominalGdpUsd = nomGdpTn * 1e12;
            } else if (nomGdpTn > 0 && nomGdpTn < 1e6) {
                // Treat as billions
                nominalGdpUsd = nomGdpTn * 1e9;
            } else {
                // Treat as raw actual USD
                nominalGdpUsd = nomGdpTn;
            }

            // Find gold reserves
            const reserve = safeReserves.find((r: any) => r.country_code === country.code);
            const tonnes = reserve?.gold_tonnes || 0;
            const ounces = tonnes * 32150.7;

            // Fetch FX rate
            let fxRate = 1;
            if (country.fx !== 'USD') {
                try {
                    const fxRes = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${country.fx}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`);
                    const fxData = await fxRes.json() as any;
                    if (fxData.observations && fxData.observations.length > 0) {
                        const val = parseFloat(fxData.observations[0].value);
                        if (!isNaN(val)) {
                            fxRate = country.invert ? 1 / val : val;
                        }
                    }
                } catch (e) {
                    console.log(`FX fetch failed for ${country.fx}`);
                }
            }

            if (debtPct > 0 && nominalGdpUsd > 0 && ounces > 0) {
                const totalDebtUsd = (debtPct / 100) * nominalGdpUsd;
                const totalDebtLocal = totalDebtUsd * fxRate;
                const goldPriceLocal = goldPriceUsd * fxRate;
                const goldValueUsd = ounces * goldPriceUsd;

                const debtPerOzLocal = totalDebtLocal / ounces;
                const coverageRatio = (goldValueUsd / totalDebtUsd) * 100; // as percent
                const inverseCoverageRatio = totalDebtUsd / goldValueUsd;
                const impliedGoldPriceUsd = totalDebtUsd / ounces;

                results.push({
                    country_code: country.code,
                    date: date,
                    gold_price_usd: goldPriceUsd,
                    fx_rate_local_per_usd: fxRate,
                    gold_price_local: goldPriceLocal,
                    debt_local: totalDebtLocal,
                    gold_reserves_oz: ounces,
                    debt_per_oz_local: debtPerOzLocal,
                    coverage_ratio: coverageRatio,
                    inverse_coverage_ratio: inverseCoverageRatio,
                    implied_gold_price_usd: impliedGoldPriceUsd
                });
            }
        }

        if (results.length > 0) {
            const { error } = await supabase
                .from('gold_debt_coverage_g20')
                .upsert(results, { onConflict: 'country_code, date' });

            if (error) throw error;
        }

        return { success: true, processed: results.length };
    });
});
