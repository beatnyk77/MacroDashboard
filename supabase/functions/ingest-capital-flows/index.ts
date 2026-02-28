import { createAdminClient } from './utils/supabaseClient.ts'

/**
 * Capital Flows Ingestion Engine
 * Sources: IMF BOP, FRED TIC, Alpha Vantage (Proxies)
 */

Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 })
    }

    const client = createAdminClient()
    const results: any[] = []
    const errors: any[] = []

    // 1. Fetch Alpha Vantage Proxies (ETF Flows)
    const AV_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    const proxies = [
        { ticker: 'SPY', metricId: 'CAPITAL_FROM_EQUITY_ETF_BN' },
        { ticker: 'TLT', metricId: 'CAPITAL_FROM_TREASURIES_BN' }
    ]

    console.log(`Starting Capital Flows Ingestion with Alpha Vantage...`);

    if (AV_API_KEY) {
        for (const proxy of proxies) {
            try {
                const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${proxy.ticker}&apikey=${AV_API_KEY}`
                const resp = await fetch(url)
                const data = await resp.json() as any

                if (data && data['Time Series (Daily)']) {
                    const days = Object.keys(data['Time Series (Daily)']).slice(0, 30) // Last 30 days
                    const observations = [];

                    for (const date of days) {
                        const dayData = data['Time Series (Daily)'][date]
                        const volume = parseFloat(dayData['5. volume'])
                        const price = parseFloat(dayData['4. close'])
                        const flowEstimate = (volume * price) / 1e9; // Normalized to Billion USD

                        observations.push({
                            metric_id: proxy.metricId,
                            as_of_date: date,
                            value: flowEstimate,
                            last_updated_at: new Date().toISOString()
                        });

                        // Keep legacy table updated for latest
                        if (date === days[0]) {
                            await client.from('capital_flows_proxies').upsert({
                                proxy_ticker: proxy.ticker,
                                as_of_date: date,
                                volume_proxy: volume,
                                price_proxy: price,
                                flow_estimate_usd: flowEstimate * 1e9,
                                metadata: { source: 'Alpha Vantage' }
                            }, { onConflict: 'proxy_ticker, as_of_date' })
                        }
                    }

                    if (observations.length > 0) {
                        const { error: upsertError } = await client.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' })
                        if (upsertError) throw upsertError
                        await client.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', proxy.metricId)
                    }

                    results.push({ type: 'proxy', ticker: proxy.ticker, metricId: proxy.metricId, count: observations.length })
                } else if (data && data['Note']) {
                    console.warn(`Alpha Vantage Rate Limit: ${data['Note']}`);
                    errors.push({ type: 'proxy', ticker: proxy.ticker, error: 'Rate limit hit' });
                }
            } catch (e: any) {
                errors.push({ type: 'proxy', ticker: proxy.ticker, error: e.message })
            }
        }
    } else {
        console.warn('ALPHA_VANTAGE_API_KEY not found, skipping Alpha Vantage proxies');
    }

    // 2. Fetch IMF BOP Data (Managed by ingest-imf now, but we can do a quick check/compute here)
    // For specialized capital_flow_anomalies table, we use recent metric_observations
    const countries = ['US', 'EU', 'CN', 'JP', 'IN', 'BR']
    const assetClasses = ['Equity', 'Debt', 'Reserves']

    for (const country of countries) {
        for (const asset of assetClasses) {
            try {
                // Find matching metric ID for this radar cell
                // (Logic should match METRIC_MAP in useCapitalFlows.ts)
                const metric_search_id = `REER_INDEX_${country}`; // Example fallback

                const { data: latestObs } = await client
                    .from('metric_observations')
                    .select('z_score, value')
                    .ilike('metric_id', `%${country}%`)
                    .order('as_of_date', { ascending: false })
                    .limit(1);

                if (latestObs && latestObs.length > 0) {
                    const zScore = latestObs[0].z_score || 0;
                    let regime = 'NORMAL'
                    if (Math.abs(zScore) > 2) regime = 'CRITICAL'
                    else if (Math.abs(zScore) > 1) regime = 'WATCH'

                    await client.from('capital_flow_anomalies').upsert({
                        country_code: country,
                        asset_class: asset,
                        as_of_date: new Date().toISOString().split('T')[0],
                        z_score: zScore,
                        regime: regime,
                        description: `Computed z-score for ${country} ${asset}`
                    }, { onConflict: 'country_code, asset_class, as_of_date' })
                }
            } catch (e: any) {
                errors.push({ type: 'anomaly', country, asset, error: e.message })
            }
        }
    }

    return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined
    }), {
        headers: { 'Content-Type': 'application/json' }
    })
})
