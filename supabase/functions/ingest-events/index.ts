import { createClient } from '@supabase/supabase-js'
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
      { date: '2026-03-20', name: 'US GDP Growth (Annualized)', impact: 'high', consensus: '2.1%', actual: null },
      { date: '2026-04-10', name: 'US CPI Data Release', impact: 'high', consensus: '3.0%', actual: null },
      { date: '2026-04-15', name: 'Industrial Production %', impact: 'medium', consensus: '0.2%', actual: null },
      { date: '2026-05-01', name: 'FOMC Statement & Presser', impact: 'high', consensus: '4.00%', actual: null },
      { date: '2026-05-15', name: 'G7 Finance Ministers Meeting', impact: 'medium', consensus: 'N/A', actual: null },
      { date: '2026-06-12', name: 'BoE Interest Rate Decision', impact: 'high', consensus: '5.25%', actual: null },
      { date: '2026-06-25', name: 'US Durable Goods Orders', impact: 'medium', consensus: '0.5%', actual: null },
      { date: '2026-07-02', name: 'US Unemployment Rate', impact: 'high', consensus: '3.9%', actual: null },
      { date: '2026-07-15', name: 'China GDP Growth YoY', impact: 'high', consensus: '4.8%', actual: null },
      { date: '2026-08-10', name: 'OPEC+ JMMC Meeting', impact: 'high', consensus: 'N/A', actual: null },
      { date: '2026-09-01', name: 'FOMC Interest Rate Hike/Cut', impact: 'high', consensus: '3.75%', actual: null },
      { date: '2026-10-15', name: 'IMF World Economic Outlook', impact: 'medium', consensus: 'N/A', actual: null },
      { date: '2026-11-03', name: 'US Midterm Elections (Proxy)', impact: 'high', consensus: 'N/A', actual: null },
      { date: '2026-12-15', name: 'Year-End FOMC Projections', impact: 'high', consensus: '3.50%', actual: null },
      { date: '2027-01-10', name: 'Annual Macro Outlook 2027', impact: 'high', consensus: 'N/A', actual: null }
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
