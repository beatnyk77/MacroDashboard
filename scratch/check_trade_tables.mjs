import pkg from 'pg';
const { Client } = pkg;

async function checkTradeTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });

  try {
    await client.connect();
    console.log("Connected to local database.");

    // Check count in trade_demand_cache
    const demandCount = await client.query('SELECT COUNT(*), COUNT(DISTINCT reporter_iso3), COUNT(DISTINCT hs_code) FROM trade_demand_cache;');
    console.log("trade_demand_cache:", demandCount.rows[0]);

    // Check some sample rows from trade_demand_cache
    const demandSamples = await client.query('SELECT * FROM trade_demand_cache LIMIT 5;');
    console.log("trade_demand_cache samples:");
    console.table(demandSamples.rows);

    // Check count in trade_supplier_breakdown
    const supplierCount = await client.query('SELECT COUNT(*), COUNT(DISTINCT reporter_iso3), COUNT(DISTINCT partner_iso3), COUNT(DISTINCT hs_code) FROM trade_supplier_breakdown;');
    console.log("trade_supplier_breakdown:", supplierCount.rows[0]);

    // Check some sample rows from trade_supplier_breakdown
    const supplierSamples = await client.query('SELECT * FROM trade_supplier_breakdown LIMIT 5;');
    console.log("trade_supplier_breakdown samples:");
    console.table(supplierSamples.rows);

    // Check trade_global_aggregates
    const globalCount = await client.query('SELECT COUNT(*), COUNT(DISTINCT reporter_iso3) FROM trade_global_aggregates;');
    console.log("trade_global_aggregates:", globalCount.rows[0]);

    const globalSamples = await client.query('SELECT * FROM trade_global_aggregates WHERE import_value_usd IS NOT NULL LIMIT 5;');
    console.log("trade_global_aggregates (import_value_usd IS NOT NULL) samples:");
    console.table(globalSamples.rows);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkTradeTables();
