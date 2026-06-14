#!/usr/bin/env node
/**
 * audit-metrics.mjs — three-way reconciliation of metric IDs.
 *
 * Compares:
 *   1. Registry  — src/constants/metricIds.ts (all declared IDs)
 *   2. Live DB   — distinct metric_id values in metric_observations
 *
 * Outputs:
 *   - written_not_declared: DB has rows but ID is not in the registry
 *   - declared_not_written: registry has ID but DB has 0 rows (stub / orphan)
 *   - matched: in both registry and DB
 *
 * Exit codes:
 *   0  — audit complete (report printed to stdout)
 *   1  — env vars missing or DB query failed
 *
 * Required env vars (do NOT commit values):
 *   SUPABASE_URL        — e.g. https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY   — project anon key
 */

import https from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY env vars must be set.');
  console.error('  export SUPABASE_URL=https://<ref>.supabase.co');
  console.error('  export SUPABASE_ANON_KEY=<anon-key>');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 1: Extract registry IDs from src/constants/metricIds.ts
// ---------------------------------------------------------------------------

function extractRegistryIds() {
  const src = readFileSync(join(ROOT, 'src', 'constants', 'metricIds.ts'), 'utf8');
  const ids = new Set();
  // Match all string literal values in `as const` assignments: KEY: 'VALUE',
  const re = /:\s*'([A-Z0-9_]+)'/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    ids.add(m[1]);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Step 2: Query live DB for distinct metric_id values
// ---------------------------------------------------------------------------

function queryDistinctMetricIds() {
  return new Promise((resolve, reject) => {
    // PostgREST: select distinct via group-by trick — use select=metric_id with limit 10000
    const endpoint = `${SUPABASE_URL}/rest/v1/metric_observations?select=metric_id&limit=10000`;
    const req = https.get(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
        // Request distinct values via the Prefer header is not standard;
        // we'll deduplicate in JS instead.
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`DB query failed: HTTP ${res.statusCode}\n${body}`));
          return;
        }
        try {
          const rows = JSON.parse(body);
          const ids = new Set(rows.map((r) => r.metric_id).filter(Boolean));
          resolve(ids);
        } catch (e) {
          reject(new Error(`Failed to parse DB response: ${e.message}\nBody: ${body}`));
        }
      });
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Metric ID Audit ===\n');

  const registryIds = extractRegistryIds();
  console.log(`Registry (src/constants/metricIds.ts): ${registryIds.size} IDs`);

  let dbIds;
  try {
    dbIds = await queryDistinctMetricIds();
    console.log(`Live DB (metric_observations):         ${dbIds.size} distinct metric_id values\n`);
  } catch (err) {
    console.error(`ERROR querying DB: ${err.message}`);
    process.exit(1);
  }

  const matched = [...registryIds].filter((id) => dbIds.has(id));
  const declaredNotWritten = [...registryIds].filter((id) => !dbIds.has(id));
  const writtenNotDeclared = [...dbIds].filter((id) => !registryIds.has(id));

  console.log(`Matched (registry + DB):    ${matched.length}`);
  console.log(`Declared not written (stub/orphan): ${declaredNotWritten.length}`);
  console.log(`Written not declared (missing from registry): ${writtenNotDeclared.length}\n`);

  if (writtenNotDeclared.length > 0) {
    console.log('-- Written not declared (add to metricIds.ts) --');
    for (const id of writtenNotDeclared.sort()) console.log(`  MISSING_IN_REGISTRY  ${id}`);
    console.log();
  }

  if (declaredNotWritten.length > 0) {
    console.log('-- Declared not written (stubs / no ingest yet) --');
    for (const id of declaredNotWritten.sort()) console.log(`  STUB  ${id}`);
    console.log();
  }

  if (writtenNotDeclared.length > 0) {
    console.error(`audit-metrics: ${writtenNotDeclared.length} DB metric(s) missing from registry — add them to src/constants/metricIds.ts`);
    process.exit(1);
  }

  console.log('audit-metrics: PASSED — all DB metrics are declared in the registry.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
