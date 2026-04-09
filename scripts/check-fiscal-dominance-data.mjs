import { Client } from 'pg';

const client = new Client({
  host: 'db.debdriyzfcwvgrhzzzre.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '3207f00b0572ddfabc437133df5853b1525b3e7bdfe77d63487803d78590cb05',
  ssl: { rejectUnauthorized: false }
});

async function diagnose() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase DB\n');

    // 1. Check if our metrics exist
    console.log('=== 1. METRICS TABLE ===');
    const { rows: metrics } = await client.query(`
      SELECT id, name, metadata->>'fred_id' as fred_id, tier, category
      FROM metrics
      WHERE id IN ('US_FEDERAL_INTEREST', 'US_MAJOR_ENTITLEMENTS', 'US_TAX_RECEIPTS')
    `);
    console.log(metrics);
    if (metrics.length !== 3) {
      console.log('⚠️  Expected 3 metrics, found:', metrics.length);
    } else {
      console.log('✅ All 3 metric definitions present\n');
    }

    // 2. Check observations count per metric
    console.log('=== 2. OBSERVATIONS COUNT ===');
    const { rows: counts } = await client.query(`
      SELECT metric_id, COUNT(*) as count, MAX(as_of_date) as latest
      FROM metric_observations
      WHERE metric_id IN ('US_FEDERAL_INTEREST', 'US_MAJOR_ENTITLEMENTS', 'US_TAX_RECEIPTS')
      GROUP BY metric_id
    `);
    console.log(counts);

    // 3. Check actual data
    console.log('\n=== 3. SAMPLE OBSERVATIONS (latest 5 per metric) ===');
    for (const metric of ['US_FEDERAL_INTEREST', 'US_MAJOR_ENTITLEMENTS', 'US_TAX_RECEIPTS']) {
      const { rows } = await client.query(
        `SELECT as_of_date, value FROM metric_observations WHERE metric_id = $1 ORDER BY as_of_date DESC LIMIT 5`,
        [metric]
      );
      console.log(`\n${metric}:`, rows);
    }

    // 4. Check if we can compute ratio for latest quarter
    console.log('\n=== 4. LATEST RATIO COMPUTATION ===');
    const { rows: latestCombined } = await client.query(`
      WITH latest AS (
        SELECT metric_id, value, as_of_date,
               ROW_NUMBER() OVER (PARTITION BY metric_id ORDER BY as_of_date DESC) as rn
        FROM metric_observations
        WHERE metric_id IN ('US_FEDERAL_INTEREST', 'US_MAJOR_ENTITLEMENTS', 'US_TAX_RECEIPTS')
      )
      SELECT as_of_date,
             MAX(CASE WHEN metric_id = 'US_FEDERAL_INTEREST' THEN value END) as interest,
             MAX(CASE WHEN metric_id = 'US_MAJOR_ENTITLEMENTS' THEN value END) as entitlements,
             MAX(CASE WHEN metric_id = 'US_TAX_RECEIPTS' THEN value END) as receipts
      FROM latest
      WHERE rn = 1
      GROUP BY as_of_date
    `);
    if (latestCombined.length > 0) {
      const row = latestCombined[0];
      const ratio = ((row.interest + row.entitlements) / row.receipts) * 100;
      console.log(`Date: ${row.as_of_date}`);
      console.log(`Interest: $${row.interest}bn, Entitlements: $${row.entitlements}bn, Receipts: $${row.receipts}bn`);
      console.log(`→ Fiscal Dominance Ratio: ${ratio.toFixed(1)}%${ratio >= 100 ? ' 🔴 CRITICAL' : ' 🟢 Below threshold'}\n`);
    } else {
      console.log('⚠️  No combined data found\n');
    }

    // 5. Check migration status (was the migration file applied?)
    console.log('=== 5. MIGRATION HISTORY ===');
    const { rows: migrations } = await client.query(`
      SELECT version, name, executed_at
      FROM supabase_migrations.schema_migrations
      WHERE name LIKE '%fiscal_dominance%' OR name LIKE '%fred_monetization%'
      ORDER BY version DESC
      LIMIT 5
    `);
    console.log(migrations);

    await client.end();
    console.log('\n✅ Diagnosis complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

diagnose();
