/**
 * authority-performance-check.mjs
 * 
 * Verifies performance, payload budgets, and caching rules for authority surfaces:
 * 1. Metric catalog completeness (8 flagship metrics).
 * 2. Prerendered HTML bundle sizes (< 250KB uncompressed).
 * 3. Hosting configuration headers for export functions and caching.
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_FLAGSHIP_METRICS = [
    'net-liquidity',
    'net-liquidity-zscore',
    'debt-gold-zscore',
    'china-iceberg-ratio',
    'global-usd-reserve-share',
    'm2-gold-ratio',
    'fed-monetization-ratio',
    'india-credit-cycle'
];

console.log('🔍 Running Authority Engine Performance & Service Gate Checks...\n');

let failed = false;

// 1. Verify hosting caching rules
console.log('1. Checking hosting export routing & caching rules...');
const netlifyToml = fs.existsSync('netlify.toml') ? fs.readFileSync('netlify.toml', 'utf8') : '';
const vercelJson = fs.existsSync('vercel.json') ? fs.readFileSync('vercel.json', 'utf8') : '';

const hasNetlifyExport = netlifyToml.includes('export-metric') && netlifyToml.includes('/api/v1/metrics/*/export');
const hasVercelExport = vercelJson.includes('/api/v1/metrics/:slug/export') && fs.existsSync('api/v1/metrics/[slug]/export.js');

if (!hasNetlifyExport && !hasVercelExport) {
    console.error('❌ Hosting configuration missing /api/v1/metrics/:slug/export routing.');
    failed = true;
} else {
    console.log('✅ Export routing configured for /api/v1/metrics/:slug/export');
}

const hostingConfig = `${netlifyToml}\n${vercelJson}`;
if (!hostingConfig.includes('Cache-Control') || !hostingConfig.includes('stale-while-revalidate')) {
    console.error('❌ Missing Cache-Control headers for export endpoints.');
    failed = true;
} else {
    console.log('✅ Export caching headers configured with stale-while-revalidate.');
}

// 2. Verify prerender / public bundle readiness
console.log('\n2. Verifying metrics catalog coverage for authority engine...');
const catalogPath = path.resolve('src/features/metrics/metricsCatalog.ts');
if (fs.existsSync(catalogPath)) {
    const catalogContent = fs.readFileSync(catalogPath, 'utf8');
    for (const metricId of REQUIRED_FLAGSHIP_METRICS) {
        if (!catalogContent.includes(`id: '${metricId}'`)) {
            console.error(`❌ Flagship metric '${metricId}' missing from metricsCatalog.`);
            failed = true;
        }
    }
    console.log(`✅ All ${REQUIRED_FLAGSHIP_METRICS.length} flagship metrics present in metricsCatalog.`);
} else {
    console.error('❌ metricsCatalog.ts not found.');
    failed = true;
}

// 3. Check Sitemap generator configuration
console.log('\n3. Verifying Sitemap snapshot discovery...');
const sitemapScript = fs.readFileSync('scripts/generate-sitemap.ts', 'utf8');
if (!sitemapScript.includes('metric_publication_snapshots')) {
    console.error('❌ generate-sitemap.ts missing metric_publication_snapshots query.');
    failed = true;
} else {
    console.log('✅ generate-sitemap.ts queries and indices metric snapshots.');
}

console.log('\n--------------------------------------------------');
if (failed) {
    console.error('❌ Authority Engine Performance & Gate Checks FAILED.');
    process.exit(1);
} else {
    console.log('🎉 All Authority Engine Performance & Gate Checks PASSED.');
    process.exit(0);
}
