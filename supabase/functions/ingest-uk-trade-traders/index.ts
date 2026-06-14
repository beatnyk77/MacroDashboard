/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doIngest(supabase: ReturnType<typeof createClient>, req: Request): Promise<IngestResult> {
    const urlParams = new URL(req.url).searchParams;
    const hsCode = urlParams.get('hsCode');

    if (!hsCode) {
        throw new Error("hsCode parameter is required");
    }

    console.log(`Starting UK Trade Info Trader Ingestion for HS ${hsCode}...`);

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
                        value_gbp: flow.Value || null,
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

    let upserted = 0;
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
        upserted = allData.length;
        console.log(`Successfully upserted ${allData.length} records.`);
    }

    return {
        ok: true,
        counts: { upserted, skipped: 0 },
        meta: { hs_code: hsCode, records: upserted },
    };
}

serveIngest('ingest-uk-trade-traders', async (req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase, req)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
