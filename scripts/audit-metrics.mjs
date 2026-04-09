import https from 'https';

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc';
const projectRef = 'debdriyzfcwvgrhzzzre';
const url = `https://${projectRef}.supabase.co/rest/v1/metrics?select=id,metadata&metadata->>fred_id=not.is.null`;

const req = https.get(url, {
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Metrics Registration Audit:');
    try {
      const metrics = JSON.parse(body);
      console.table(metrics.map(m => ({ id: m.id, fred_id: m.metadata?.fred_id })));
    } catch (e) {
      console.log('Raw Response:', body);
    }
  });
});

req.on('error', err => {
  console.error('Error:', err);
});
