import fs from 'fs';
import https from 'https';

const token = 'sbp_3d20e0f87ca734184e687a78a6c967b9ee5b4bb3';
const projectRef = 'debdriyzfcwvgrhzzzre';
const sqlPath = './supabase/migrations/20260409000030_finalize_monetization_metrics.sql';

const query = fs.readFileSync(sqlPath, 'utf8');

const data = JSON.stringify({ query });

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
