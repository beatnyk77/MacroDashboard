import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'db.debdriyzfcwvgrhzzzre.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '3207f00b0572ddfabc437133df5853b1525b3e7bdfe77d63487803d78590cb05',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log('Connecting to remote DB...');
    await client.connect();
    console.log('Successfully connected to remote DB!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0]);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

test();
