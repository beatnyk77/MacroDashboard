import { Client } from 'pg';

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
    await client.connect();
    console.log('Connected to remote DB');

    // Check if country_metrics exists
    const res1 = await client.query("SELECT to_regclass('public.country_metrics');");
    console.log('Table exists?', res1.rows[0].to_regclass);

    // Count rows
    const res2 = await client.query('SELECT COUNT(*) FROM country_metrics');
    console.log('country_metrics count:', res2.rows[0].count);

    // Count reserves
    const res3 = await client.query('SELECT COUNT(*) FROM country_reserves');
    console.log('country_reserves count:', res3.rows[0].count);

    // Count metric_observations
    const res4 = await client.query("SELECT COUNT(*) FROM metric_observations WHERE metric_id LIKE '%_POLICY_RATE'");
    console.log('policy rate obs count:', res4.rows[0].count);

    // Count yield series for US
    const res5 = await client.query("SELECT COUNT(*) FROM metric_observations WHERE metric_id IN ('US_DGS2','US_DGS10')");
    console.log('US yield obs count:', res5.rows[0].count);

    // Sample metric_observations
    const res6 = await client.query("SELECT metric_id, value, as_of_date FROM metric_observations WHERE metric_id LIKE '%_POLICY_RATE' LIMIT 5");
    console.log('Sample policy rates:', res6.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
