import https from 'https';

const serviceKey = 'fe95bc684b136a455cb3ae290e273510317e0404e07de14b17f818857faae38e';
const projectRef = 'debdriyzfcwvgrhzzzre';
const url = `https://${projectRef}.functions.supabase.co/ingest-us-macro`;

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceKey}`
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      console.log(JSON.parse(body));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', err => {
  console.error('Error:', err);
});

req.write(JSON.stringify({}));
req.end();
