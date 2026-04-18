import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const comtradeKey = Deno.env.get('COMTRADE_API_KEY') || Deno.env.get('contrade_api_key');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const urlParams = new URL(req.url).searchParams;
        const category = urlParams.get('category') || 'Semiconductors';
        const hsCode = urlParams.get('hsCode') || '8542';

        console.log(`Starting UN Comtrade Ingestion for ${category} (HS ${hsCode})...`);

        // Period: 2023
        // Add 699 (India) to reporters
        const reporterCode = "156,410,490,528,840,699";
        const period = "2023";
        const flowCode = "X"; // Exports
        const partnerCode = "0"; // World

        let url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterCode}&period=${period}&cmdCode=${hsCode}&flowCode=${flowCode}&partnerCode=${partnerCode}`;

        if (comtradeKey) {
            url += `&subscription-key=${comtradeKey}`;
        }

        console.log(`Fetching from UN Comtrade: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`UN Comtrade API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const records = data.data || [];

        console.log(`Received ${records.length} records from UN Comtrade.`);

        const tradeData = records.map((record: any) => ({
            category: category,
            hs_code: hsCode,
            reporter_code: record.reporterCode.toString(),
            reporter_name: record.reporterName,
            partner_code: record.partnerCode.toString(),
            partner_name: record.partnerName,
            period: record.period,
            trade_value_usd: record.primaryValue,
            net_weight_kg: record.netWgt,
            reporter_is_exporter: true,
            metadata: {
                source: 'UN Comtrade',
                flowDesc: record.flowDesc,
                qtyUnit: record.qtyUnitAbbr
            }
        }));

        if (tradeData.length > 0) {
            const bilateralData = tradeData.filter((r: any) => r.partner_code !== '0');

            const { error } = await supabase
                .from('trade_chokepoints')
                .upsert(bilateralData, {
                    onConflict: 'category,hs_code,reporter_code,partner_code,period,reporter_is_exporter'
                });

            if (error) throw error;

            console.log(`Successfully upserted ${bilateralData.length} records.`);
        }

        return new Response(JSON.stringify({
            success: true,
            count: tradeData.length,
            message: `Ingested ${tradeData.length} records for ${category}.`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error("Ingest Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
