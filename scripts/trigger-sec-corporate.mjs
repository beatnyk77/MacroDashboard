import https from 'https';

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_PROJECT_ID || 'debdriyzfcwvgrhzzzre';

if (!serviceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  process.exit(1);
}

function invokeFunction(fnName) {
  return new Promise((resolve, reject) => {
    const url = `https://${projectRef}.supabase.co/functions/v1/${fnName}`;
    console.log(`\n▶ Triggering ${fnName}...`);
    
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      timeout: 120000,
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          console.log(JSON.stringify(JSON.parse(body), null, 2));
        } catch {
          console.log(body);
        }
        resolve();
      });
    });

    req.on('error', err => {
      console.error(`Error invoking ${fnName}:`, err);
      reject(err);
    });

    req.write(JSON.stringify({}));
    req.end();
  });
}

async function main() {
  try {
    await invokeFunction('ingest-sec-corporate');
    await invokeFunction('compute-corporate-signals');
    console.log('\n✓ Ingestion & signal computation pipeline completed.');
  } catch (err) {
    console.error('Pipeline failed:', err);
    process.exit(1);
  }
}

main();
