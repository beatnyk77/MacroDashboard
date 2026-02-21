import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TradeRecord = {
    reporterCode: number;
    reporterName: string;
    partnerCode: number;
    partnerName: string;
    period: string;
    primaryValue: number;
    netWgt: number;
    isFlowIn: boolean;
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

        console.log("Starting UN Comtrade Ingestion for Semiconductors (HS 8542)...");

        // HS 8542: Electronic integrated circuits
        // For MVP, we'll fetch data for the top exporters and their partners
        // Reporters: 156 (China), 410 (Korea), 490 (Taiwan), 528 (Netherlands), 840 (USA)
        // We'll fetch the most recent annual data available (usually 2023 or 2024)

        // HS 8542: Electronic integrated circuits
        const period = "2023";
        const reporterCode = "156,410,490,528,840";
        const cmdCode = "8542";
        const flowCode = "X"; // Exports
        const partnerCode = "0"; // World

        // Attempting the 'data/v1/get' endpoint which is common for authenticated v1 calls
        let url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${reporterCode}&period=${period}&cmdCode=${cmdCode}&flowCode=${flowCode}&partnerCode=${partnerCode}`;

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
            category: 'Semiconductors',
            hs_code: cmdCode,
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
            // Filter out 'World' partner if we want bilateral only, but keep it for reference if needed
            // For Sankey, we need specific partners.
            const bilateralData = tradeData.filter(r => r.partner_code !== '0');

            const { error } = await supabase
                .from('trade_chokepoints')
                .upsert(bilateralData, {
                    onConflict: 'category, hs_code, reporter_code, partner_code, period, reporter_is_exporter'
                });

            if (error) throw error;

            console.log(`Successfully upserted ${bilateralData.length} bilateral trade records.`);
        }

        return new Response(JSON.stringify({
            success: true,
            count: tradeData.length,
            message: `Ingested ${tradeData.length} records for HS 8542.`
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
