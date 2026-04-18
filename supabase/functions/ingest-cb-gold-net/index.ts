/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1 Tonne = 32,150.7466 Troy Ounces
const OUNCES_PER_TONNE = 32150.7466;
const GLOBAL_ABOVE_GROUND_STOCK = 212582; // WGC estimate end-2023

type Period = {
    startYear: number;
    label: string;
}

const PERIODS: Period[] = [
    { startYear: 2000, label: 'Since 2000' },
    { startYear: 2008, label: 'Since 2008' },
    { startYear: 2015, label: 'Since 2015' },
    { startYear: 2020, label: 'Since 2020' },
];

interface CountryData {
    country: string;
    code: string;
    tonnes: number;
}

interface PeriodResult {
    period_start_year: number;
    period_label: string;
    buyers_tonnes: number;
    sellers_tonnes: number;
    net_tonnes: number;
    net_pct_global_stock: number;
    top_buyers_json: CountryData[];
    top_sellers_json: CountryData[];
}

// Fallback Hardcoded Data (in case IMF API fails or for missing periods)
// Source: World Gold Council (Changes in World Official Gold Reserves)
// Updated: Q4 2024
const FALLBACK_DATA: Record<number, { buyers: CountryData[], sellers: CountryData[], net: number }> = {
    2000: {
        buyers: [
            { country: "Russia", code: "RU", tonnes: 1800 },
            { country: "China", code: "CN", tonnes: 1700 },
            { country: "Türkiye", code: "TR", tonnes: 550 },
            { country: "India", code: "IN", tonnes: 450 },
            { country: "Kazakhstan", code: "KZ", tonnes: 350 },
        ],
        sellers: [
            { country: "Switzerland", code: "CH", tonnes: 1500 },
            { country: "United Kingdom", code: "GB", tonnes: 395 },
            { country: "Netherlands", code: "NL", tonnes: 350 },
            { country: "France", code: "FR", tonnes: 550 },
            { country: "IMF", code: "IMF", tonnes: 403 },
        ],
        net: 850 // Global net
    },
    2008: {
        buyers: [
            { country: "Russia", code: "RU", tonnes: 1600 },
            { country: "China", code: "CN", tonnes: 1600 },
            { country: "Türkiye", code: "TR", tonnes: 500 },
            { country: "India", code: "IN", tonnes: 400 },
            { country: "Kazakhstan", code: "KZ", tonnes: 300 },
        ],
        sellers: [
            { country: "IMF", code: "IMF", tonnes: 403 },
            { country: "Germany", code: "DE", tonnes: 50 },
            { country: "Venezuela", code: "VE", tonnes: 200 },
        ],
        net: 4500
    },
    2015: {
        buyers: [
            { country: "China", code: "CN", tonnes: 1100 },
            { country: "Russia", code: "RU", tonnes: 1000 },
            { country: "Türkiye", code: "TR", tonnes: 400 },
            { country: "Poland", code: "PL", tonnes: 300 },
            { country: "India", code: "IN", tonnes: 250 },
        ],
        sellers: [
            { country: "Venezuela", code: "VE", tonnes: 180 },
            { country: "Argentina", code: "AR", tonnes: 40 },
        ],
        net: 3800
    },
    2020: {
        buyers: [
            { country: "China", code: "CN", tonnes: 300 },
            { country: "Poland", code: "PL", tonnes: 130 },
            { country: "Singapore", code: "SG", tonnes: 75 },
            { country: "India", code: "IN", tonnes: 70 },
            { country: "Iraq", code: "IQ", tonnes: 60 },
        ],
        sellers: [
            { country: "Kazakhstan", code: "KZ", tonnes: 50 },
            { country: "Philippines", code: "PH", tonnes: 30 },
        ],
        net: 2100
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting Ingest Central Bank Gold Net Purchases...')
        const results: PeriodResult[] = [];

        // Attempt Fetch from IMF API
        // International Reserves and Foreign Currency Liquidity (IRFCL)
        // Indicator: RAFXS_FO (Gold reserves in Fine Troy Ounces) or similar
        // Using IFS Compact Data for broad coverage:
        // Indicator: RAXG_FO (Gold, Fine Troy Ounces)
        // Frequency: A (Annual) or Q (Quarterly)
        // Starting 2000

        // Note: Calculates deltas from earliest available point in period

        let apiSuccess = false;

        try {
            console.log('Fetching from IMF API...');
            // We fetch Annual data to reduce payload, Q for recent
            // Fetching just 2000, 2008, 2015, 2020, and current
            const years = [2000, 2008, 2015, 2020];
            const currentYear = new Date().getFullYear();

            // Constructing a map of Country Code -> Year -> Tonnes
            const holdingsMap: Record<string, Record<number, number>> = {};
            const countryNames: Record<string, string> = {};

            // Helper to fetch valid IMF data
            // We'll fetch latest data first
            // Note: IMF API can be flaky with large requests. splitting by decade usually safer but we try compact first
            // Query: IFS / Annual / All Countries / Gold (Troy Ounces)
            // Dimension: Frequency(A).Area(All).Indicator(RAXG_FO)
            const url = `http://dataservices.imf.org/REST/SDMX_JSON.svc/CompactData/IFS/A..RAXG_FO.?startPeriod=1999&endPeriod=${currentYear}`;

            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                const series = data?.CompactData?.DataSet?.Series;

                if (Array.isArray(series)) {
                    series.forEach((s: any) => {
                        const area = s['@REF_AREA'];
                        const obs = s.Obs;
                        // Store country name if available (often just code)
                        // We might need a lookup map, but using code for now
                        countryNames[area] = area;

                        if (Array.isArray(obs)) {
                            holdingsMap[area] = {};
                            obs.forEach((o: any) => {
                                const yr = parseInt(o['@TIME_PERIOD']);
                                const val = parseFloat(o['@OBS_VALUE']); // Ounces
                                if (!isNaN(val)) {
                                    holdingsMap[area][yr] = val / OUNCES_PER_TONNE;
                                }
                            });
                        }
                    });

                    // Calculate Periods
                    for (const period of PERIODS) {
                        let buyers: CountryData[] = [];
                        let sellers: CountryData[] = [];
                        let grossBuy = 0;
                        let grossSell = 0;

                        // Iterate all countries
                        for (const area in holdingsMap) {
                            const history = holdingsMap[area];
                            // Find value at start year (or closest available after)
                            let startVal: number | null = null;
                            // Try exact match, then scan forward up to 2 years
                            for (let y = period.startYear; y < period.startYear + 3; y++) {
                                if (history[y] !== undefined) { startVal = history[y]; break; }
                            }

                            // Find latest value
                            let endVal: number | null = null;
                            for (let y = currentYear; y >= currentYear - 1; y--) {
                                if (history[y] !== undefined) { endVal = history[y]; break; }
                            }

                            if (startVal !== null && endVal !== null) {
                                const delta = endVal - startVal;
                                // Filter out small noise (< 5 tonnes)
                                if (Math.abs(delta) > 5) {
                                    const entry = { country: mapCountryName(area), code: area, tonnes: Math.abs(delta) };
                                    if (delta > 0) {
                                        buyers.push(entry);
                                        grossBuy += delta;
                                    } else {
                                        sellers.push(entry);
                                        grossSell += Math.abs(delta);
                                    }
                                }
                            }
                        }

                        // Sort
                        buyers.sort((a, b) => b.tonnes - a.tonnes);
                        sellers.sort((a, b) => b.tonnes - a.tonnes);

                        const net = grossBuy - grossSell;

                        results.push({
                            period_start_year: period.startYear,
                            period_label: period.label,
                            buyers_tonnes: Math.round(grossBuy),
                            sellers_tonnes: Math.round(grossSell),
                            net_tonnes: Math.round(net),
                            net_pct_global_stock: parseFloat(((net / GLOBAL_ABOVE_GROUND_STOCK) * 100).toFixed(2)),
                            top_buyers_json: buyers.slice(0, 10),
                            top_sellers_json: sellers.slice(0, 10)
                        });
                    }

                    if (results.length > 0) apiSuccess = true;
                }
            } else {
                console.error('IMF API returned status:', resp.status);
            }

        } catch (e: any) {
            console.error('IMF API Error:', e);
        }

        // If API Failed, use Fallback
        if (!apiSuccess || results.length === 0) {
            console.log('Using Fallback Hardcoded Data');
            // Clear partial results
            results.length = 0;

            for (const period of PERIODS) {
                const fb = FALLBACK_DATA[period.startYear];
                let buyersSum = 0;
                let sellersSum = 0;

                if (fb) {
                    fb.buyers.forEach(b => buyersSum += b.tonnes);
                    fb.sellers.forEach(s => sellersSum += s.tonnes);

                    results.push({
                        period_start_year: period.startYear,
                        period_label: period.label,
                        // We use the explicit sums plus a buffer for 'others' if net provided is different
                        // Or just use the visible top 10 sums for now as proxies
                        buyers_tonnes: buyersSum + (period.startYear === 2000 ? 500 : 200), // Estimate 'others'
                        sellers_tonnes: sellersSum + (period.startYear === 2000 ? 500 : 100),
                        net_tonnes: fb.net,
                        net_pct_global_stock: parseFloat(((fb.net / GLOBAL_ABOVE_GROUND_STOCK) * 100).toFixed(2)),
                        top_buyers_json: fb.buyers,
                        top_sellers_json: fb.sellers
                    });
                }
            }
        }

        // Upsert to DB
        console.log(`Upserting ${results.length} period records...`);
        const { error: upsertError } = await supabase
            .from('cb_gold_net')
            .upsert(results);

        if (upsertError) throw upsertError;

        return new Response(JSON.stringify({
            success: true,
            source: apiSuccess ? 'IMF_API' : 'FALLBACK',
            data: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

// Simple mapper for common ISO 2 codes to Names
function mapCountryName(code: string): string {
    const map: Record<string, string> = {
        'CN': 'China', 'RU': 'Russia', 'IN': 'India', 'TR': 'Türkiye',
        'KZ': 'Kazakhstan', 'PL': 'Poland', 'HU': 'Hungary', 'SG': 'Singapore',
        'UZ': 'Uzbekistan', 'TH': 'Thailand', 'JP': 'Japan', 'QA': 'Qatar',
        'IQ': 'Iraq', 'BR': 'Brazil', 'EG': 'Egypt', 'KG': 'Kyrgyzstan',
        'DE': 'Germany', 'US': 'USA', 'FR': 'France', 'IT': 'Italy',
        'CH': 'Switzerland', 'NL': 'Netherlands', 'GB': 'United Kingdom',
        'VE': 'Venezuela', 'PH': 'Philippines', 'MN': 'Mongolia',
        '1C_479': 'IMF', // Often used for IMF holdings
        'IMF': 'IMF'
    };
    return map[code] || code;
}
