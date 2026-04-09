const https = require('https');

const serviceKey = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';
const projectRef = 'debdriyzfcwvgrhzzzre';
const table = 'country_metrics';

function query(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: `/rest/v1/rpc/exec`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Try to count rows
query('SELECT COUNT(*) FROM country_metrics')
  .then(result => {
    console.log('Count result:', JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error('Error:', err);
  });
