/**
 * Capital Flows Ingestion Engine
 * Sources: IMF BOP, FRED TIC, Alpha Vantage (Proxies), CoinGecko, ECB SDMX
 */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { IndiaTelemetry } from '../_shared/india-telemetry.ts'

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-capital-flows', async (ctx) => {
        const results: any[] = []
        const AV_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')

        // 1. Alpha Vantage Proxies (ETF Flows)
        if (AV_API_KEY) {
            const proxies = [
                { ticker: 'SPY', metricId: 'CAPITAL_FROM_EQUITY_ETF_BN' },
                { ticker: 'TLT', metricId: 'CAPITAL_FROM_TREASURIES_BN' }
            ]
            for (const proxy of proxies) {
                try {
                    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${proxy.ticker}&apikey=${AV_API_KEY}`
                    const resp = await fetch(url)
                    const data = await resp.json() as any
                    if (data?.['Time Series (Daily)']) {
                        const latestDate = Object.keys(data['Time Series (Daily)'])[0]
                        const dayData = data['Time Series (Daily)'][latestDate]
                        const flow = (parseFloat(dayData['5. volume']) * parseFloat(dayData['4. close'])) / 1e9
                        
                        await supabase.from('metric_observations').upsert({
                            metric_id: proxy.metricId,
                            as_of_date: latestDate,
                            value: flow,
                            provenance: 'api_live'
                        }, { onConflict: 'metric_id, as_of_date' })
                        results.push({ metric: proxy.metricId, status: 'success' })
                    }
                } catch (e) {
                    console.error(`AV Proxy failed for ${proxy.ticker}`, e)
                }
            }
        }

        // 2. Bitcoin Price (CoinGecko Simple API)
        try {
            const btcResp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
            const btcData = await btcResp.json() as any
            if (btcData?.bitcoin?.usd) {
                await supabase.from('metric_observations').upsert({
                    metric_id: 'BITCOIN_PRICE_USD',
                    as_of_date: new Date().toISOString().split('T')[0],
                    value: btcData.bitcoin.usd,
                    provenance: 'api_live'
                }, { onConflict: 'metric_id, as_of_date' })
                results.push({ metric: 'BITCOIN_PRICE_USD', status: 'success' })
            }
        } catch (e) {
            console.error('CoinGecko failed', e)
        }

        // 3. ECB Total Assets (ECB SDMX REST)
        try {
            const ecbUrl = 'https://sdw-wsrest.ecb.europa.eu/service/data/ILM/W.U2.C.T000000.Z5.Z?lastNObservations=1&format=jsondata'
            const ecbResp = await fetch(ecbUrl)
            const ecbData = await ecbResp.json() as any
            // Simplified parsing for ECB SDMX JSON
            const value = ecbData?.dataSets?.[0]?.series?.['0:0:0:0:0:0']?.observations?.['0']?.[0]
            if (value) {
                await supabase.from('metric_observations').upsert({
                    metric_id: 'ECB_TOTAL_ASSETS_MEUR',
                    as_of_date: new Date().toISOString().split('T')[0],
                    value: parseFloat(value),
                    provenance: 'api_live'
                }, { onConflict: 'metric_id, as_of_date' })
                results.push({ metric: 'ECB_TOTAL_ASSETS_MEUR', status: 'success' })
            }
        } catch (e) {
            console.error('ECB API failed', e)
        }

        // 4. India FX Reserves (Shared Telemetry)
        try {
            const telemetry = new IndiaTelemetry(fredApiKey)
            const fxReserves = await telemetry.getFXReserves()
            if (fxReserves.length > 0) {
                await supabase.from('metric_observations').upsert(fxReserves.map(r => ({
                    ...r,
                    last_updated_at: new Date().toISOString()
                })), { onConflict: 'metric_id, as_of_date' })
                results.push({ metric: 'IN_FX_RESERVES', status: 'success' })
            }
        } catch (e) {
            console.error('India FX Reserves failed', e)
        }

        // 5. Update Capital Flow Anomalies Table (Radar Logic)
        const countries = ['US', 'EU', 'CN', 'JP', 'IN', 'BR']
        const assetClasses = ['Equity', 'Debt', 'Reserves']

        for (const country of countries) {
            for (const asset of assetClasses) {
                try {
                    const { data: latestObs } = await supabase
                        .from('metric_observations')
                        .select('z_score, value')
                        .ilike('metric_id', `%${country}%`)
                        .order('as_of_date', { ascending: false })
                        .limit(1)

                    if (latestObs?.[0]) {
                        const z = latestObs[0].z_score || 0
                        const regime = Math.abs(z) > 2 ? 'CRITICAL' : (Math.abs(z) > 1 ? 'WATCH' : 'NORMAL')
                        await supabase.from('capital_flow_anomalies').upsert({
                            country_code: country,
                            asset_class: asset,
                            as_of_date: new Date().toISOString().split('T')[0],
                            z_score: z,
                            regime,
                            description: `Updated via live telemetry (${new Date().toLocaleDateString()})`
                        }, { onConflict: 'country_code, asset_class, as_of_date' })
                    }
                } catch (e) {
                    console.error(`Anomaly compute failed for ${country}-${asset}`, e)
                }
            }
        }

        return {
            rows_inserted: results.length,
            metadata: { results }
        }
    })
})
