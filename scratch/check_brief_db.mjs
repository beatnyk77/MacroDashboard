import pkg from 'pg';
const { Client } = pkg;

async function checkBriefDB() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  try {
    await client.connect();
    console.log("Connected to local Supabase database");

    // 1. Check if table exists and has data
    console.log("\n--- Checking daily_macro_briefs existence and data ---");
    try {
      const res = await client.query('SELECT * FROM daily_macro_briefs ORDER BY brief_date DESC LIMIT 5;');
      console.log("Found daily_macro_briefs rows count:", res.rows.length);
      console.table(res.rows.map(r => ({
        brief_date: r.brief_date,
        focus_areas: r.focus_areas,
        regime_label: r.regime_label,
        regime_score: r.regime_score,
        model_used: r.model_used
      })));
    } catch (err) {
      console.error("Error reading daily_macro_briefs:", err.message);
    }

    // 2. Check RLS policies
    console.log("\n--- Checking pg_policies for daily_macro_briefs ---");
    try {
      const policies = await client.query(`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'daily_macro_briefs';
      `);
      console.table(policies.rows);
    } catch (err) {
      console.error("Error querying pg_policies:", err.message);
    }

  } catch (err) {
    console.error("Local DB Connection Error:", err.message);
  } finally {
    await client.end();
  }
}

checkBriefDB();
