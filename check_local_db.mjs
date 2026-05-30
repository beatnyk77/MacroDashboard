import pkg from 'pg';
const { Client } = pkg;

async function checkLocalDB() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  try {
    await client.connect();
    console.log("Connected to local Supabase database");

    const res = await client.query('SELECT signal_date, regime, score, computed_at FROM daily_signal ORDER BY signal_date DESC LIMIT 5;');
    console.log("--- daily_signal ---");
    console.table(res.rows);

    const vw = await client.query('SELECT * FROM vw_latest_daily_signal LIMIT 1;');
    console.log("--- vw_latest_daily_signal ---");
    console.table(vw.rows);
  } catch (err) {
    console.error("Local DB Connection Error:", err.message);
  } finally {
    await client.end();
  }
}

checkLocalDB();
