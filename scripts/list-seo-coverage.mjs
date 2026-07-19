#!/usr/bin/env node
/**
 * list-seo-coverage.mjs — inventory App.tsx routes vs pages that mount SEOManager.
 * Layout already emits layout-mode canonical for every route; this flags pages
 * that never set page-level title/description (rely on layout/default only).
 *
 * Usage: node scripts/list-seo-coverage.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const appSrc = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8');

const routePaths = [...appSrc.matchAll(/trailRoute\('([^']+)'\)/g)].map((m) => m[1]);
const uniqueRoutes = [...new Set(routePaths)].sort();

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (e.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Chart subcomponents / deprecated stubs — not routed; parent *Page.tsx owns SEO. */
const EXCLUDE = [
  /Chart\.tsx$/,
  /\/Dashboard\.tsx$/, // legacy unused
  /\/MacroBrief\.tsx$/, // deprecated stub → MacroBriefPage
  /\/MacroBriefArchive\.tsx$/, // deprecated stub → MacroBriefArchivePage
];

const pages = walk(join(ROOT, 'src/pages'));
const withSeo = [];
const withoutSeo = [];
const excluded = [];
for (const p of pages) {
  const src = readFileSync(p, 'utf8');
  const rel = relative(ROOT, p);
  if (EXCLUDE.some((re) => re.test(rel))) {
    excluded.push(rel);
    continue;
  }
  if (src.includes('SEOManager')) withSeo.push(rel);
  else withoutSeo.push(rel);
}

console.log(`Routes in App.tsx (trailRoute): ${uniqueRoutes.length}`);
console.log(`Routable page components with SEOManager: ${withSeo.length}`);
console.log(`Routable page components without SEOManager: ${withoutSeo.length}`);
console.log(`Excluded chart/stub components: ${excluded.length}`);
if (withoutSeo.length) {
  console.log('\nWithout SEOManager (layout still emits path canonical):');
  withoutSeo.forEach((f) => console.log(`  - ${f}`));
} else {
  console.log('\nAll routable page components mount SEOManager (or are intentionally excluded).');
}
console.log('\nIntentional noindex surfaces:');
console.log('  - ?embed=true (SEOManager + GlobalLayout chromeless)');
console.log('  - AdminDashboard, DataHealthDashboard, ManageSubscription, SubscribeConfirm, OgCardPage, NotFound');
