import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get Source ID for FRED
    const { data: sourceData, error: sourceError } = await supabaseClient
      .from('data_sources')
      .select('id')
      .eq('name', 'FRED')
      .single()

    if (sourceError || !sourceData) {
      throw new Error('FRED data source not found in database')
    }
    const sourceId = sourceData.id

    // 2. Fetch FRED metrics
    // The metric 'id' in our table IS the FRED series ID (e.g. 'US_GDP') or maps to it?
    // In our schema: id is TEXT PRIMARY KEY (e.g. US_M2). 
    // We probably need a 'source_metric_id' or just use 'id' if they match.
    // Let's assume 'id' usually matches FRED series ID, OR we should store the FRED series ID in metadata?
    // Looking at schema: metrics(id, name, ...). 
    // Let's assume for now that metrics.id IS the FRED series ID, or we need to look it up.
    // Wait, typical pattern: metrics.id = 'US_M2', FRED ID = 'M2SL'.
    // The schema didn't have a specific 'external_id' column. 
    // Let's assume we store the external FRED ID in a metadata field or just rely on 'id' being the FRED ID for now.
    // *Correction*: The previous code used `metric_key`. My new schema dropped `metric_key`.
    // I should check if I should add `external_id` or `source_metric_id` to schema. 
    // FOR NOW: I will check if `metadata->>'fred_id'` exists, or fallback to `id`.

    const { data: metrics, error: metricsError } = await supabaseClient
      .from('metrics')
      .select('id, native_frequency, metadata') // Querying metadata for mapping
      .eq('source_id', sourceId)
      .eq('is_active', true)

    if (metricsError) throw metricsError
    if (!metrics || metrics.length === 0) {
      return new Response(JSON.stringify({ message: 'No active FRED metrics found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fredApiKey = Deno.env.get('FRED_API_KEY')
    if (!fredApiKey) {
      throw new Error('FRED_API_KEY not set')
    }

    const results = []

    // 3. Loop and fetch
    for (const metric of metrics) {
      // Use metadata.fred_id if available, otherwise use metric.id
      // Safely access metadata properties
      const metadata = metric.metadata as { fred_id?: string } | null;
      const fredSeriesId = metadata?.fred_id || metric.id

      // Limit to last 100 points for incremental updates
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredSeriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`

      console.log(`Fetching ${fredSeriesId} for metric ${metric.id}...`)
      try {
        const response = await fetch(url)
        const data = await response.json()

        if (data.error_code) {
          console.error(`Error fetching ${fredSeriesId}:`, data.error_message)
          results.push({ metric: metric.id, status: 'error', error: data.error_message })
          continue
        }

        const observations = data.observations.map((obs: any) => ({
          metric_id: metric.id,
          as_of_date: obs.date, // Map to new schema column
          value: parseFloat(obs.value),
          // Default computed fields handled by DB or compute job? 
          // For now, we insert raw values. Z-scores are computed by separate job or view.
        })).filter((o: any) => !isNaN(o.value))

        if (observations.length > 0) {
          // 4. Upsert values to metric_observations
          const { error: upsertError } = await supabaseClient
            .from('metric_observations')
            .upsert(observations, { onConflict: 'metric_id, as_of_date' })

          if (upsertError) {
            console.error(`Error upserting ${metric.id}:`, upsertError)
            results.push({ metric: metric.id, status: 'db_error', error: upsertError.message })
          } else {
            // Staleness is computed by view, no manual update needed on parent table
            results.push({ metric: metric.id, status: 'success', count: observations.length })
          }
        } else {
          results.push({ metric: metric.id, status: 'no_data' })
        }
      } catch (fetchError: any) {
        console.error(`Network error for ${metric.id}:`, fetchError)
        results.push({ metric: metric.id, status: 'network_error', error: fetchError.message || String(fetchError) })
      }

      // Basic rate limiting (500ms delay)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
