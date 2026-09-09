import https from 'https';

const serviceJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ0NzM5MCwiZXhwIjoyMDg1MDIzMzkwfQ.xODd81IhdGOhR94OwU8JmUeIZzUU9FF81lFxHKa-pd4';
const projectRef = 'debdriyzfcwvgrhzzzre';

function invokeFunction(path) {
  return new Promise((resolve, reject) => {
    const url = `https://${projectRef}.supabase.co/functions/v1/${path}`;
    console.log(`[Invoking] ${url}...`);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceJwt}`
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({}));
    req.end();
  });
}

function querySupabase(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://${projectRef}.supabase.co/rest/v1/${endpoint}`;
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': serviceJwt,
        'Authorization': `Bearer ${serviceJwt}`
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== Step 1: Triggering ingest-us-macro-fiscal ===');
  const fiscalRes = await invokeFunction('ingest-us-macro-fiscal');
  console.log('Result:', JSON.stringify(fiscalRes, null, 2));

  console.log('\n=== Step 2: Triggering ingest-central-banks?source=fx_carry ===');
  const cbRes = await invokeFunction('ingest-central-banks?source=fx_carry');
  console.log('Result:', JSON.stringify(cbRes, null, 2));

  console.log('\n=== Step 3: Verifying populated metric observations ===');
  const metricIds = [
    'US_SRF_UTILIZATION_BN',
    'US_BANK_CREDIT_H8_YOY',
    'US_HY_CREDIT_OAS_BPS',
    'INTERBANK_CREDIT_STRESS_INDEX',
    'FOREIGN_OFFICIAL_UST_CUSTODY_BN',
    'PRIMARY_DEALER_UST_INVENTORY_BN',
    'UST_AUCTION_BID_TO_COVER_10Y',
    'PRIMARY_DEALER_ABSORPTION_STRESS',
    'EURUSD_3M_SWAP_BASIS_BPS',
    'JPYUSD_3M_SWAP_BASIS_BPS',
    'G7_REAL_POLICY_RATE_MATRIX',
    'JPY_CARRY_UNWIND_RISK_SCORE'
  ];

  for (const mid of metricIds) {
    const check = await querySupabase(`metric_observations?metric_id=eq.${mid}&order=as_of_date.desc&limit=2`);
    console.log(`[Metric] ${mid} ->`, check.data?.length ? `${check.data.length} rows (latest: ${check.data[0].as_of_date} = ${check.data[0].value})` : '0 rows');
  }
}

run().catch(err => console.error('Fatal error:', err));
