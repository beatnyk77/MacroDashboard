#!/usr/bin/env node
/**
 * migrate-to-harness.ts — codemod: wrap raw Deno.serve() ingest functions in serveIngest().
 *
 * NO EXTERNAL DEPS — pure Node built-ins (path, fs).
 *
 * Targets:  supabase/functions/{name}/index.ts using Deno.serve() directly.
 * Skips:    already uses serveIngest; uses runIngestion (safe); skip-list.
 * Flags:    >1 new Response in try body, or unrecognised pattern → manual list.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-harness.ts [--dry-run]
 */

import * as path from 'path';
import * as fs from 'fs';

// ─── config ──────────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes('--dry-run');
const ROOT = process.cwd();
const FUNCTIONS_DIR = path.join(ROOT, 'supabase', 'functions');

/** Utility / non-ingest functions — never wrap in serveIngest. */
const SKIP_NAMES = new Set([
  'api-auth-middleware', 'check-data-health', 'debug-logs',
  'send-confirm-email', 'send-weekly-digest', 'get-newsletter-data',
  'llm-knowledge', 'gsc-sync', 'execute-restoration-sql',
]);

// ─── types ────────────────────────────────────────────────────────────────────

interface TransformResult {
  fnName: string;
  status: 'transformed' | 'skipped' | 'manual';
  reason: string;
  before?: string;
  after?: string;
}

// ─── bracket counter ─────────────────────────────────────────────────────────

/**
 * Given src[openIdx] is '(' '{' or '[', return the index of its matching close.
 * Skips string literals and comments to avoid false matches.
 */
function findClose(src: string, openIdx: number): number {
  const open = src[openIdx];
  const close = open === '(' ? ')' : open === '{' ? '}' : open === '[' ? ']' : '';
  if (!close) return -1;
  let depth = 1;
  let i = openIdx + 1;

  while (i < src.length && depth > 0) {
    const ch = src[i];
    // String literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch; i++;
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    // Line comment
    if (ch === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    // Block comment
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length - 1 && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2; continue;
    }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Count `return new Response(` in tryBody, ignoring nested catch blocks. */
function countResponseReturns(tryBody: string): number {
  const stripped = tryBody.replace(/}\s*catch\s*\([^)]*\)\s*\{[^]*?\}/gs, '');
  return (stripped.match(/return\s+new\s+Response\s*\(/g) || []).length;
}

/**
 * In each catch clause body: replace `return new Response(...)` → `throw catchVar;`
 */
function replaceCatchReturns(body: string, catchVar: string): string {
  const catchPattern = /}\s*catch\s*\([^)]*\)\s*\{/g;
  let result = body;
  let offset = 0;

  for (const m of body.matchAll(catchPattern)) {
    if (m.index === undefined) continue;
    const openBraceIdx = m.index + m[0].lastIndexOf('{');
    const closeIdx = findClose(body, openBraceIdx);
    if (closeIdx === -1) continue;

    const catchBody = body.slice(openBraceIdx + 1, closeIdx);
    const newCatchBody = catchBody.replace(
      /^([ \t]*)return\s+new\s+Response\s*\((?:[^)(]|\([^)(]*\))*\)\s*;?[ \t]*/gms,
      (_m2: string, indent: string) => `${indent}throw ${catchVar};\n`,
    );

    if (catchBody !== newCatchBody) {
      result =
        result.slice(0, openBraceIdx + 1 + offset) +
        newCatchBody +
        result.slice(closeIdx + offset);
      offset += newCatchBody.length - catchBody.length;
    }
  }
  return result;
}

/** Remove corsHeaders const if it has ≤1 reference left in the file. */
function removeCorsHeadersIfUnused(src: string): string {
  const declMatch = src.match(
    /^[ \t]*(?:const|let)\s+cors(?:H|h)eaders\s*(?::[^=]*)?\s*=\s*\{[^]*?\};?\n?/m,
  );
  if (!declMatch || declMatch.index === undefined) return src;
  const total = (src.match(/cors(?:H|h)eaders/g) || []).length;
  if (total <= 1) {
    return src.slice(0, declMatch.index) + src.slice(declMatch.index + declMatch[0].length);
  }
  return src;
}

function miniDiff(before: string, after: string): string {
  const b = before.split('\n'), a = after.split('\n');
  const out: string[] = [];
  const max = Math.max(b.length, a.length);
  let lastOut = -1;
  for (let i = 0; i < max; i++) {
    const bl = b[i] ?? '', al = a[i] ?? '';
    if (bl !== al) {
      if (lastOut < i - 1) out.push(`@@ ~line ${i + 1} @@`);
      if (bl) out.push(`- ${bl}`);
      if (al) out.push(`+ ${al}`);
      lastOut = i;
    }
  }
  return out.slice(0, 120).join('\n');
}

// ─── core transform ───────────────────────────────────────────────────────────

function transformFile(filePath: string, fnName: string): TransformResult {
  const before = fs.readFileSync(filePath, 'utf-8');

  // Pre-flight checks
  if (before.includes('serveIngest'))
    return { fnName, status: 'skipped', reason: 'already uses serveIngest' };
  if (before.includes('runIngestion'))
    return { fnName, status: 'skipped', reason: 'uses runIngestion — error handling correct' };
  if (!before.includes('Deno.serve('))
    return { fnName, status: 'manual', reason: 'no Deno.serve() — utility function' };

  // Locate Deno.serve(
  const serveMatch = /Deno\.serve\s*\(/.exec(before);
  if (!serveMatch) return { fnName, status: 'manual', reason: 'Deno.serve regex miss' };

  const outerParenIdx = serveMatch.index + serveMatch[0].length - 1;
  const outerParenClose = findClose(before, outerParenIdx);
  if (outerParenClose === -1)
    return { fnName, status: 'manual', reason: 'unmatched ( in Deno.serve(...)' };

  const callbackText = before.slice(outerParenIdx + 1, outerParenClose).trimEnd();

  // Find => then the opening { of the body
  const arrowIdx = callbackText.indexOf('=>');
  if (arrowIdx === -1) return { fnName, status: 'manual', reason: 'no => in callback' };

  const bodyOpenIdx = callbackText.indexOf('{', arrowIdx + 2);
  if (bodyOpenIdx === -1) return { fnName, status: 'manual', reason: 'no { after =>' };

  const bodyCloseIdx = findClose(callbackText, bodyOpenIdx);
  if (bodyCloseIdx === -1) return { fnName, status: 'manual', reason: 'unbalanced callback body {}' };

  const callbackHeader = callbackText.slice(0, bodyOpenIdx);
  let body = callbackText.slice(bodyOpenIdx + 1, bodyCloseIdx);

  // Complexity check: count Response returns in try block (not in catch)
  let catchVar = 'err';
  const tryMatch = /\btry\s*\{/.exec(body);
  if (tryMatch) {
    const tryBraceIdx = body.indexOf('{', tryMatch.index + tryMatch[0].length - 1);
    const tryCloseIdx = findClose(body, tryBraceIdx);
    if (tryCloseIdx === -1) return { fnName, status: 'manual', reason: 'unbalanced try {}' };

    const tryBody = body.slice(tryBraceIdx + 1, tryCloseIdx);
    const count = countResponseReturns(tryBody);
    if (count > 1) {
      return {
        fnName, status: 'manual',
        reason: `${count} Response returns in try block — intermediate exits need manual conversion`,
      };
    }
    const catchHeader = /}\s*catch\s*\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?::[^)]+)?\)/.exec(body);
    if (catchHeader) catchVar = catchHeader[1];
  }

  // ── Apply transforms ─────────────────────────────────────────────────────

  // 1. Remove CORS preflight (single-line)
  body = body.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)[^\n]*new Response[^\n]*\n/gm, '',
  );
  // 1b. Remove CORS preflight (block)
  body = body.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)\s*\{[^{}]*\}\n?/gms, '',
  );

  // 2. In catch blocks: return new Response(...) → throw catchVar
  body = replaceCatchReturns(body, catchVar);

  // 3. Remaining success returns → { ok: true, counts: {} }
  //    (skip explicit 4xx/5xx responses — those are intentional)
  body = body.replace(
    /return\s+new\s+Response\s*\((?:[^)(]|\([^)(]*\))*\)\s*;?/gs,
    (m) => /status\s*:\s*[45]\d\d/.test(m) ? m : 'return { ok: true, counts: {} };',
  );

  // 4. Keep req as-is if the body still references it; only use _req if truly unused.
  const bodyUsesReq = /\breq\b/.test(body);
  const newHeader = bodyUsesReq
    ? callbackHeader
    : callbackHeader.replace(/\(\s*req(\s*[:,)])/, '(_req$1');

  // ── Reassemble ───────────────────────────────────────────────────────────
  const newCallback = `serveIngest('${fnName}', ${newHeader}{\n${body}})`;
  const afterOuter = before.slice(outerParenClose + 1);
  const trailSemi = /^\s*;/.test(afterOuter) ? ';' : '';
  let after =
    before.slice(0, serveMatch.index) +
    newCallback + trailSemi +
    afterOuter.replace(/^\s*;/, '');

  // 5. Add serveIngest import after last existing import
  const importLine = `import { serveIngest } from '../_shared/handler.ts';\n`;
  const allImports = [...after.matchAll(/^import[^\n]*\n/gm)];
  const lastImport = allImports[allImports.length - 1];
  if (lastImport?.index !== undefined) {
    const at = lastImport.index + lastImport[0].length;
    after = after.slice(0, at) + importLine + after.slice(at);
  } else {
    after = importLine + after;
  }

  // 6. Remove declare const Deno: any
  after = after.replace(/^[ \t]*declare\s+const\s+Deno\s*:\s*any\s*;?\n?/m, '');

  // 7. Remove corsHeaders const if now unused
  after = removeCorsHeadersIfUnused(after);

  if (before === after)
    return { fnName, status: 'manual', reason: 'no change produced — pattern unrecognised' };

  return { fnName, status: 'transformed', reason: 'ok', before, after };
}

// ─── main ─────────────────────────────────────────────────────────────────────

function getFunctionDirs(): string[] {
  return fs
    .readdirSync(FUNCTIONS_DIR)
    .filter(n => !n.startsWith('_') && !n.includes('.'))
    .filter(n => fs.existsSync(path.join(FUNCTIONS_DIR, n, 'index.ts')));
}

function main() {
  console.log(`\n🔧 migrate-to-harness${isDryRun ? ' (DRY RUN — no files written)' : ''}\n`);
  const fnNames = getFunctionDirs();
  console.log(`Found ${fnNames.length} function directories\n`);

  const results: TransformResult[] = [];

  for (const fnName of fnNames) {
    if (SKIP_NAMES.has(fnName)) {
      results.push({ fnName, status: 'skipped', reason: 'utility function (skip-list)' });
      continue;
    }
    const filePath = path.join(FUNCTIONS_DIR, fnName, 'index.ts');
    const r = transformFile(filePath, fnName);
    results.push(r);

    if (r.status === 'transformed' && !isDryRun && r.after) {
      fs.writeFileSync(filePath, r.after, 'utf-8');
    }
  }

  const transformed = results.filter(r => r.status === 'transformed');
  const skipped = results.filter(r => r.status === 'skipped');
  const manual = results.filter(r => r.status === 'manual');

  console.log('─'.repeat(70));
  console.log(`Files transformed : ${transformed.length}`);
  console.log(`Files skipped     : ${skipped.length}`);
  console.log(`Needs manual work : ${manual.length}`);
  console.log('─'.repeat(70));

  if (manual.length > 0) {
    console.log('\n⚠️  Needs manual review:');
    for (const r of manual) console.log(`  ${r.fnName}: ${r.reason}`);
  }

  if (isDryRun && transformed.length > 0) {
    console.log('\n📋 Sample diffs (first 3 transformed):\n');
    for (const r of transformed.slice(0, 3)) {
      console.log(`${'='.repeat(70)}\nFUNCTION: ${r.fnName}\n${'='.repeat(70)}`);
      console.log(miniDiff(r.before!, r.after!));
      console.log();
    }
    if (transformed.length > 3)
      console.log(`... and ${transformed.length - 3} more would also be transformed\n`);
  }

  if (!isDryRun && transformed.length > 0) {
    console.log(`\n✅ ${transformed.length} files written.`);
    console.log('Run: node scripts/ci-guards.mjs && npm run lint && npm run build\n');
  }
}

main();
