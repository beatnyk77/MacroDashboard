const SUPABASE_URL = 'https://debdriyzfcwvgrhzzzre.supabase.co';
const SERVICE_KEY = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';

async function run() {
  try {
    console.log('1. Checking metrics registrations...');
    const resMetrics = await fetch(`${SUPABASE_URL}/rest/v1/metrics?id=in.(US_DEFENSE_SPENDING,US_FEDERAL_INTEREST_PAYMENTS)`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const metrics = await resMetrics.json();
    console.log('Metrics found:', JSON.stringify(metrics, null, 2));

    console.log('\n2. Querying observations for these metrics...');
    const resObs = await fetch(`${SUPABASE_URL}/rest/v1/metric_observations?metric_id=in.(US_DEFENSE_SPENDING,US_FEDERAL_INTEREST_PAYMENTS)&select=metric_id,as_of_date,value&order=as_of_date.desc&limit=10`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const obs = await resObs.json();
    console.log('Latest 10 observations:', JSON.stringify(obs, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
