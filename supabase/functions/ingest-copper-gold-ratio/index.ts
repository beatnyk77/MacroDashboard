import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'
import { fetchAlphaVantageCommodity, upsertObservations } from '../_shared/ingest_utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY')
  
  if (!avApiKey) {
    return new Response(JSON.stringify({ error: 'ALPHAVANTAGE_API_KEY not found' }), { status: 500 })
  }

  const supabaseClient = createClient(supabaseUrl, supabaseKey)

  return runIngestion(supabaseClient, 'ingest-copper-gold-ratio', async (ctx) => {
    const result = await runWithRetry(
      'ingest-copper-gold-ratio',
      () => doIngestCopperGoldRatio(supabaseClient, avApiKey),
      { timeoutMs: 10 * 60 * 1000, maxRetries: 3, backoffMs: 60_000 }
    )
    if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
    return result.value!
  })
})

async function doIngestCopperGoldRatio(supabase: any, avApiKey: string) {
  console.log('Fetching Copper and Gold prices from AlphaVantage...')

  // Fetch Copper and Gold (using monthly as it's more reliable in AV Commodities API, 
  // but the script can be updated to daily if AV supports it for these)
  // Actually, for a ratio, we want the latest available.
  const [copperData, goldData] = await Promise.all([
    fetchAlphaVantageCommodity('COPPER', avApiKey, 'monthly'),
    fetchAlphaVantageCommodity('GOLD', avApiKey, 'monthly')
  ])

  if (copperData.length === 0 || goldData.length === 0) {
    throw new Error('Could not fetch data for Copper or Gold')
  }

  const latestCopper = copperData[0]
  const latestGold = goldData[0]
  
  // We want to align them. AV usually returns same dates for these.
  const ratio = latestCopper.value / latestGold.value
  const asOfDate = latestCopper.date

  console.log(`Copper: ${latestCopper.value}, Gold: ${latestGold.value}, Ratio: ${ratio} on ${asOfDate}`)

  const observations = [
    {
      metric_id: 'COPPER_PRICE_USD',
      as_of_date: latestCopper.date,
      value: latestCopper.value,
      metadata: { source: 'AlphaVantage', unit: 'USD' }
    },
    {
      metric_id: 'COPPER_GOLD_RATIO',
      as_of_date: asOfDate,
      value: ratio,
      metadata: { 
        source: 'AlphaVantage', 
        copper_price: latestCopper.value, 
        gold_price: latestGold.value,
        copper_date: latestCopper.date,
        gold_date: latestGold.date
      }
    }
  ]

  const { count } = await upsertObservations(supabase, observations)

  return {
    rows_inserted: count,
    metadata: {
      copper: latestCopper.value,
      gold: latestGold.value,
      ratio: ratio,
      date: asOfDate
    }
  }
}
