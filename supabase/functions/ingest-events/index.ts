import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/slack.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Fetching/Seeding high-impact macro events...')

    // For simplicity and stability, we seed/update a curated list of recurring high-impact events
    // In a production scenario, this could be fetched from a FRED Economic Calendar or similar
    const events = [
      { date: '2026-02-01', name: 'FOMC Interest Rate Decision', impact: 'high', consensus: '4.50%', actual: null },
      { date: '2026-02-04', name: 'US Consumer Price Index (CPI)', impact: 'high', consensus: '3.1%', actual: null },
      { date: '2026-02-06', name: 'Non-Farm Payrolls (NFP)', impact: 'high', consensus: '180k', actual: null },
      { date: '2026-02-12', name: 'US Retail Sales', impact: 'medium', consensus: '0.4%', actual: null },
      { date: '2026-03-18', name: 'FOMC Meeting & Projections', impact: 'high', consensus: '4.25%', actual: null },
    ];

    const { error: upsertError } = await supabase
      .from('macro_events')
      .upsert(
        events.map(e => ({
          event_date: e.date,
          event_name: e.name,
          impact_level: e.impact,
          consensus_value: e.consensus,
          actual_value: e.actual,
          status: e.actual ? 'completed' : 'upcoming'
        })),
        { onConflict: 'event_date, event_name' }
      );

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ message: 'Events updated successfully', count: events.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in ingest-events:', error.message);
    await sendSlackAlert(`GraphiQuestor ingestion failed: ingest-events - ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
