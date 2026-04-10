/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportData {
    country: string;
    year: number;
    metal: string;
    value_usd: number;
    volume: number;
    volume_unit: string;
    top_partners_json: any[];
}

// Comtrade API configuration
const COMTRADE_API_BASE = "https://comtradeapi.un.org/data/v1/get";

// HS Codes mapping (6-digit format for Comtrade)
const HS_CODES: Record<string, string[]> = {
    'Gold': ['710811', '710812', '710813', '710819'], // Gold, unwrought, semi-manufactured, etc.
    'Silver': ['710611', '710612', '710691', '710699'], // Silver, unwrought, semi-manufactured, etc.
    'Rare Earth Metals': [
        '280530', // Rare-earth metals, scandium and yttrium, intermixtures
        '2846'    // Compounds of rare-earth metals, etc.
    ]
};

// M49 country codes for Comtrade
const COUNTRY_CODES: Record<string, string> = {
    'India': '699',
    'China': '156'
};

async function fetchComtradeData(reporterCode: string, hsCode: string, year: number, apiKey: string): Promise<any[]> {
    const url = new URL(COMTRADE_API_BASE);
    url.searchParams.append('reporterCode', reporterCode);
    url.searchParams.append('partnerCode', ''); // All partners
    url.searchParams.append('period', year.toString());
    url.searchParams.append('cmdCode', hsCode);
    url.searchParams.append('subscription-key', apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`Comtrade API ${res.status}: ${await res.text()}`);
    }
    const json = await res.json() as { data: any[] };
    return json.data || [];
}

function processComtradeItems(items: any[], country: string, metal: string, year: number): ImportData[] {
    // Aggregate by partner to get top partners and totals
    const partnerMap = new Map<string, { volume_kg: number, value_usd: number }>();

    for (const item of items) {
        const partner = item.partnerDesc || 'Unknown';
        const quantity = parseFloat(item.qty) || 0; // Usually in KG
        const value = parseFloat(item.cifValue) || parseFloat(item.fobValue) || 0;

        const existing = partnerMap.get(partner) || { volume_kg: 0, value_usd: 0 };
        partnerMap.set(partner, {
            volume_kg: existing.volume_kg + quantity,
            value_usd: existing.value_usd + value
        });
    }

    // Compute total volume (tonnes) and value
    let totalVolumeKg = 0;
    let totalValueUsd = 0;
    const topPartners: any[] = [];

    for (const [partner, stats] of partnerMap.entries()) {
        totalVolumeKg += stats.volume_kg;
        totalValueUsd += stats.value_usd;
        topPartners.push({
            partner,
            share: 0, // will compute after total known
            value: stats.value_usd
        });
    }

    // Compute shares
    topPartners.forEach(p => {
        p.share = totalValueUsd > 0 ? (p.value / totalValueUsd) * 100 : 0;
    });

    // Sort by value descending and take top 5
    topPartners.sort((a, b) => b.value - a.value);
    const topPartnersJson = topPartners.slice(0, 5);

    return [{
        country,
        year,
        metal,
        value_usd: totalValueUsd,
        volume: totalVolumeKg / 1000, // Convert KG to tonnes (default unit)
        volume_unit: 'tonnes',
        top_partners_json: topPartnersJson
    }];
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const comtradeApiKey = Deno.env.get('COMTRADE_API_KEY');

        if (!comtradeApiKey) {
            throw new Error('Missing COMTRADE_API_KEY environment variable');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Starting Commodity Import Ingestion from UN Comtrade...");

        const countries = ['India', 'China'];
        const metals = ['Gold', 'Silver', 'Rare Earth Metals'];
        const currentYear = new Date().getFullYear();
        const startYear = 2000;

        let totalInserted = 0;

        for (const country of countries) {
            const reporterCode = COUNTRY_CODES[country];
            if (!reporterCode) {
                console.warn(`No Comtrade reporter code for ${country}, skipping`);
                continue;
            }

            for (const metal of metals) {
                console.log(`Processing ${metal} for ${country}...`);
                const hsCodes = HS_CODES[metal];
                if (!hsCodes) {
                    console.warn(`No HS codes for metal ${metal}, skipping`);
                    continue;
                }

                // For each year from startYear to currentYear-1 (backfill), plus latest year if available
                const years = [];
                for (let y = startYear; y < currentYear; y++) {
                    years.push(y);
                }
                // Also add current year (partial data may exist)
                years.push(currentYear);

                const allRecords: ImportData[] = [];

                for (const year of years) {
                    try {
                        // Fetch data for each HS code and aggregate across them
                        let allItems: any[] = [];
                        for (const hsCode of hsCodes) {
                            const items = await fetchComtradeData(reporterCode, hsCode, year, comtradeApiKey);
                            allItems = allItems.concat(items);
                        }

                        if (allItems.length > 0) {
                            const yearRecords = processComtradeItems(allItems, country, metal, year);
                            allRecords.push(...yearRecords);
                        } else {
                            console.log(`No Comtrade data for ${country} ${metal} ${year}`);
                        }

                        // Rate limiting: small delay between years to avoid overwhelming API
                        await new Promise(r => setTimeout(r, 200));
                    } catch (e: any) {
                        console.error(`Failed to fetch ${country} ${metal} ${year}:`, e.message);
                        // Continue with other years; don't fail entire ingestion for one year
                    }
                }

                if (allRecords.length > 0) {
                    const { error } = await supabase
                        .from('commodity_imports')
                        .upsert(allRecords, { onConflict: 'country, year, metal' });

                    if (error) {
                        console.error(`Error upserting ${metal} for ${country}:`, error);
                    } else {
                        totalInserted += allRecords.length;
                        console.log(`Inserted ${allRecords.length} records for ${country} ${metal}`);
                    }
                } else {
                    console.warn(`No records to insert for ${country} ${metal}`);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${totalInserted} records.`,
            meta: { countries, metals, timeframe: `${startYear}-${currentYear}` }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
