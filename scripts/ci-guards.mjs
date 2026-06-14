#!/usr/bin/env node
/**
 * ci-guards.mjs — CI pattern guards freezing the audited anti-pattern classes.
 *
 * GUARD A (blocking): swallow-and-return-200 in edge functions.
 *   In supabase/functions/** /index.ts, catch blocks that return a Response
 *   with explicit `status: 200` or with no `status` property (defaults to 200).
 *
 * GUARD B (blocking): unsafe vault concatenation in migrations.
 *   In supabase/migrations/**.sql, `decrypted_secret` or `current_setting('vault.`
 *   string-concatenated (`||`) into a `::json` / `::jsonb` cast.
 *
 * GUARD C (blocking): raw metric_id string literals in src/hooks/**
 *   (`.eq('metric_id', '...')` / `.in('metric_id', ['...'])`).
 *   All call sites must use METRIC_IDS registry constants, not raw strings.
 *
 * Existing violations live in scripts/ci-guards-allowlist.json (burn-down file).
 * The script fails (exit 1) only on violations NOT in the allowlist.
 *
 * Usage:
 *   node scripts/ci-guards.mjs                     # scan, fail on new violations
 *   node scripts/ci-guards.mjs --update-allowlist  # rewrite allowlist from current scan
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const ALLOWLIST_PATH = join(ROOT, 'scripts', 'ci-guards-allowlist.json');
const UPDATE_MODE = process.argv.includes('--update-allowlist');

// ---------------------------------------------------------------------------
// FS helpers
// ---------------------------------------------------------------------------

function walk(dir, predicate, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue;
      walk(full, predicate, results);
    } else if (predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

function rel(p) {
  return relative(ROOT, p).split(sep).join('/');
}

// ---------------------------------------------------------------------------
// GUARD A — swallow-and-return-200 in edge function catch blocks
// ---------------------------------------------------------------------------

/** Find the index of the matching closing brace/paren for the opener at `openIdx`. */
function findMatching(src, openIdx, open, close) {
  let depth = 0;
  let inString = null; // ', ", or ` while inside a string/template
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    const prev = src[i - 1];
    if (inString) {
      if (ch === inString && prev !== '\\') inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = ch; continue; }
    // Skip line comments
    if (ch === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    // Skip block comments
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function lineOf(src, idx) {
  return src.slice(0, idx).split('\n').length;
}

/**
 * Scan one edge-function index.ts for catch blocks whose body constructs a
 * Response with explicit `status: 200` or no `status` property at all.
 */
function scanGuardA(file) {
  const src = readFileSync(file, 'utf8');
  const violations = [];
  const catchRe = /\bcatch\b/g;
  let m;
  while ((m = catchRe.exec(src)) !== null) {
    // Skip promise `.catch(` — only block-form catches are scanned.
    let before = m.index - 1;
    while (before >= 0 && /\s/.test(src[before])) before--;
    if (src[before] === '.') continue;

    // Locate the catch block's opening brace: `catch (e) {` or `catch {`.
    let cursor = m.index + 'catch'.length;
    while (cursor < src.length && /\s/.test(src[cursor])) cursor++;
    if (src[cursor] === '(') {
      const closeParen = findMatching(src, cursor, '(', ')');
      if (closeParen === -1) continue;
      cursor = closeParen + 1;
      while (cursor < src.length && /\s/.test(src[cursor])) cursor++;
    }
    if (src[cursor] !== '{') continue;
    const blockEnd = findMatching(src, cursor, '{', '}');
    if (blockEnd === -1) continue;
    const body = src.slice(cursor + 1, blockEnd);

    // Find every `new Response(` inside the catch body and inspect its args.
    const respRe = /new\s+Response\s*\(/g;
    let r;
    while ((r = respRe.exec(body)) !== null) {
      const openParen = r.index + r[0].length - 1;
      const closeParen = findMatching(body, openParen, '(', ')');
      const callText = closeParen === -1
        ? body.slice(openParen)
        : body.slice(openParen, closeParen + 1);

      const hasStatus = /\bstatus\s*:/.test(callText);
      const isExplicit200 = /\bstatus\s*:\s*200\b/.test(callText);
      const isErrorStatus = /\bstatus\s*:\s*[45]\d\d\b/.test(callText);

      if (isExplicit200 || (!hasStatus && !isErrorStatus)) {
        const line = lineOf(src, cursor + 1 + r.index);
        violations.push({
          guard: 'A',
          file: rel(file),
          line,
          detail: isExplicit200
            ? 'catch block returns Response with explicit status: 200'
            : 'catch block returns Response with no status (defaults to 200)',
        });
      }
    }
  }
  // Dedupe to one entry per file (allowlist is file-granular); keep first line for the report.
  return violations;
}

// ---------------------------------------------------------------------------
// GUARD B — vault secret concatenated into a ::json / ::jsonb cast
// ---------------------------------------------------------------------------

const VAULT_RE = /decrypted_secret|current_setting\(\s*'vault\./i;

/**
 * Build `||`-continuation chains: a line joins the chain when the previous
 * line ends with `||`, the line itself starts with `||`, or the line starts
 * with `)` (closing the parenthesized concatenation group, e.g. `)::jsonb`).
 * A chain that contains vault access AND a ::json(b) cast is an unsafe
 * concatenation. jsonb_build_object-style usage forms no chain that reaches
 * a cast and stays clean — that is the safe replacement pattern.
 */
function scanGuardB(file) {
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split('\n').map((l) => l.replace(/--.*$/, ''));
  const violations = [];

  let chain = [];
  let chainStart = 0;

  const flush = () => {
    if (chain.length === 0) return;
    const text = chain.join('\n');
    if (VAULT_RE.test(text) && text.includes('||') && /::jsonb?\b/i.test(text)) {
      violations.push({
        guard: 'B',
        file: rel(file),
        line: chainStart + 1,
        detail: 'vault secret string-concatenated into ::json/::jsonb cast',
      });
    }
    chain = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const continuesPrev = chain.length > 0 &&
      (lines[i - 1].trim().endsWith('||') ||
       trimmed.startsWith('||') ||
       trimmed.startsWith(')'));
    if (!continuesPrev) {
      flush();
      chainStart = i;
    }
    chain.push(line);
  }
  flush();
  return violations;
}

// ---------------------------------------------------------------------------
// GUARD C — raw metric_id literals in hooks (warn-only)
// ---------------------------------------------------------------------------

function scanGuardC(file) {
  const src = readFileSync(file, 'utf8');
  const findings = [];
  const patterns = [
    // .eq('metric_id', '<literal>') — value is a raw string
    /\.eq\(\s*['"]metric_id['"]\s*,\s*['"]/g,
    // .in('metric_id', ['<literal>',  ...]) — first array element is a raw string
    /\.in\(\s*['"]metric_id['"]\s*,\s*\[\s*['"]/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src)) !== null) {
      findings.push({
        guard: 'C',
        file: rel(file),
        line: lineOf(src, m.index),
        detail: 'raw metric_id string literal in hook query — use METRIC_IDS registry',
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

const edgeIndexFiles = walk(
  join(ROOT, 'supabase', 'functions'),
  (f) => f.endsWith(`${sep}index.ts`),
);
const migrationFiles = walk(
  join(ROOT, 'supabase', 'migrations'),
  (f) => f.endsWith('.sql'),
);
const hookFiles = walk(
  join(ROOT, 'src', 'hooks'),
  (f) => /\.(ts|tsx)$/.test(f),
);

const guardAViolations = edgeIndexFiles.flatMap(scanGuardA);
const guardBViolations = migrationFiles.flatMap(scanGuardB);
const guardCViolations = hookFiles.flatMap(scanGuardC);

// Allowlist keys are file-granular: "<GUARD>:<path>"
const keyOf = (v) => `${v.guard}:${v.file}`;
const blockingViolations = [...guardAViolations, ...guardBViolations, ...guardCViolations];
const currentKeys = [...new Set(blockingViolations.map(keyOf))].sort();

// ---------------------------------------------------------------------------
// Allowlist handling
// ---------------------------------------------------------------------------

if (UPDATE_MODE) {
  const payload = {
    _README: [
      'BURN-DOWN FILE — entries may only be REMOVED, never added.',
      'New violations must be fixed, not allowlisted.',
      'Format: "<GUARD-LETTER>:<repo-relative path>".',
      'Guard A = swallow-and-return-200 in edge function catch blocks.',
      'Guard B = vault secret concatenated into ::json/::jsonb cast in migrations.',
      'Regenerate (maintenance only): node scripts/ci-guards.mjs --update-allowlist',
    ],
    violations: currentKeys,
  };
  writeFileSync(ALLOWLIST_PATH, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Allowlist updated: ${currentKeys.length} entries written to ${rel(ALLOWLIST_PATH)}`);
  process.exit(0);
}

let allowlist = [];
if (existsSync(ALLOWLIST_PATH)) {
  allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')).violations ?? [];
}
const allowSet = new Set(allowlist);

const newViolations = blockingViolations.filter((v) => !allowSet.has(keyOf(v)));
const staleEntries = allowlist.filter((k) => !currentKeys.includes(k));

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('=== CI Pattern Guards ===');
console.log(`Scanned: ${edgeIndexFiles.length} edge function index.ts, ${migrationFiles.length} migrations, ${hookFiles.length} hook files`);
console.log(`Guard A (swallow-200):        ${guardAViolations.length} occurrence(s) in ${new Set(guardAViolations.map((v) => v.file)).size} file(s)`);
console.log(`Guard B (vault ::json cast):  ${guardBViolations.length} occurrence(s) in ${new Set(guardBViolations.map((v) => v.file)).size} file(s)`);
console.log(`Guard C (raw metric_id str):  ${guardCViolations.length} occurrence(s) in ${new Set(guardCViolations.map((v) => v.file)).size} hook file(s)`);

if (staleEntries.length > 0) {
  console.log('\n-- Stale allowlist entries (violation fixed — remove from allowlist) --');
  for (const k of staleEntries) console.log(`  STALE ${k}`);
}

if (newViolations.length > 0) {
  console.error('\n-- NEW violations (not in allowlist) — fix these, do NOT allowlist them --');
  for (const v of newViolations) {
    console.error(`  FAIL  ${v.guard}  ${v.file}:${v.line}  ${v.detail}`);
  }
  console.error(`\nci-guards: FAILED — ${newViolations.length} new violation(s).`);
  process.exit(1);
}

console.log('\nci-guards: PASSED (all blocking violations are in the burn-down allowlist).');
process.exit(0);
