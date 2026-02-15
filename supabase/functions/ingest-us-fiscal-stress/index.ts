import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<any[]> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=250`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`FRED API error for ${seriesId}: ${response.status} ${errorText}`);
            throw new Error(`FRED API error for ${seriesId}: ${response.status}`);
        }
        const data = await response.json();
        return data.observations || [];
    } catch (err: any) {
        console.error(`Fetch failed for ${seriesId}: ${err.message}`);
        throw err;
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

        // Fetch all required series
        const [interest, receipts, personal, payroll, gdp] = await Promise.all([
            fetchFredSeries('A091RC1Q027SBEA', fredApiKey), // Gross Interest Expense
            fetchFredSeries('FGRECPT', fredApiKey),         // Total Federal Receipts
            fetchFredSeries('A074RC1Q027SBEA', fredApiKey), // Personal current taxes
            fetchFredSeries('W780RC1Q027SBEA', fredApiKey), // Payroll taxes
            fetchFredSeries('GDP', fredApiKey)             // GDP
        ]);

        // Group by date
        const dateMap = new Map<string, any>();

        const processObservations = (obs: any[], key: string) => {
            obs.forEach((o: any) => {
                if (!dateMap.has(o.date)) {
                    dateMap.set(o.date, { date: o.date });
                }
                const val = parseFloat(o.value);
                if (!isNaN(val)) {
                    dateMap.get(o.date)[key] = val;
                }
            });
        };

        processObservations(interest, 'interest_expense');
        processObservations(receipts, 'total_receipts');
        processObservations(personal, 'personal_taxes');
        processObservations(payroll, 'payroll_taxes');
        processObservations(gdp, 'gdp');

        // Calculate ratios and prepare for upsert
        const upsertData = Array.from(dateMap.values())
            .map(d => {
                const insolvency_ratio = (d.interest_expense && d.total_receipts) ? (d.interest_expense / d.total_receipts) : null;
                const employment_tax_share = (d.personal_taxes && d.payroll_taxes && d.total_receipts) ? ((d.personal_taxes + d.payroll_taxes) / d.total_receipts) : null;
                const receipts_gdp = (d.total_receipts && d.gdp) ? (d.total_receipts / d.gdp) : null;

                return {
                    ...d,
                    insolvency_ratio,
                    employment_tax_share,
                    receipts_gdp,
                    updated_at: new Date().toISOString()
                };
            })
            .filter(d => d.insolvency_ratio !== null || d.employment_tax_share !== null || d.receipts_gdp !== null);

        if (upsertData.length > 0) {
            const { error } = await supabase
                .from('us_fiscal_stress')
                .upsert(upsertData, { onConflict: 'date' });

            if (error) throw error;
        }

        return new Response(JSON.stringify({
            success: true,
            count: upsertData.length,
            latest: upsertData[0]
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
})
