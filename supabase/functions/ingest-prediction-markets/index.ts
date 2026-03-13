import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DomeMarket {
    id: string;
    question: string;
    platform: string;
    probability: number;
    volume?: number;
    liquidity?: number;
    open_interest?: number;
    best_odds?: { yes: number; no: number };
    category?: string;
}

const AFFILIATE_LINKS: Record<string, string> = {
    kalshi: 'https://kalshi.com/?referral=GRAPHIQUESTOR',
    polymarket: 'https://polymarket.com/?referral=GRAPHIQUESTOR',
    predictit: 'https://predictit.org/?referral=GRAPHIQUESTOR'
};

async function fetchWithRetry(url: string, options: any, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            if (response.status >= 500 && i < retries - 1) {
                console.warn(`Retry ${i + 1}/${retries} for ${url} (Status: ${response.status})`);
                await new Promise(resolve => setTimeout(resolve, backoff * (i + 1)));
                continue;
            }
            return response;
        } catch (err) {
            if (i < retries - 1) {
                console.warn(`Retry ${i + 1}/${retries} for ${url} (Error: ${err.message})`);
                await new Promise(resolve => setTimeout(resolve, backoff * (i + 1)));
                continue;
            }
            throw err;
        }
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const startTime = new Date();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const domeApiKey = Deno.env.get('DOME_API_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        if (!domeApiKey) throw new Error('DOME_API_KEY not found in environment');

        console.log('Fetching Prediction Market data from DomeAPI...');

        const platforms = ['kalshi', 'polymarket', 'predictit'];
        let allMarkets: any[] = [];
        const platformStats: Record<string, any> = {};

        for (const platform of platforms) {
            try {
                const url = `https://api.domeapi.io/v1/${platform}/markets?limit=25&status=active&sort=volume_24h`;
                const response = await fetchWithRetry(url, {
                    headers: { 'Authorization': `Bearer ${domeApiKey}` }
                });

                if (response && response.ok) {
                    const data = await response.json();
                    const markets = data.markets || [];
                    
                    platformStats[platform] = { count: markets.length, status: 'success' };

                    const mapped = markets.map((m: any) => ({
                        market_id: m.id,
                        question: m.question || m.title,
                        platform: platform,
                        probability: m.probability || (m.yes_price ? m.yes_price / 100 : 0.5),
                        volume: m.volume_24h || m.volume || 0,
                        liquidity: m.liquidity || 0,
                        open_interest: m.open_interest || 0,
                        best_odds: m.best_odds || { yes: m.probability || 0.5, no: 1 - (m.probability || 0.5) },
                        category: m.category || 'General',
                        affiliate_url: AFFILIATE_LINKS[platform] || '',
                        last_updated: new Date().toISOString()
                    }));

                    allMarkets = [...allMarkets, ...mapped];
                } else {
                    const status = response ? response.status : 'unknown';
                    platformStats[platform] = { status: 'failed', statusCode: status };
                    console.error(`Failed to fetch from ${platform}: Status ${status}`);
                }
            } catch (err) {
                platformStats[platform] = { status: 'error', error: err.message };
                console.error(`Error fetching from ${platform}:`, err);
            }
        }

        if (allMarkets.length === 0) {
            await supabase.from('ingestion_logs').insert({
                function_name: 'ingest-prediction-markets',
                start_time: startTime.toISOString(),
                completed_at: new Date().toISOString(),
                status: 'warning',
                error_message: 'No markets found from any platform',
                metadata: { platform_stats: platformStats }
            });
            
            return new Response(JSON.stringify({ success: true, message: 'No markets found', stats: platformStats }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Upsert to Supabase
        const { error: upsertError } = await supabase
            .from('domeapi_markets')
            .upsert(allMarkets, { onConflict: 'platform, market_id' });

        if (upsertError) throw upsertError;

        // Log success
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-prediction-markets',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'success',
            rows_updated: allMarkets.length,
            metadata: {
                platforms_processed: platforms,
                markets_count: allMarkets.length,
                platform_stats: platformStats
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${allMarkets.length} markets`,
            platforms: platforms,
            stats: platformStats
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('DomeAPI ingestion failed:', error);

        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-prediction-markets',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message
        });

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
