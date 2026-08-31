import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const functionsDir = path.join(root, 'supabase', 'functions');
const allFunctions = fs.readdirSync(functionsDir).filter((f) => {
  return (
    fs.statSync(path.join(functionsDir, f)).isDirectory() &&
    f !== '_shared' &&
    fs.existsSync(path.join(functionsDir, f, 'index.ts'))
  );
});

// Read all migration files in chronological order
const migrationsDir = path.join(root, 'supabase', 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

// Find cron schedules and unschedules
const cronCalls = new Map();

for (const m of migrationFiles) {
  const content = fs.readFileSync(path.join(migrationsDir, m), 'utf8');

  // Find scheduled functions
  const scheduleMatches = content.matchAll(/functions\/v1\/([a-zA-Z0-9_-]+)/g);
  for (const match of scheduleMatches) {
    const fn = match[1];
    if (!content.includes('unschedule') && !content.includes('cron.unschedule')) {
      cronCalls.set(fn, { active: true, migration: m });
    }
  }

  // Find explicitly unscheduled functions
  const unscheduleMatches = content.matchAll(/cron\.unschedule\([^)]*['"]([a-zA-Z0-9_-]+)['"]/g);
  for (const match of unscheduleMatches) {
    const job = match[1];
    cronCalls.set(job, { active: false, migration: m, reason: 'unscheduled' });
  }

  // Check ILIKE / unschedule blocks
  const ilikeMatches = content.matchAll(/command\s+ILIKE\s+.*\/functions\/v1\/([a-zA-Z0-9_-]+)/gi);
  for (const match of ilikeMatches) {
    const fn = match[1];
    cronCalls.set(fn, { active: false, migration: m, reason: 'unscheduled via pattern' });
  }
}

// Check canonical crons migration: 20260613000000_canonical_crons.sql
const canonicalCrons = fs.readFileSync(path.join(migrationsDir, '20260613000000_canonical_crons.sql'), 'utf8');
const canonicalFns = new Set();
for (const match of canonicalCrons.matchAll(/functions\/v1\/([a-zA-Z0-9_-]+)/g)) {
  canonicalFns.add(match[1]);
}

// Add any newer scheduled crons post 2026-06-13
const postCanonicalFiles = migrationFiles.filter((f) => f > '20260613000000_canonical_crons.sql');
const newlyScheduled = new Set();
const newlyUnscheduled = new Set();

for (const m of postCanonicalFiles) {
  const content = fs.readFileSync(path.join(migrationsDir, m), 'utf8');
  for (const match of content.matchAll(/cron\.schedule\([^,]+,[^,]+,[^,]*functions\/v1\/([a-zA-Z0-9_-]+)/g)) {
    newlyScheduled.add(match[1]);
  }
  for (const match of content.matchAll(/command\s+ILIKE\s+.*\/functions\/v1\/([a-zA-Z0-9_-]+)/gi)) {
    newlyUnscheduled.add(match[1]);
  }
}

const activeInLiveCrons = new Set([...canonicalFns, ...newlyScheduled]);
for (const u of newlyUnscheduled) {
  activeInLiveCrons.delete(u);
}

// Find frontend references
const srcDir = path.join(root, 'src');
function findInSrc(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files.push(...findInSrc(full));
    } else if (/\.(ts|tsx|js|mjs)$/.test(f)) {
      files.push(full);
    }
  }
  return files;
}

const srcFiles = findInSrc(srcDir);
const frontendRefs = new Map();

for (const fn of allFunctions) {
  let count = 0;
  for (const sf of srcFiles) {
    const code = fs.readFileSync(sf, 'utf8');
    if (code.includes(fn)) {
      count++;
    }
  }
  if (count > 0) frontendRefs.set(fn, count);
}

console.log('Total functions in repo directory:', allFunctions.length);

const activeCronsList = [];
const inactiveList = [];
const frontendOnlyList = [];
const ghostList = [];

for (const fn of allFunctions) {
  const isCron = activeInLiveCrons.has(fn);
  const feCount = frontendRefs.get(fn) || 0;

  if (isCron) {
    activeCronsList.push({ fn, feCount });
  } else if (feCount > 0) {
    frontendOnlyList.push({ fn, feCount });
  } else if (cronCalls.has(fn) && !cronCalls.get(fn).active) {
    inactiveList.push({ fn, ...cronCalls.get(fn) });
  } else {
    ghostList.push(fn);
  }
}

console.log(`\n=== 1. Actively Scheduled by pg_cron (${activeCronsList.length}) ===`);
console.log(activeCronsList.map((a) => `• ${a.fn}`).join('\n'));

console.log(`\n=== 2. Frontend / Client Invocation Only (${frontendOnlyList.length}) ===`);
console.log(frontendOnlyList.map((f) => `• ${f.fn} (used in ${f.feCount} frontend files)`).join('\n'));

console.log(`\n=== 3. Explicitly Unscheduled / Deactivated in Migrations (${inactiveList.length}) ===`);
console.log(inactiveList.map((a) => `• ${a.fn} (${a.reason} in ${a.migration})`).join('\n'));

console.log(`\n=== 4. Ghost / Unreferenced Functions (${ghostList.length}) ===`);
console.log(ghostList.map((g) => `• ${g}`).join('\n'));
