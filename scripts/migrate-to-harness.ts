#!/usr/bin/env node
/**
 * migrate-to-harness.ts — codemod: wrap ingest functions in serveIngest().
 *
 * NO EXTERNAL DEPS — pure Node built-ins (path, fs).
 *
 * Handles two patterns:
 *   A) Raw Deno.serve() with try/catch + new Response  (legacy)
 *   B) Deno.serve() + return runIngestion(client, 'name', async (ctx) => …)
 *
 * Skips: already serveIngest; utility skip-list; dynamic job names; non-block
 *        runIngestion callbacks; patterns with intermediate Response exits.
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
  'report-client-error', 'send-daily-brief',
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

function ensureServeIngestImport(src: string, withIngestResult = true): string {
  if (/from\s+['"][^'"]*_shared\/handler\.ts['"]/.test(src)) {
    // Already imports from handler — ensure serveIngest / IngestResult present
    return src.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*_shared\/handler\.ts)['"]\s*;?/,
      (_m, names: string, from: string) => {
        const parts = names.split(',').map((s: string) => s.trim()).filter(Boolean);
        const set = new Set(parts.map((p: string) => p.replace(/^type\s+/, '')));
        if (!set.has('serveIngest')) parts.unshift('serveIngest');
        if (withIngestResult && !set.has('IngestResult')) parts.push('IngestResult');
        return `import { ${parts.join(', ')} } from '${from}';`;
      },
    );
  }

  const importLine = withIngestResult
    ? `import { serveIngest, IngestResult } from '../_shared/handler.ts';\n`
    : `import { serveIngest } from '../_shared/handler.ts';\n`;
  const allImports = [...src.matchAll(/^import[^\n]*\n/gm)];
  const lastImport = allImports[allImports.length - 1];
  if (lastImport?.index !== undefined) {
    const at = lastImport.index + lastImport[0].length;
    return src.slice(0, at) + importLine + src.slice(at);
  }
  return importLine + src;
}

function removeRunIngestionImport(src: string): string {
  // Drop pure runIngestion imports; keep if other symbols from logging remain
  return src
    .replace(
      /^import\s*\{\s*runIngestion\s*(?:,\s*IngestionContext\s*)?\}\s*from\s*['"][^'"]+['"]\s*;?\n/gm,
      '',
    )
    .replace(
      /import\s*\{\s*([^}]*)\s*\}\s*from\s*(['"][^'"]*logging\.ts['"])\s*;?/,
      (_m, names: string, from: string) => {
        const parts = names
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
          .filter((p: string) => !/^runIngestion$/.test(p) && !/^IngestionContext$/.test(p));
        if (parts.length === 0) return '';
        return `import { ${parts.join(', ')} } from ${from};`;
      },
    );
}

/**
 * Rewrite legacy runIngestion result objects into IngestResult.
 * Handles:
 *   return { rows_inserted: X, metadata: Y, ... }
 *   return { rows_inserted: X }
 * Leaves already-ok results alone if they look like IngestResult.
 */
function rewriteJobReturns(body: string): string {
  // Match `return { ... };` at statement level — brace-balanced
  let i = 0;
  let out = '';
  while (i < body.length) {
    const re = /return\s+\{/g;
    re.lastIndex = i;
    const m = re.exec(body);
    if (!m) {
      out += body.slice(i);
      break;
    }
    out += body.slice(i, m.index);
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = findClose(body, openIdx);
    if (closeIdx === -1) {
      out += body.slice(m.index);
      break;
    }
    const objText = body.slice(openIdx, closeIdx + 1);
    // Skip if already IngestResult-shaped
    if (/\bok\s*:/.test(objText)) {
      out += body.slice(m.index, closeIdx + 1);
      i = closeIdx + 1;
      continue;
    }
    // Only rewrite if it looks like a runIngestion result
    if (!/\brows_inserted\s*:/.test(objText) && !/\bmetadata\s*:/.test(objText)) {
      out += body.slice(m.index, closeIdx + 1);
      i = closeIdx + 1;
      continue;
    }

    // Parse top-level keys roughly
    const inner = objText.slice(1, -1);
    let rowsExpr: string | null = null;
    let metaExpr: string | null = null;
    const otherEntries: string[] = [];

    // Split top-level comma-separated props (brace/paren aware)
    const props: string[] = [];
    {
      let depth = 0;
      let start = 0;
      let inStr: string | null = null;
      for (let j = 0; j < inner.length; j++) {
        const c = inner[j];
        if (inStr) {
          if (c === '\\') { j++; continue; }
          if (c === inStr) inStr = null;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
        if (c === '{' || c === '(' || c === '[') depth++;
        else if (c === '}' || c === ')' || c === ']') depth--;
        else if (c === ',' && depth === 0) {
          props.push(inner.slice(start, j));
          start = j + 1;
        }
      }
      props.push(inner.slice(start));
    }

    for (const prop of props) {
      const trimmed = prop.trim();
      if (!trimmed) continue;
      const km = /^([a-zA-Z_$][\w$]*)\s*:\s*([\s\S]+)$/.exec(trimmed);
      if (!km) {
        otherEntries.push(trimmed);
        continue;
      }
      const key = km[1];
      const val = km[2].trim().replace(/,\s*$/, '');
      if (key === 'rows_inserted') rowsExpr = val;
      else if (key === 'metadata') metaExpr = val;
      else otherEntries.push(`${key}: ${val}`);
    }

    const countsPart = rowsExpr != null
      ? `counts: { upserted: ${rowsExpr} }`
      : 'counts: {}';

    let metaPart = '';
    if (metaExpr && otherEntries.length) {
      metaPart = `meta: { ...(${metaExpr}), ${otherEntries.join(', ')} }`;
    } else if (metaExpr) {
      metaPart = `meta: ${metaExpr}`;
    } else if (otherEntries.length) {
      metaPart = `meta: { ${otherEntries.join(', ')} }`;
    }

    const parts = ['ok: true', countsPart];
    if (metaPart) parts.push(metaPart);
    out += `return {\n            ${parts.join(',\n            ')}\n        }`;
    i = closeIdx + 1;
  }
  return out;
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

// ─── pattern A: raw Deno.serve ────────────────────────────────────────────────

function transformRawDenoServe(before: string, fnName: string): TransformResult | null {
  if (!before.includes('Deno.serve(')) return null;
  if (before.includes('runIngestion')) return null; // handled by pattern B

  const serveMatch = /Deno\.serve\s*\(/.exec(before);
  if (!serveMatch) return null;

  const outerParenIdx = serveMatch.index + serveMatch[0].length - 1;
  const outerParenClose = findClose(before, outerParenIdx);
  if (outerParenClose === -1)
    return { fnName, status: 'manual', reason: 'unmatched ( in Deno.serve(...)' };

  const callbackText = before.slice(outerParenIdx + 1, outerParenClose).trimEnd();
  const arrowIdx = callbackText.indexOf('=>');
  if (arrowIdx === -1) return { fnName, status: 'manual', reason: 'no => in callback' };

  const bodyOpenIdx = callbackText.indexOf('{', arrowIdx + 2);
  if (bodyOpenIdx === -1) return { fnName, status: 'manual', reason: 'no { after =>' };

  const bodyCloseIdx = findClose(callbackText, bodyOpenIdx);
  if (bodyCloseIdx === -1) return { fnName, status: 'manual', reason: 'unbalanced callback body {}' };

  const callbackHeader = callbackText.slice(0, bodyOpenIdx);
  let body = callbackText.slice(bodyOpenIdx + 1, bodyCloseIdx);

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

  body = body.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)[^\n]*new Response[^\n]*\n/gm, '',
  );
  body = body.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)\s*\{[^{}]*\}\n?/gms, '',
  );
  body = replaceCatchReturns(body, catchVar);
  body = body.replace(
    /return\s+new\s+Response\s*\((?:[^)(]|\([^)(]*\))*\)\s*;?/gs,
    (m) => /status\s*:\s*[45]\d\d/.test(m) ? m : 'return { ok: true, counts: {} };',
  );

  const bodyUsesReq = /\breq\b/.test(body);
  const newHeader = bodyUsesReq
    ? callbackHeader
    : callbackHeader.replace(/\(\s*req(\s*[:,)])/, '(_req$1');

  const newCallback = `serveIngest('${fnName}', ${newHeader}{\n${body}})`;
  const afterOuter = before.slice(outerParenClose + 1);
  const trailSemi = /^\s*;/.test(afterOuter) ? ';' : '';
  let after =
    before.slice(0, serveMatch.index) +
    newCallback + trailSemi +
    afterOuter.replace(/^\s*;/, '');

  after = ensureServeIngestImport(after, false);
  after = after.replace(/^[ \t]*declare\s+const\s+Deno\s*:\s*any\s*;?\n?/m, '');
  after = removeCorsHeadersIfUnused(after);

  if (before === after)
    return { fnName, status: 'manual', reason: 'no change produced — pattern unrecognised' };

  return { fnName, status: 'transformed', reason: 'raw Deno.serve → serveIngest', before, after };
}

// ─── pattern B: runIngestion wrapper ──────────────────────────────────────────

function transformRunIngestion(before: string, fnName: string): TransformResult | null {
  if (!before.includes('runIngestion')) return null;

  // Locate Deno.serve
  const serveMatch = /Deno\.serve\s*\(/.exec(before);
  if (!serveMatch)
    return { fnName, status: 'manual', reason: 'runIngestion without Deno.serve' };

  const outerParenIdx = serveMatch.index + serveMatch[0].length - 1;
  const outerParenClose = findClose(before, outerParenIdx);
  if (outerParenClose === -1)
    return { fnName, status: 'manual', reason: 'unmatched Deno.serve (' };

  const callbackText = before.slice(outerParenIdx + 1, outerParenClose).trimEnd();
  const arrowIdx = callbackText.indexOf('=>');
  if (arrowIdx === -1) return { fnName, status: 'manual', reason: 'no => in Deno.serve callback' };

  const bodyOpenIdx = callbackText.indexOf('{', arrowIdx + 2);
  if (bodyOpenIdx === -1) return { fnName, status: 'manual', reason: 'no { after =>' };
  const bodyCloseIdx = findClose(callbackText, bodyOpenIdx);
  if (bodyCloseIdx === -1) return { fnName, status: 'manual', reason: 'unbalanced Deno.serve body' };

  let serveBody = callbackText.slice(bodyOpenIdx + 1, bodyCloseIdx);

  // Find return runIngestion( / return await runIngestion(
  const riMatch = /return\s+(?:await\s+)?runIngestion\s*\(/.exec(serveBody);
  if (!riMatch)
    return { fnName, status: 'manual', reason: 'runIngestion not returned from Deno.serve body' };

  const riParenOpen = riMatch.index + riMatch[0].length - 1;
  const riParenClose = findClose(serveBody, riParenOpen);
  if (riParenClose === -1)
    return { fnName, status: 'manual', reason: 'unmatched runIngestion (' };

  const riArgsText = serveBody.slice(riParenOpen + 1, riParenClose);

  // Parse args: client, name, callback [, cors]
  // Find first two commas at depth 0, then callback
  const topCommas: number[] = [];
  {
    let depth = 0;
    let inStr: string | null = null;
    for (let j = 0; j < riArgsText.length; j++) {
      const c = riArgsText[j];
      if (inStr) {
        if (c === '\\') { j++; continue; }
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
      if (c === '(' || c === '{' || c === '[') depth++;
      else if (c === ')' || c === '}' || c === ']') depth--;
      else if (c === ',' && depth === 0) topCommas.push(j);
    }
  }

  if (topCommas.length < 2)
    return { fnName, status: 'manual', reason: 'runIngestion needs ≥3 args' };

  const clientExpr = riArgsText.slice(0, topCommas[0]).trim();
  const nameExpr = riArgsText.slice(topCommas[0] + 1, topCommas[1]).trim();
  const restFromCallback = riArgsText.slice(topCommas[1] + 1).trim();

  // Name must be string literal for mechanical migration
  const nameLit = /^['"]([^'"]+)['"]$/.exec(nameExpr);
  if (!nameLit)
    return { fnName, status: 'manual', reason: `dynamic job name (${nameExpr}) — convert manually` };

  const jobName = nameLit[1];

  // Callback must be inline function with block body
  // Forms: async (ctx) => { ... }  |  async () => { ... }  |  (ctx) => { ... }
  // Not: (ctx) => doIngest(ctx, req)
  const cbHeaderMatch = /^(async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>\s*\{/.exec(restFromCallback);
  if (!cbHeaderMatch) {
    // Expression-body arrow: (ctx) => doSomething(...)
    return {
      fnName, status: 'manual',
      reason: 'runIngestion callback is expression-body (delegate) — convert manually',
    };
  }

  const isAsync = Boolean(cbHeaderMatch[1]);
  const params = cbHeaderMatch[2].trim(); // e.g. "ctx" or "ctx: IngestionContext" or ""
  const cbBodyOpenInRest = cbHeaderMatch[0].length - 1; // points at '{'
  // Absolute index in restFromCallback
  const absOpen = restFromCallback.indexOf('{');
  const absClose = findClose(restFromCallback, absOpen);
  if (absClose === -1)
    return { fnName, status: 'manual', reason: 'unbalanced runIngestion callback body' };

  let jobBody = restFromCallback.slice(absOpen + 1, absClose);

  // Nested runWithRetry as sole return is OK but needs unwrap — mark manual if present
  // as the *return value* of the whole callback without local handling
  if (/return\s+runWithRetry\s*\(/.test(jobBody) && !/if\s*\(\s*!?.*\.ok/.test(jobBody)) {
    // Attempt simple unwrap: replace `return runWithRetry(name, fn, opts)` with await fn()
    // Only if runWithRetry is the last statement-ish
    const rwr = /return\s+runWithRetry\s*\(/.exec(jobBody);
    if (rwr) {
      const rwrOpen = rwr.index + rwr[0].length - 1;
      const rwrClose = findClose(jobBody, rwrOpen);
      if (rwrClose !== -1) {
        const rwrArgs = jobBody.slice(rwrOpen + 1, rwrClose);
        // args: name, fn, opts?
        const rwrCommas: number[] = [];
        {
          let depth = 0; let inStr: string | null = null;
          for (let j = 0; j < rwrArgs.length; j++) {
            const c = rwrArgs[j];
            if (inStr) {
              if (c === '\\') { j++; continue; }
              if (c === inStr) inStr = null;
              continue;
            }
            if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
            if (c === '(' || c === '{' || c === '[') depth++;
            else if (c === ')' || c === '}' || c === ']') depth--;
            else if (c === ',' && depth === 0) rwrCommas.push(j);
          }
        }
        if (rwrCommas.length >= 1) {
          const fnArg = rwrArgs.slice(rwrCommas[0] + 1, rwrCommas[1] ?? rwrArgs.length).trim();
          // fnArg is () => expr or async () => expr or () => { ... }
          jobBody =
            jobBody.slice(0, rwr.index) +
            // serveIngest already retries — call the inner fn once
            `// runWithRetry removed: serveIngest provides retries\n` +
            `        const _legacyResult = await (${fnArg})();\n` +
            `        // unwrap JobResult if present\n` +
            `        const _unwrapped = (_legacyResult && typeof _legacyResult.ok === 'boolean' && 'attempts' in _legacyResult)\n` +
            `          ? (_legacyResult.ok ? _legacyResult.value : (() => { throw new Error(_legacyResult.error ?? 'retry exhausted'); })())\n` +
            `          : _legacyResult;\n` +
            `        return _unwrapped;\n` +
            jobBody.slice(rwrClose + 1);
        }
      }
    }
  }

  // Rewrite ctx.supabase / ctx → client
  const ctxParam = params.split(',')[0]?.trim().split(':')[0]?.trim() || '';
  if (ctxParam) {
    // ctx.supabase → clientExpr
    const reCtxSupabase = new RegExp(`\\b${ctxParam}\\.supabase\\b`, 'g');
    jobBody = jobBody.replace(reCtxSupabase, clientExpr);
    // leftover ctx.functionName / ctx.logId — rare; leave or rewrite
    const reCtx = new RegExp(`\\b${ctxParam}\\.(functionName|logId)\\b`, 'g');
    jobBody = jobBody.replace(reCtx, (_m, prop: string) =>
      prop === 'functionName' ? `'${jobName}'` : 'null',
    );
  }

  // Rewrite return shapes
  jobBody = rewriteJobReturns(jobBody);

  // If body still has bare returns that aren't IngestResult and aren't throw,
  // wrap last non-ok returns that look like data objects is already handled.
  // Ensure every path that returned rows_inserted now has ok:true; if the
  // rewritten body still ends with `return _unwrapped` from runWithRetry path,
  // adapt:
  if (jobBody.includes('return _unwrapped')) {
    jobBody = jobBody.replace(
      /return _unwrapped;/,
      `const _r = _unwrapped;\n` +
      `        if (_r && typeof _r.ok === 'boolean') return _r as IngestResult;\n` +
      `        return {\n` +
      `          ok: true,\n` +
      `          counts: { upserted: _r?.rows_inserted ?? 0 },\n` +
      `          meta: _r?.metadata ?? _r,\n` +
      `        };`,
    );
  }

  // Setup code before runIngestion (minus OPTIONS; convert early Response → throw)
  let setup = serveBody.slice(0, riMatch.index);
  setup = setup.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)[^\n]*\n(?:[ \t]*return\s+new\s+Response[^\n]*\n)?[ \t]*\}?\n?/gm,
    '',
  );
  setup = setup.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)\s*\{[\s\S]*?\}\n?/gm,
    '',
  );
  setup = setup.replace(
    /^[ \t]*if\s*\(\s*req\.method\s*===?\s*['"]OPTIONS['"]\s*\)\s*return\s+new\s+Response[^\n]*\n/gm,
    '',
  );
  // Early auth/config failures that returned HTTP Responses → throw (harness → 500)
  setup = setup.replace(
    /return\s+new\s+Response\s*\(\s*JSON\.stringify\s*\(\s*\{\s*error\s*:\s*([^}]+)\}\s*\)\s*,\s*\{[^}]*status\s*:\s*[45]\d\d[^}]*\}\s*\)\s*;?/g,
    (_m, errExpr: string) => `throw new Error(${errExpr.trim()});`,
  );
  setup = setup.replace(
    /return\s+new\s+Response\s*\((?:[^)(]|\([^)(]*\))*\)\s*;?/g,
    (m) => {
      if (/status\s*:\s*[45]\d\d/.test(m)) {
        return `throw new Error('Request rejected');`;
      }
      return m;
    },
  );

  // Does the combined body use req?
  const combined = setup + jobBody;
  const usesReq = /\breq\b/.test(combined);
  const reqParam = usesReq ? 'req: Request' : '_req: Request';
  const asyncKw = isAsync || /await\s+/.test(combined) ? 'async ' : '';

  const newServe =
    `serveIngest('${jobName}', ${asyncKw}(${reqParam}): Promise<IngestResult> => {\n` +
    setup +
    jobBody +
    `\n})`;

  const afterOuter = before.slice(outerParenClose + 1);
  const trailSemi = /^\s*;/.test(afterOuter) ? ';' : '';
  let after =
    before.slice(0, serveMatch.index) +
    newServe + trailSemi +
    afterOuter.replace(/^\s*;/, '');

  after = removeRunIngestionImport(after);
  after = ensureServeIngestImport(after, true);
  after = after.replace(/^[ \t]*declare\s+const\s+Deno\s*:\s*any\s*;?\n?/m, '');
  after = removeCorsHeadersIfUnused(after);

  // Drop unused IngestionContext type imports leftover
  after = after.replace(
    /^import\s+type\s+\{\s*IngestionContext\s*\}\s+from\s+['"][^'"]+['"]\s*;?\n/gm,
    '',
  );

  if (before === after)
    return { fnName, status: 'manual', reason: 'runIngestion transform produced no change' };

  return {
    fnName,
    status: 'transformed',
    reason: `runIngestion → serveIngest (${jobName})`,
    before,
    after,
  };
}

// ─── core transform ───────────────────────────────────────────────────────────

function transformFile(filePath: string, fnName: string): TransformResult {
  const before = fs.readFileSync(filePath, 'utf-8');

  if (before.includes('serveIngest'))
    return { fnName, status: 'skipped', reason: 'already uses serveIngest' };

  // Prefer runIngestion path when present
  if (before.includes('runIngestion')) {
    const r = transformRunIngestion(before, fnName);
    if (r) return r;
  }

  if (before.includes('Deno.serve(')) {
    const r = transformRawDenoServe(before, fnName);
    if (r) return r;
  }

  return { fnName, status: 'manual', reason: 'no Deno.serve() / runIngestion — utility function' };
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

  if (transformed.length > 0) {
    console.log('\n✅ Transformed:');
    for (const r of transformed) console.log(`  ${r.fnName}: ${r.reason}`);
  }

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
