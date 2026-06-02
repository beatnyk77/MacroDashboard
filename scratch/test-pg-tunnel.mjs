import http from 'http';
import pkg from 'pg';
import { URL } from 'url';
const { Client } = pkg;

const proxyUrlStr = process.env.https_proxy || process.env.http_proxy;
if (!proxyUrlStr) {
  console.error("No proxy found in environment variables");
  process.exit(1);
}

const proxyUrl = new URL(proxyUrlStr);
const dbHost = 'db.debdriyzfcwvgrhzzzre.supabase.co';
const dbPort = 5432;

console.log(`Connecting to proxy at ${proxyUrl.hostname}:${proxyUrl.port}...`);

const req = http.request({
  host: proxyUrl.hostname,
  port: proxyUrl.port,
  method: 'CONNECT',
  path: `${dbHost}:${dbPort}`,
  headers: {
    'Host': `${dbHost}:${dbPort}`
  }
});

req.on('connect', (res, socket) => {
  console.log('Tunnel established! Initializing PG client over tunnel stream...');
  
  const client = new Client({
    user: 'postgres',
    password: '3207f00b0572ddfabc437133df5853b1525b3e7bdfe77d63487803d78590cb05',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    stream: socket
  });

  client.connect()
    .then(async () => {
      console.log('Successfully connected to remote DB over HTTP CONNECT tunnel!');
      const dbRes = await client.query('SELECT NOW()');
      console.log('DB Time:', dbRes.rows[0]);
    })
    .catch(err => {
      console.error('PG Client Error:', err.message);
    })
    .finally(() => {
      client.end();
    });
});

req.on('error', err => {
  console.error('Proxy CONNECT error:', err.message);
});

req.end();
