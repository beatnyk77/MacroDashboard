/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const tradeData = [
            // INDIA
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'BRICS+', period: '2018', trade_value_usd: 210e9, trade_share_pct: 32.1 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'G7', period: '2018', trade_value_usd: 290e9, trade_share_pct: 44.2 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'BRICS+', period: '2020', trade_value_usd: 195e9, trade_share_pct: 34.5 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'G7', period: '2020', trade_value_usd: 255e9, trade_share_pct: 45.1 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'BRICS+', period: '2022', trade_value_usd: 390e9, trade_share_pct: 43.6 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'G7', period: '2022', trade_value_usd: 370e9, trade_share_pct: 41.4 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'BRICS+', period: '2023', trade_value_usd: 445e9, trade_share_pct: 46.8 },
            { swing_state_code: '699', swing_state_name: 'India', bloc: 'G7', period: '2023', trade_value_usd: 360e9, trade_share_pct: 37.9 },

            // BRAZIL
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'BRICS+', period: '2018', trade_value_usd: 98e9, trade_share_pct: 34.2 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'G7', period: '2018', trade_value_usd: 120e9, trade_share_pct: 41.8 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'BRICS+', period: '2020', trade_value_usd: 105e9, trade_share_pct: 38.4 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'G7', period: '2020', trade_value_usd: 112e9, trade_share_pct: 40.9 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'BRICS+', period: '2022', trade_value_usd: 148e9, trade_share_pct: 42.7 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'G7', period: '2022', trade_value_usd: 140e9, trade_share_pct: 40.4 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'BRICS+', period: '2023', trade_value_usd: 162e9, trade_share_pct: 44.1 },
            { swing_state_code: '76', swing_state_name: 'Brazil', bloc: 'G7', period: '2023', trade_value_usd: 138e9, trade_share_pct: 37.6 },

            // SAUDI ARABIA
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'BRICS+', period: '2018', trade_value_usd: 102e9, trade_share_pct: 31.8 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'G7', period: '2018', trade_value_usd: 145e9, trade_share_pct: 45.2 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'BRICS+', period: '2020', trade_value_usd: 88e9, trade_share_pct: 33.1 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'G7', period: '2020', trade_value_usd: 122e9, trade_share_pct: 45.9 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'BRICS+', period: '2022', trade_value_usd: 178e9, trade_share_pct: 37.2 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'G7', period: '2022', trade_value_usd: 218e9, trade_share_pct: 45.6 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'BRICS+', period: '2023', trade_value_usd: 193e9, trade_share_pct: 38.9 },
            { swing_state_code: '682', swing_state_name: 'Saudi Arabia', bloc: 'G7', period: '2023', trade_value_usd: 210e9, trade_share_pct: 42.3 },

            // INDONESIA (NEW)
            { swing_state_code: '360', swing_state_name: 'Indonesia', bloc: 'BRICS+', period: '2018', trade_value_usd: 65e9, trade_share_pct: 28.5 },
            { swing_state_code: '360', swing_state_name: 'Indonesia', bloc: 'G7', period: '2018', trade_value_usd: 95e9, trade_share_pct: 41.7 },
            { swing_state_code: '360', swing_state_name: 'Indonesia', bloc: 'BRICS+', period: '2023', trade_value_usd: 125e9, trade_share_pct: 44.5 },
            { swing_state_code: '360', swing_state_name: 'Indonesia', bloc: 'G7', period: '2023', trade_value_usd: 85e9, trade_share_pct: 30.2 },

            // MEXICO (NEW)
            { swing_state_code: '484', swing_state_name: 'Mexico', bloc: 'BRICS+', period: '2018', trade_value_usd: 45e9, trade_share_pct: 12.5 },
            { swing_state_code: '484', swing_state_name: 'Mexico', bloc: 'G7', period: '2018', trade_value_usd: 285e9, trade_share_pct: 79.2 },
            { swing_state_code: '484', swing_state_name: 'Mexico', bloc: 'BRICS+', period: '2023', trade_value_usd: 88e9, trade_share_pct: 19.5 },
            { swing_state_code: '484', swing_state_name: 'Mexico', bloc: 'G7', period: '2023', trade_value_usd: 355e9, trade_share_pct: 78.5 },

            // SOUTH AFRICA (NEW)
            { swing_state_code: '710', swing_state_name: 'South Africa', bloc: 'BRICS+', period: '2018', trade_value_usd: 42e9, trade_share_pct: 30.2 },
            { swing_state_code: '710', swing_state_name: 'South Africa', bloc: 'G7', period: '2018', trade_value_usd: 55e9, trade_share_pct: 39.5 },
            { swing_state_code: '710', swing_state_name: 'South Africa', bloc: 'BRICS+', period: '2023', trade_value_usd: 72e9, trade_share_pct: 45.4 },
            { swing_state_code: '710', swing_state_name: 'South Africa', bloc: 'G7', period: '2023', trade_value_usd: 52e9, trade_share_pct: 32.8 },
        ];

        const { error } = await supabase
            .from('trade_gravity')
            .upsert(tradeData, { onConflict: 'swing_state_code,bloc,period' });

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            count: tradeData.length,
            message: `Upserted ${tradeData.length} expanded trade gravity records.`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
