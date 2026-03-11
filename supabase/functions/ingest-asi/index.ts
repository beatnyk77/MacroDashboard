import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { runIngestion } from '../_shared/logging.ts'
import { IndiaTelemetry } from '../_shared/india-telemetry.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INDIAN_STATES = [
    { c: '01', n: 'Jammu & Kashmir' }, { c: '02', n: 'Himachal Pradesh' }, 
    { c: '03', n: 'Punjab' }, { c: '04', n: 'Chandigarh' },
    { c: '05', n: 'Uttarakhand' }, { c: '06', n: 'Haryana' },
    { c: '07', n: 'Delhi' }, { c: '08', n: 'Rajasthan' },
    { c: '09', n: 'Uttar Pradesh' }, { c: '10', n: 'Bihar' },
    { c: '11', n: 'Sikkim' }, { c: '12', n: 'Arunachal Pradesh' },
    { c: '13', n: 'Nagaland' }, { c: '14', n: 'Manipur' },
    { c: '15', n: 'Mizoram' }, { c: '16', n: 'Tripura' },
    { c: '17', n: 'Meghalaya' }, { c: '18', n: 'Assam' },
    { c: '19', n: 'West Bengal' }, { c: '20', n: 'Jharkhand' },
    { c: '21', n: 'Odisha' }, { c: '22', n: 'Chhattisgarh' },
    { c: '23', n: 'Madhya Pradesh' }, { c: '24', n: 'Gujarat' },
    { c: '25', n: 'Daman & Diu' }, { c: '26', n: 'Dadra & Nagar Haveli' },
    { c: '27', n: 'Maharashtra' }, { c: '28', n: 'Andhra Pradesh' },
    { c: '29', n: 'Karnataka' }, { c: '30', n: 'Goa' },
    { c: '31', n: 'Lakshadweep' }, { c: '32', n: 'Kerala' },
    { c: '33', n: 'Tamil Nadu' }, { c: '34', n: 'Puducherry' },
    { c: '35', n: 'A&N Islands' }, { c: '36', n: 'Telangana' }
];

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-asi', async (ctx) => {
        const telemetry = new IndiaTelemetry();
        const year = '2023';
        const results: any[] = [];

        console.log(`Fetching live ASI data for ${year}...`);

        for (const st of INDIAN_STATES) {
            try {
                const liveData = await telemetry.getASIStatistics(year, st.c);
                if (liveData.length > 0) {
                    const mapped = liveData.map(d => ({
                        state_code: st.c,
                        state_name: st.n,
                        year: parseInt(year),
                        sector: 'all_industries',
                        gva_crores: d.value,
                        as_of_date: d.as_of_date,
                        provenance: 'api_live'
                    }));

                    const { error: upsertError } = await supabase
                        .from('india_asi')
                        .upsert(mapped, { onConflict: 'state_code, year, sector' });

                    if (upsertError) throw upsertError;
                    results.push({ state: st.n, status: 'success' });
                }
            } catch (e) {
                console.error(`Failed to fetch ASI for ${st.n}:`, e.message);
            }
        }

        // Aggregate All-India
        const { data: aggs } = await supabase
            .from('india_asi')
            .select('gva_crores')
            .eq('sector', 'all_industries')
            .eq('year', parseInt(year));

        if (aggs && aggs.length > 0) {
            const totGva = aggs.reduce((acc, r) => acc + (r.gva_crores || 0), 0);
            await supabase.from('metric_observations').upsert({
                metric_id: 'IN_ASI_GVA_TOTAL',
                as_of_date: `${year}-12-31`,
                value: totGva,
                provenance: 'api_live',
                last_updated_at: new Date().toISOString()
            }, { onConflict: 'metric_id, as_of_date' });
        }

        return {
            rows_inserted: results.length,
            metadata: { year, states_processed: results.length }
        };
    });
})
