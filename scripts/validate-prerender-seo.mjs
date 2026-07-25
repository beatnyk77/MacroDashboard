import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

// Homepage meta description prefix — non-home routes must not ship this blurb.
const HOMEPAGE_DESC_PREFIX = 'Institutional macro intelligence terminal tracking global liquidity';

// Static pages that must always validate (self-canonical hubs).
// Homepage shell capture is the historical failure mode — never allow bare origin
// on non-home routes.
const CHECKS = [
    { file: 'index.html', label: 'homepage', expectCanonicalIncludes: 'https://graphiquestor.com/', allowHomepageDescription: true },
    { file: 'intel/india/index.html', label: 'intel/india', expectCanonicalIncludes: '/intel/india' },
    { file: 'intel/china/index.html', label: 'intel/china', expectCanonicalIncludes: '/intel/china' },
    { file: 'labs/index.html', label: 'labs index', expectCanonicalIncludes: '/labs' },
    { file: 'blog/index.html', label: 'blog index', expectCanonicalIncludes: '/blog' },
    { file: 'glossary/index.html', label: 'glossary index', expectCanonicalIncludes: '/glossary' },
    // Hub route was live-verified serving homepage shell + homepage canonical — hard-fail that regression.
    { file: 'macro-brief/index.html', label: 'macro-brief hub', expectCanonicalIncludes: '/macro-brief' },
    { file: 'macro-brief/archive/index.html', label: 'macro-brief archive', expectCanonicalIncludes: '/macro-brief/archive' },
    // Conversion / North Star surfaces — unique meta is mandatory
    { file: 'api-docs/index.html', label: 'api-docs', expectCanonicalIncludes: '/api-docs' },
    { file: 'mcp/index.html', label: 'mcp', expectCanonicalIncludes: '/mcp' },
    { file: 'for-researchers/index.html', label: 'for-researchers', expectCanonicalIncludes: '/for-researchers' },
    { file: 'api-access/index.html', label: 'api-access', expectCanonicalIncludes: '/api-access' },
    { file: 'countries/us/index.html', label: 'countries/us', expectCanonicalIncludes: '/countries/us' },
    { file: 'countries/in/index.html', label: 'countries/in', expectCanonicalIncludes: '/countries/in' },
];

// Dynamically add the LATEST dated-content page of each type from the
// generated sitemap. These are the pages the daily rebuild exists to publish —
// if the newest brief/digest/narrative lacks meta tags, the build must fail.
function sitemapPaths() {
    const sitemapFile = path.join(distDir, 'sitemap.xml');
    if (!fs.existsSync(sitemapFile)) {
        console.warn('⚠ dist/sitemap.xml missing — validating static pages only.');
        return [];
    }
    const xml = fs.readFileSync(sitemapFile, 'utf8');
    const paths = [];
    const locRegex = /<loc>https:\/\/graphiquestor\.com([^<]*)<\/loc>/g;
    let m;
    while ((m = locRegex.exec(xml)) !== null) {
        paths.push(m[1] === '' ? '/' : m[1]);
    }
    return paths;
}

function latestMatching(paths, regex, label) {
    const matches = paths.filter(p => regex.test(p)).sort();
    if (matches.length === 0) {
        console.warn(`⚠ No ${label} pages found in sitemap — skipping check.`);
        return null;
    }
    const route = matches[matches.length - 1]; // lexicographic max = latest date
    const rel = route.replace(/^\//, '').replace(/\/$/, '');
    return { file: `${rel}/index.html`, label: `${label} (${route})` };
}

const paths = sitemapPaths();
const DATED_CHECKS = [
    latestMatching(paths, /^\/macro-brief\/\d{4}-\d{2}-\d{2}\/$/, 'macro-brief'),
    latestMatching(paths, /^\/weekly-narrative\/\d{4}-\d{2}-\d{2}\/$/, 'weekly-narrative'),
    latestMatching(paths, /^\/regime-digest\/\d{4}\/\d{2}\/$/, 'regime-digest'),
    latestMatching(paths, /^\/glossary\/[^/]+\/$/, 'glossary term'),
    latestMatching(paths, /^\/blog\/[^/]+\/$/, 'blog article'),
].filter(Boolean);

const ALL_CHECKS = [...CHECKS, ...DATED_CHECKS];

function readHtml(relPath) {
    const full = path.join(distDir, relPath);
    if (!fs.existsSync(full)) {
        throw new Error(`Missing prerendered file: ${relPath}`);
    }
    return fs.readFileSync(full, 'utf8');
}

let failed = 0;

for (const check of ALL_CHECKS) {
    const { file, label, expectCanonicalIncludes, allowHomepageDescription } = check;
    let html;
    try {
        html = readHtml(file);
    } catch (err) {
        console.error(`✗ ${label}: ${err.message}`);
        failed++;
        continue;
    }
    const checks = [
        ['meta name="description"', 'meta description'],
        ['property="og:title"', 'og:title'],
        ['property="og:description"', 'og:description'],
        ['property="og:image"', 'og:image'],
        ['name="twitter:card"', 'twitter:card'],
        ['rel="canonical"', 'canonical link'],
    ];
    for (const [needle, name] of checks) {
        if (!html.includes(needle)) {
            console.error(`✗ ${label}: missing ${name}`);
            failed++;
        }
    }

    // Exactly one canonical per page — index.html ships a static homepage
    // canonical as SPA fallback; prerender.mjs must strip it when a
    // helmet-managed page canonical exists. Two canonicals = crawlers
    // pick unpredictably (often the wrong one).
    const canonicalCount = (html.match(/rel="canonical"/g) ?? []).length;
    if (canonicalCount > 1) {
        console.error(`✗ ${label}: ${canonicalCount} canonical tags (expected 1 — static fallback not stripped)`);
        failed++;
    }

    // Non-home routes must not reuse the sitewide homepage meta description.
    if (!allowHomepageDescription && file !== 'index.html') {
        const descMatch = html.match(/meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i)
            || html.match(/meta\s+content=["']([^"']*)["'][^>]*name=["']description["']/i);
        const desc = descMatch?.[1] ?? '';
        if (!desc) {
            console.error(`✗ ${label}: empty meta description`);
            failed++;
        } else if (desc.startsWith(HOMEPAGE_DESC_PREFIX)) {
            console.error(`✗ ${label}: still has homepage meta description (prerender/Helmet pipeline regression)`);
            failed++;
        }
    }

    if (expectCanonicalIncludes) {
        const canonMatch = html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
            || html.match(/href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
        const canon = canonMatch?.[1] ?? '';
        if (!canon.includes(expectCanonicalIncludes)) {
            console.error(`✗ ${label}: canonical "${canon}" does not include "${expectCanonicalIncludes}"`);
            failed++;
        }
        if (file !== 'index.html' && (canon === 'https://graphiquestor.com/' || canon === 'https://graphiquestor.com')) {
            console.error(`✗ ${label}: homepage canonical on non-home route`);
            failed++;
        }
        // Country pages: never uppercase ISO in canonical
        if (label.startsWith('countries/') && /\/countries\/[A-Z]{2}\//.test(canon)) {
            console.error(`✗ ${label}: uppercase country ISO in canonical "${canon}"`);
            failed++;
        }
    }

    // Any /og/<file>.png referenced by a prerendered page must exist on disk —
    // prerender.mjs rewrites missing ones to the default image, so a leftover
    // dangling reference means that fixup pass broke.
    const ogRefs = [...html.matchAll(/https:\/\/graphiquestor\.com\/og\/([A-Za-z0-9._-]+\.png)/g)];
    for (const [, ogFile] of ogRefs) {
        if (!fs.existsSync(path.join(distDir, 'og', ogFile))) {
            console.error(`✗ ${label}: og:image references missing file /og/${ogFile}`);
            failed++;
        }
    }
}

// Sitemap must not advertise intentional noindex surfaces.
const NOINDEX_SITEMAP_NEEDLES = [
    '/methods/regime-scoring/',
    '/india-equities/',
    '/labs/grit-index/',
];
const sitemapPath = path.join(distDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
    const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    for (const needle of NOINDEX_SITEMAP_NEEDLES) {
        if (sitemapXml.includes(needle) || sitemapXml.includes(needle.replace(/\/$/, ''))) {
            console.error(`✗ sitemap.xml lists noindex path containing "${needle}"`);
            failed++;
        }
    }
    // Country URLs in sitemap must be lowercase
    const upperCountry = sitemapXml.match(/countries\/[A-Z]{2}\//g);
    if (upperCountry?.length) {
        console.error(`✗ sitemap.xml has uppercase country ISO paths: ${upperCountry.slice(0, 5).join(', ')}`);
        failed++;
    }
} else {
    console.warn('⚠ dist/sitemap.xml missing — skipping sitemap noindex checks.');
}

if (failed > 0) {
    console.error(`\nPrerender SEO validation failed (${failed} problems).`);
    process.exit(1);
}

console.log(`✓ Prerender SEO validation passed (${ALL_CHECKS.length} pages).`);
