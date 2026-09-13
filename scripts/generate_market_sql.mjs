import fs from 'fs';

const raw = fs.readFileSync('./scratch/institutional_market_observations.json', 'utf8');
const observations = JSON.parse(raw);

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Split into batches of 150
const batches = [];
for (let i = 0; i < observations.length; i += 150) {
  const slice = observations.slice(i, i + 150);
  const values = slice.map(o => 
    `(${escapeSql(o.metric_id)}, ${escapeSql(o.as_of_date)}, ${escapeSql(o.value)}, ${escapeSql(o.last_updated_at)}, ${escapeSql(o.source_ref)}, ${escapeSql(o.provenance)}, ${escapeSql(o.is_provisional)}, ${escapeSql(o.metadata)})`
  ).join(',\n');

  const sql = `INSERT INTO metric_observations (metric_id, as_of_date, value, last_updated_at, source_ref, provenance, is_provisional, metadata)
VALUES
${values}
ON CONFLICT (metric_id, as_of_date) DO UPDATE SET
  value = EXCLUDED.value,
  last_updated_at = EXCLUDED.last_updated_at,
  source_ref = EXCLUDED.source_ref,
  provenance = EXCLUDED.provenance,
  is_provisional = EXCLUDED.is_provisional,
  metadata = EXCLUDED.metadata;`;

  batches.push(sql);
}

fs.writeFileSync('./scratch/market_batches.json', JSON.stringify(batches, null, 2));
console.log(`Generated ${batches.length} SQL batches.`);
