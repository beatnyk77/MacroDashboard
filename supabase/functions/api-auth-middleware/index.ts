import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const apiKey = req.headers.get('x-api-key');

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Missing API Key' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client with service role key to bypass RLS and update counts
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Check API key validity
        const { data: keyData, error: dbError } = await supabase
            .from('api_keys')
            .select('id, tier, daily_quota, calls_used')
            .eq('api_key', apiKey)
            .single();

        if (dbError || !keyData) {
            return new Response(
                JSON.stringify({ error: 'Invalid API Key' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Check remaining quota
        if (keyData.calls_used >= keyData.daily_quota) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    tier: keyData.tier,
                    quota: keyData.daily_quota
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Increment usage count using RPC to avoid race conditions
        const { error: rpcError } = await supabase.rpc('increment_api_usage', { key_id: keyData.id });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
        }

        // If it's a "middleware" that just validates, return success
        return new Response(
            JSON.stringify({
                status: 'authorized',
                tier: keyData.tier,
                remaining: keyData.daily_quota - (keyData.calls_used + 1)
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
