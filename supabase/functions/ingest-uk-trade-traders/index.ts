/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest } from '../_shared/handler.ts';



serveIngest('ingest-uk-trade-traders', async (req: Request) => {

    if (req.method === 'OPTIONS') {
        return { ok: true, counts: {} };
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const urlParams = new URL(req.url).searchParams;
        const hsCode = urlParams.get('hsCode');

        if (!hsCode) {
            throw new Error("hsCode parameter is required");
        }

        console.log(`Starting UK Trade Info Trader Ingestion for HS ${hsCode}...`);

        // Fetch Exports
        // Note: The API pagination is 40,000, we limit $top to avoid massive responses on wide HS codes
        // Expanding Trader to get company names and postcodes.
        const exportUrl = `https://api.uktradeinfo.com/Commodity?$filter=Hs6Code eq '${hsCode}'&$expand=Exports($top=2000;$orderby=MonthId desc;$expand=Trader)`;
        const importUrl = `https://api.uktradeinfo.com/Commodity?$filter=Hs6Code eq '${hsCode}'&$expand=Imports($top=2000;$orderby=MonthId desc;$expand=Trader)`;

        const fetchAndParse = async (url: string, flowType: string) => {
            console.log(`Fetching ${flowType} from UK Trade Info: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`UK Trade Info API error (${response.status}): ${errorText}`);
            }

            const data = (await response.json()) as any;
            const records = data.value || [];
            
            const results: any[] = [];

            for (const commodity of records) {
                const flows = flowType === 'Export' ? commodity.Exports : commodity.Imports;
                if (!flows) continue;

                for (const flow of flows) {
                    if (flow.Trader) {
                        results.push({
                            hs_code: hsCode,
                            flow_type: flowType,
                            trader_id: flow.Trader.TraderId,
                            company_name: flow.Trader.CompanyName || 'Unknown',
                            postcode: flow.Trader.PostCode || '',
                            month_id: flow.MonthId,
                            value_gbp: flow.Value || null, // Value might not be present at Trader level depending on suppression, but we map it if available
                        });
                    }
                }
            }
            return results;
        };

        const exportData = await fetchAndParse(exportUrl, 'Export');
        const importData = await fetchAndParse(importUrl, 'Import');

        const allData = [...exportData, ...importData];

        console.log(`Parsed ${allData.length} trader records for HS ${hsCode}`);

        if (allData.length > 0) {
            const { error } = await supabase
                .from('uk_trader_intelligence')
                .upsert(allData, {
                    onConflict: 'hs_code,flow_type,trader_id,month_id'
                });

            if (error) {
                console.error("Upsert Error:", error);
                throw error;
            }
            console.log(`Successfully upserted ${allData.length} records.`);
        }

        return { ok: true, counts: {} };

    } catch (err: any) {
        console.error("Ingest Error:", err);
        throw err;

    }
});
