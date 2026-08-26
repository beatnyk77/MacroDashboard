#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist', 'assets');
const MAX_JS_BYTES = 650 * 1024;
const MAX_CSS_BYTES = 220 * 1024;
const MAX_TOTAL_JS_BYTES = 4800 * 1024;
const MAX_TOTAL_CSS_BYTES = 260 * 1024;

if (!statExists(DIST)) {
  console.error('Bundle budget: dist/assets does not exist. Run vite build first.');
  process.exit(1);
}

const violations = [];
let totalJsBytes = 0;
let totalCssBytes = 0;
for (const file of readdirSync(DIST)) {
  const path = join(DIST, file);
  const bytes = statSync(path).size;
  if (file.endsWith('.js')) totalJsBytes += bytes;
  if (file.endsWith('.css')) totalCssBytes += bytes;
  const limit = file.endsWith('.js') ? MAX_JS_BYTES : file.endsWith('.css') ? MAX_CSS_BYTES : null;
  if (limit !== null && bytes > limit) violations.push(`${file}: ${format(bytes)} > ${format(limit)}`);
}
if (totalJsBytes > MAX_TOTAL_JS_BYTES) violations.push(`total JS: ${format(totalJsBytes)} > ${format(MAX_TOTAL_JS_BYTES)}`);
if (totalCssBytes > MAX_TOTAL_CSS_BYTES) violations.push(`total CSS: ${format(totalCssBytes)} > ${format(MAX_TOTAL_CSS_BYTES)}`);

if (violations.length > 0) {
  console.error('Bundle budget exceeded:\n' + violations.join('\n'));
  process.exit(1);
}

console.log(`Bundle budget passed: per-file JS ≤ ${format(MAX_JS_BYTES)}, per-file CSS ≤ ${format(MAX_CSS_BYTES)}, total JS ≤ ${format(MAX_TOTAL_JS_BYTES)}, total CSS ≤ ${format(MAX_TOTAL_CSS_BYTES)}`);

function statExists(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function format(bytes) {
  return `${(bytes / 1024).toFixed(0)} KiB`;
}
