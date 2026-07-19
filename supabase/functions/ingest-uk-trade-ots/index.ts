/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest } from '../_shared/handler.ts';



serveIngest('ingest-uk-trade-ots', async (req: Request) => {

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const urlParams = new URL(req.url).searchParams;
        const hsCode = urlParams.get('hsCode') || '270900'; // Default to crude oil if not specified

        console.log(`Starting UK Trade Info OTS Ingestion for HS ${hsCode}...`);

        // Calculate a recent month to filter by, e.g. 6 months ago to limit data size
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        const monthIdFilter = parseInt(`${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`);

        // Fetch Overseas Trade Statistics (OTS) for the specified HS code
        const url = `https://api.uktradeinfo.com/OTS?$filter=MonthId ge ${monthIdFilter}&$expand=Commodity($filter=Hs6Code eq '${hsCode}'),Country,Port`;

        console.log(`Fetching OTS from UK Trade Info: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`UK Trade Info API error (${response.status}): ${errorText}`);
        }

        const data = (await response.json()) as any;
        const records = data.value || [];
        
        // We need to filter records where Commodity is not null, since the $filter inside $expand might just leave Commodity null for non-matching ones.
        const validRecords = records.filter((r: any) => r.Commodity != null);

        console.log(`Parsed ${validRecords.length} OTS records for HS ${hsCode}`);

        const flowData = validRecords.map((r: any) => ({
            hs_code: hsCode,
            month_id: r.MonthId,
            flow_type: r.FlowTypeId === 1 || r.FlowTypeId === 3 ? 'Import' : 'Export',
            partner_country_iso: r.Country ? r.Country.Alpha2Code : null,
            region_id: r.Country ? r.Country.RegionId : null,
            port_id: r.Port ? r.Port.PortName : null,
            value_gbp: r.Value,
            net_mass_kg: r.NetMass
        }));

        if (flowData.length > 0) {
            const { error } = await supabase
                .from('uk_ots_flows')
                .upsert(flowData, {
                    onConflict: 'hs_code,month_id,flow_type,partner_country_iso,region_id,port_id'
                });

            if (error) {
                console.error("Upsert Error:", error);
                throw error;
            }
            console.log(`Successfully upserted ${flowData.length} records.`);
        }

        return { ok: true, counts: { upserted: upserted } };

    } catch (err: any) {
        console.error("Ingest Error:", err);
        throw err;

    }
});
