import puppeteer from 'puppeteer';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read sitemap and RSS to get initial seed routes
const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
let sitemap = '';
try {
    sitemap = fs.readFileSync(sitemapPath, 'utf8');
} catch (e) {
    console.error('Could not read sitemap.xml', e);
    process.exit(1);
}

function withoutTrailingSlash(route) {
    if (!route || route === '/') return '/';
    const pathname = route.split(/[?#]/)[0].replace(/\/+$/, '');
    return pathname || '/';
}

function normalizeVisitedRoute(route) {
    const clean = route.split('#')[0].split('?')[0];
    if (clean === '/') return '/';
    return clean.endsWith('/') ? clean : `${clean}/`;
}

function sitemapLoc(route) {
    const base = withoutTrailingSlash(route);
    if (base === '/') return 'https://graphiquestor.com/';
    return `https://graphiquestor.com${base}/`;
}

const urlRegex = /<loc>https:\/\/graphiquestor\.com([^<]+)<\/loc>/g;
const seedRoutes = new Set();
let match;
while ((match = urlRegex.exec(sitemap)) !== null) {
    seedRoutes.add(normalizeVisitedRoute(match[1] === '' ? '/' : match[1]));
}

/** slug → YYYY-MM-DD from RSS pubDate for blog article lastmod */
const BLOG_LASTMOD = new Map();

function parseBlogLastmodFromRss(rss) {
    const itemRegex = /<item>[\s\S]*?<link>https:\/\/graphiquestor\.com\/blog\/([^<]+)<\/link>[\s\S]*?<pubDate>([^<]+)<\/pubDate>/g;
    let m;
    while ((m = itemRegex.exec(rss)) !== null) {
        const slug = m[1];
        const pubDate = new Date(m[2]);
        if (!Number.isNaN(pubDate.getTime())) {
            BLOG_LASTMOD.set(slug, pubDate.toISOString().split('T')[0]);
        }
    }
}

const rssPath = path.resolve(__dirname, '../public/rss.xml');
if (fs.existsSync(rssPath)) {
    const rss = fs.readFileSync(rssPath, 'utf8');
    parseBlogLastmodFromRss(rss);
    const rssRegex = /<link>https:\/\/graphiquestor\.com([^<]+)<\/link>/g;
    while ((match = rssRegex.exec(rss)) !== null) {
        if (match[1] !== '') {
            seedRoutes.add(normalizeVisitedRoute(match[1]));
        }
    }
}

const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
    console.error('dist directory not found. Run `npm run build` first.');
    process.exit(1);
}

const app = express();
app.use(express.static(distDir));
// fallback for SPA routing
app.use((req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
});

// Routes to completely ignore from crawling and sitemap
// /og-card is the internal 1200×630 social-card render target (screenshotted below)
const ignorePrefixes = ['/admin', '/api', '/og-card', '/subscribe'];

function isRoutable(href) {
    if (!href) return false;
    if (!href.startsWith('/')) return false; // Ignore external, mailto, etc.
    if (href.startsWith('//')) return false; // Protocol-relative URLs
    if (ignorePrefixes.some(prefix => href.startsWith(prefix))) return false;
    
    // Ignore static files
    const ext = path.extname(href.split('?')[0]);
    if (ext && ext !== '.html') return false; 
    
    return true;
}

// Routes whose content is entirely static (editorial/docs).
// lastmod = date of last git commit touching the owning component file.
// All other routes either carry their date in the URL (content pages) or
// refresh daily via cron jobs (live-data pages → build date is honest).
const STATIC_PAGE_FILES = {
    '/about':                             'src/pages/About.tsx',
    '/terms':                             'src/pages/TermsOfService.tsx',
    '/privacy':                           'src/pages/PrivacyPolicy.tsx',
    '/glossary':                          'src/pages/GlossaryIndexPage.tsx',
    '/methodology':                       'src/pages/MetricsMethodologyPage.tsx',
    '/api-docs':                          'src/pages/APIDocsPage.tsx',
    '/api-access':                        'src/pages/APIAccessPage.tsx',
    '/labs':                              'src/pages/labs/ThematicLabsIndexPage.tsx',
    '/macro-brief/archive':               'src/pages/MacroBriefArchivePage.tsx',
    '/blog':                              'src/pages/BlogPage.tsx',
    '/methods/net-liquidity-z-score':     'src/pages/methods/NetLiquidityZScorePage.tsx',
    '/methods/debt-gold-z-score':         'src/pages/methods/DebtGoldZScorePage.tsx',
    '/methods/loan-to-job-efficiency':    'src/pages/methods/LoanToJobEfficiencyPage.tsx',
    '/methods/energy-dependency-ratio':   'src/pages/methods/EnergyDependencyRatioPage.tsx',
    '/methods/fiscal-dominance-meter':    'src/pages/methods/FiscalDominanceMeterPage.tsx',
    '/methods/m2-gold-ratio':             'src/pages/methods/M2GoldRatioPage.tsx',
    '/methods/de-dollarization-guide':    'src/pages/methods/DeDollarizationGuide.tsx',
    '/methods/fed-monetization-monitor':  'src/pages/methods/FedMonetizationPage.tsx',
    '/methods/india-credit-cycle-clock':  'src/pages/methods/IndiaCreditCyclePage.tsx',
    '/methods/china-debt-iceberg':        'src/pages/methods/ChinaDebtIcebergPage.tsx',
    '/tools':                             'src/pages/tools/ToolsIndexPage.tsx',
};

/** Run git log for one file; return YYYY-MM-DD or fall back to build date. */
function gitLastmod(file) {
    try {
        const iso = execSync(`git log -1 --format=%cI -- ${file}`, { encoding: 'utf8' }).trim();
        if (iso) return iso.split('T')[0];
    } catch {
        // git unavailable in this environment
    }
    return BUILD_DATE;
}

/**
 * Per-route lastmod strategy:
 *  1. Dated-content URLs  (/macro-brief/YYYY-MM-DD, /weekly-narrative/YYYY-MM-DD,
 *     /regime-digest/YYYY/MM, /blog/:slug)  → publish date from path or RSS.
 *  2. Static/editorial pages → git log date of owning component file.
 *  3. Live-data pages (intel, trade, countries, labs/*) → build date (crons refresh daily).
 *  4. Unknown/new pages → build date (fallback only).
 */
function routeLastmod(route) {
    const path = withoutTrailingSlash(route);
    // 1a. Morning brief: /macro-brief/YYYY-MM-DD
    const briefMatch = path.match(/^\/macro-brief\/(\d{4}-\d{2}-\d{2})$/);
    if (briefMatch) return briefMatch[1];

    // 1b. Weekly narrative: /weekly-narrative/YYYY-MM-DD
    const briefSlashMatch = path.match(/^\/macro-brief\/(\d{4})\/(\d{2})\/(\d{2})$/);
    if (briefSlashMatch) return `${briefSlashMatch[1]}-${briefSlashMatch[2]}-${briefSlashMatch[3]}`;

    const narrativeMatch = path.match(/^\/weekly-narrative\/(\d{4}-\d{2}-\d{2})$/);
    if (narrativeMatch) return narrativeMatch[1];

    // 1c. Regime digest: /regime-digest/YYYY/MM
    const digestMatch = path.match(/^\/regime-digest\/(\d{4})\/(\d{2})$/);
    if (digestMatch) return `${digestMatch[1]}-${digestMatch[2]}-01`;

    // 1d. Blog article: /blog/:slug — publish date from RSS feed
    const blogMatch = path.match(/^\/blog\/([^/]+)$/);
    if (blogMatch && BLOG_LASTMOD.has(blogMatch[1])) {
        return BLOG_LASTMOD.get(blogMatch[1]);
    }

    // 2. Static page with a known source file
    if (STATIC_PAGE_FILES[path]) return gitLastmod(STATIC_PAGE_FILES[path]);

    // 3. Live-data page — build date is the honest lastmod
    return BUILD_DATE;
}

const BUILD_DATE = new Date().toISOString().split('T')[0];

// ── IndexNow ────────────────────────────────────────────────────────────────
// After each build, ping IndexNow (Bing/Seznam/Yandex) with dated-content URLs
// published in the last 2 days, so daily briefs/digests are indexed within
// hours of the cron-triggered rebuild. Google ignores IndexNow — it relies on
// sitemap lastmod, which generateSitemap already keeps honest.
// Requires INDEXNOW_KEY env var (any 8-128 char hex/alphanumeric string);
// silently skipped when unset (e.g. local builds, deploy previews).

/** Only dated-content routes — live-data pages carry BUILD_DATE as lastmod
 *  and would flood IndexNow with hundreds of unchanged URLs every build. */
function isDatedContentRoute(route) {
    const p = withoutTrailingSlash(route);
    return (
        /^\/macro-brief\/\d{4}-\d{2}-\d{2}$/.test(p) ||
        /^\/weekly-narrative\/\d{4}-\d{2}-\d{2}$/.test(p) ||
        /^\/regime-digest\/\d{4}\/\d{2}$/.test(p) ||
        /^\/blog\/[^/]+$/.test(p)
    );
}

// ── OG social cards ─────────────────────────────────────────────────────────
// Screenshot /og-card/:kind/:slug (a fixed 1200×630 render target, see
// src/pages/OgCardPage.tsx) into dist/og/<kind>-<slug>.png for the dated
// content pages that reference them via SEOManager's ogImage prop.
// Scope is bounded to keep build minutes flat: last 14 days of briefs,
// last 4 weekly narratives, last 2 monthly digests.

function ogCardJobs(routes) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const briefs = [];
    const narratives = [];
    const digests = [];

    for (const route of routes) {
        const p = withoutTrailingSlash(route);
        let m;
        if ((m = p.match(/^\/macro-brief\/(\d{4}-\d{2}-\d{2})$/)) && m[1] >= cutoffStr) {
            briefs.push({ kind: 'brief', slug: m[1], file: `brief-${m[1]}.png` });
        } else if ((m = p.match(/^\/weekly-narrative\/(\d{4}-\d{2}-\d{2})$/))) {
            narratives.push({ kind: 'narrative', slug: m[1], file: `narrative-${m[1]}.png` });
        } else if ((m = p.match(/^\/regime-digest\/(\d{4})\/(\d{2})$/))) {
            digests.push({ kind: 'digest', slug: `${m[1]}-${m[2]}`, file: `digest-${m[1]}-${m[2]}.png` });
        }
    }

    const bySlugDesc = (a, b) => b.slug.localeCompare(a.slug);
    return [
        ...briefs.sort(bySlugDesc),
        ...narratives.sort(bySlugDesc).slice(0, 4),
        ...digests.sort(bySlugDesc).slice(0, 2),
    ];
}

async function captureOgCards(browser, routes, port) {
    const jobs = ogCardJobs(routes);
    if (jobs.length === 0) {
        console.log('OG cards: no dated-content routes discovered — skipping.');
        return;
    }

    const ogDir = path.join(distDir, 'og');
    fs.mkdirSync(ogDir, { recursive: true });

    let page;
    try {
        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    } catch (err) {
        console.warn('OG cards: could not open page — skipping:', err?.message ?? err);
        return;
    }

    let captured = 0;
    for (const job of jobs) {
        const url = `http://localhost:${port}/og-card/${job.kind}/${job.slug}?embed=true`;
        try {
            await page.goto(url, GOTO_OPTS);
            // Card flags data-og-ready once its Supabase query settles
            await page.waitForFunction(
                () => document.querySelector('[data-og-ready="true"]'),
                { timeout: 15000 }
            ).catch(() => console.warn(`OG cards: ${job.kind}/${job.slug} never signalled ready — capturing anyway`));
            // Let fonts settle before capture
            await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
            await page.screenshot({ path: path.join(ogDir, job.file) });
            captured++;
        } catch (err) {
            console.warn(`OG cards: failed to capture ${job.kind}/${job.slug}:`, err?.message ?? err);
        }
    }
    await page.close().catch(() => {});
    console.log(`OG cards: captured ${captured}/${jobs.length} card(s) into dist/og/`);
}

// Prerendered HTML may reference /og/<file>.png cards that were not generated
// (capture failure, page outside the bounded scope). Rewrite those references
// to the default brand image so og:image never 404s.
const DEFAULT_OG_IMAGE = 'https://graphiquestor.com/hero-preview.jpg';

function fixupMissingOgImages() {
    const ogDir = path.join(distDir, 'og');
    let rewritten = 0;

    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.name === 'index.html') {
                let html = fs.readFileSync(full, 'utf8');
                let changed = false;
                html = html.replace(/https:\/\/graphiquestor\.com\/og\/([A-Za-z0-9._-]+\.png)/g, (match, file) => {
                    if (fs.existsSync(path.join(ogDir, file))) return match;
                    changed = true;
                    return DEFAULT_OG_IMAGE;
                });
                if (changed) {
                    fs.writeFileSync(full, html);
                    rewritten++;
                }
            }
        }
    }

    walk(distDir);
    if (rewritten > 0) {
        console.log(`OG cards: rewrote missing og:image references in ${rewritten} page(s) to default.`);
    }
}

async function pingIndexNow(routes) {
    const key = process.env.INDEXNOW_KEY;
    if (!key) {
        console.log('IndexNow: INDEXNOW_KEY not set — skipping ping.');
        return;
    }

    // Key file must be served from the site root for IndexNow verification
    fs.writeFileSync(path.join(distDir, `${key}.txt`), key);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const urlList = Array.from(routes)
        .filter(isDatedContentRoute)
        .filter(route => routeLastmod(route) >= cutoffStr)
        .map(sitemapLoc);

    if (urlList.length === 0) {
        console.log('IndexNow: no dated-content URLs newer than 2 days — nothing to ping.');
        return;
    }

    try {
        const resp = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: 'graphiquestor.com',
                key,
                keyLocation: `https://graphiquestor.com/${key}.txt`,
                urlList,
            }),
        });
        console.log(`IndexNow: pinged ${urlList.length} URL(s) — HTTP ${resp.status}`);
    } catch (err) {
        // Never fail the build over an indexing ping
        console.warn('IndexNow: ping failed (non-fatal):', err?.message ?? err);
    }
}

// Function to generate the new exhaustive sitemap.xml
function generateSitemap(routes) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Sort routes for a cleaner XML output
    const sortedRoutes = Array.from(routes).sort();

    for (const route of sortedRoutes) {
        const path = withoutTrailingSlash(route);
        const lastmod = routeLastmod(route);
        // Priority heuristic (sitemap hints, not ranking signals):
        //   1.0 homepage | 0.9 macro-brief, intel/india | 0.8 top-level sections
        //   0.7 deeper content | 0.6 archives
        const segments = path.split('/').filter(Boolean).length;
        const priority =
            path === '/' ? '1.0'
            : path === '/macro-brief' || path === '/intel/india' ? '0.9'
            : path === '/macro-brief/archive' ? '0.6'
            : segments >= 2 ? '0.7'
            : '0.8';
        xml += `  <url>\n`;
        xml += `    <loc>${sitemapLoc(route)}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
}

const PUPPETEER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
];

const PAGE_TIMEOUT_MS = 30_000;

function isBrowserDead(err) {
    const msg = String(err?.message ?? err);
    return /Connection closed|Target closed|Session closed|Browser has disconnected|ProtocolError.*timed out/i.test(msg);
}

async function launchBrowser() {
    return puppeteer.launch({
        headless: true,
        args: PUPPETEER_ARGS,
        protocolTimeout: 120_000,
    });
}

const GOTO_OPTS = { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS };

async function capturePageHtml(page) {
    try {
        return await page.content();
    } catch {
        return null;
    }
}

function prerenderedFilePath(cleanRoute) {
    if (cleanRoute === '/') return path.join(distDir, 'index.html');
    const rel = cleanRoute.replace(/^\//, '').replace(/\/$/, '');
    return path.join(distDir, rel, 'index.html');
}

function routeHasPrerender(cleanRoute) {
    const fp = prerenderedFilePath(cleanRoute);
    return fs.existsSync(fp) && fs.statSync(fp).size > 5000;
}

async function setupPage(browser) {
    const page = await browser.newPage();
    page.setDefaultTimeout(PAGE_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);
    page.on('pageerror', (err) => {
        console.error(`[prerender:pageerror] ${err.message}`);
    });
    return page;
}

async function run() {
    const port = Number(process.env.PRERENDER_PORT || process.env.PORT || 4173);
    const server = app.listen(port, '127.0.0.1', async () => {
        console.log(`Server listening on port ${port} for recursive prerendering...`);
        
        let browser;
        try {
            browser = await launchBrowser();
        } catch (launchErr) {
            console.warn('⚠️  Puppeteer browser unavailable; skipping prerender step:', launchErr);
            const sitemapXml = generateSitemap(seedRoutes);
            const outSitemapPath = path.join(distDir, 'sitemap.xml');
            fs.writeFileSync(outSitemapPath, sitemapXml);
            console.log(`Generated sitemap without prerender at ${outSitemapPath}`);
            server.close();
            return;
        }
        const routesToVisit = new Set(seedRoutes);
        const visitedRoutes = new Set();
        
        let page = null;
        let pagesRenderedWithCurrentTab = 0;
        
        while (routesToVisit.size > 0) {
            const route = Array.from(routesToVisit)[0];
            routesToVisit.delete(route);
            
            const cleanRoute = normalizeVisitedRoute(route);
            
            if (visitedRoutes.has(cleanRoute)) continue;
            visitedRoutes.add(cleanRoute);
            
            console.log(`Prerendering [${visitedRoutes.size}] ${cleanRoute}...`);
            
            // Recreate tab every 5 renders to limit CDP/memory pressure
            if (!page || pagesRenderedWithCurrentTab >= 5) {
                if (page) {
                    await page.close().catch(() => {});
                }
                try {
                    page = await setupPage(browser);
                    pagesRenderedWithCurrentTab = 0;
                } catch (pageInitErr) {
                    console.error('Failed to create new page context:', pageInitErr);
                    page = null;
                    if (isBrowserDead(pageInitErr)) {
                        console.warn('Browser connection lost — relaunching Chrome...');
                        try { await browser.close(); } catch { /* ignore */ }
                        browser = await launchBrowser();
                    }
                    visitedRoutes.delete(cleanRoute);
                    routesToVisit.add(route);
                    continue;
                }
            }

            try {
                await page.goto(`http://localhost:${port}${cleanRoute}`, GOTO_OPTS);
                pagesRenderedWithCurrentTab++;

                // ES modules can finish downloading before React hydrates #root — an empty
                // root means we'd capture the static index.html shell (wrong canonicals).
                const appMounted = await page.waitForFunction(
                    () => {
                        const root = document.querySelector('#root');
                        return !!(root && root.childElementCount > 0);
                    },
                    { timeout: 20_000 }
                ).catch(() => null);

                if (!appMounted) {
                    console.warn(`⚠ React never mounted on ${cleanRoute} — page may capture static shell only.`);
                }

                // Beat for lazy routes, Suspense, and helmet flush
                await new Promise(resolve => setTimeout(resolve, 1500));

                const DEFAULT_TITLE = 'Global Macro Intelligence Terminal | GraphiQuestor';
                const DEFAULT_DESC_PREFIX = 'Institutional macro intelligence terminal tracking global liquidity';
                const helmetReady = await page.waitForFunction(
                    (defaultTitle, defaultDescPrefix) => {
                        const helmetMeta = document.head.querySelector(
                            'meta[name="description"][data-rh], link[rel="canonical"][data-rh], meta[property="og:title"][data-rh]'
                        );
                        if (helmetMeta) return true;
                        const title = document.querySelector('title')?.textContent?.trim() ?? '';
                        if (title.length > 0 && title !== defaultTitle) return true;
                        const desc = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
                        return desc.length > 0 && !desc.startsWith(defaultDescPrefix);
                    },
                    { timeout: 15_000 },
                    DEFAULT_TITLE,
                    DEFAULT_DESC_PREFIX
                ).catch(() => null);

                if (!helmetReady) {
                    console.warn(`⚠ Helmet tags never appeared on ${cleanRoute} — skipping static-tag dedup for this page.`);
                }

                // Extract internal links from the rendered DOM
                const newLinks = await page.evaluate(() => {
                    const anchors = Array.from(document.querySelectorAll('a'));
                    return anchors.map(a => a.getAttribute('href'));
                }).catch(() => []);

                // Add valid discovered links to the queue
                for (const href of newLinks) {
                    const cleanedHref = href ? normalizeVisitedRoute(href.split('#')[0].split('?')[0]) : '';
                    if (isRoutable(withoutTrailingSlash(cleanedHref)) && !visitedRoutes.has(cleanedHref)) {
                        routesToVisit.add(cleanedHref);
                    }
                }

                // index.html ships static homepage meta (canonical, og:*, twitter:*,
                // title, description) as an SPA fallback. When react-helmet has
                // rendered a page-specific equivalent (data-rh="true"), the static
                // twin is a DUPLICATE — conflicting canonicals/og:url confuse
                // crawlers and social scrapers pick og tags unpredictably. Strip
                // static tags that have a helmet-managed counterpart before capture.
                if (helmetReady) {
                    await page.evaluate(() => {
                        const hasHelmet = (selector) =>
                            !!document.head.querySelector(`${selector}[data-rh]`);
                        const dropStatic = (selector) => {
                            if (!hasHelmet(selector)) return;
                            document.head
                                .querySelectorAll(`${selector}:not([data-rh])`)
                                .forEach((el) => el.remove());
                        };
                        dropStatic('link[rel="canonical"]');
                        dropStatic('meta[name="description"]');
                        ['og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:site_name', 'og:locale']
                            .forEach((p) => dropStatic(`meta[property="${p}"]`));
                        ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:site', 'twitter:creator']
                            .forEach((n) => dropStatic(`meta[name="${n}"]`));
                    }).catch(() => {});
                }

                const html = await capturePageHtml(page);
                if (!html) {
                    throw new Error('Failed to capture page HTML');
                }
                const finalHtml = html.startsWith('<!DOCTYPE') ? html : `<!DOCTYPE html>\n${html}`;

                // Always use prerenderedFilePath — never path.join(distDir, cleanRoute)
                // when cleanRoute has a leading slash (POSIX path.join treats it as absolute).
                const filePath = prerenderedFilePath(cleanRoute);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, finalHtml);

                // Guard: non-homepage routes must not ship homepage canonical (SPA shell capture).
                if (cleanRoute !== '/') {
                    const canonMatch = finalHtml.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
                        || finalHtml.match(/href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
                    const canon = canonMatch?.[1] ?? '';
                    if (canon === 'https://graphiquestor.com/' || canon === 'https://graphiquestor.com') {
                        console.warn(`⚠ ${cleanRoute}: captured homepage canonical — deleting bad prerender so SPA shell is not preferred over retry`);
                        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
                        throw new Error(`Homepage canonical on ${cleanRoute}`);
                    }
                }
            } catch (err) {
                console.error(`Failed to prerender ${cleanRoute}:`, err);
                try {
                    await page.close();
                } catch (e) { /* ignore */ }
                page = null;
                if (isBrowserDead(err)) {
                    console.warn('Browser connection lost during render — relaunching Chrome...');
                    try { await browser.close(); } catch { /* ignore */ }
                    browser = await launchBrowser();
                }
                visitedRoutes.delete(cleanRoute);
                routesToVisit.add(route);
            }
        }

        // Retry any seed-route that never got a real prerender (browser crash mid-run)
        const missingSeeds = [...seedRoutes]
            .map(normalizeVisitedRoute)
            .filter((r) => !routeHasPrerender(r));
        if (missingSeeds.length > 0) {
            console.log(`\nRetrying ${missingSeeds.length} seed routes missing prerendered HTML...`);
            try { await browser.close(); } catch { /* ignore */ }
            browser = await launchBrowser();
            page = await setupPage(browser);
            pagesRenderedWithCurrentTab = 0;
            for (const cleanRoute of missingSeeds) {
                console.log(`Retry prerender ${cleanRoute}...`);
                try {
                    await page.goto(`http://localhost:${port}${cleanRoute}`, GOTO_OPTS);
                    await page.waitForFunction(
                        () => document.querySelector('#root')?.childElementCount > 0,
                        { timeout: 20_000 }
                    ).catch(() => null);
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                    const html = await capturePageHtml(page);
                    if (!html) throw new Error('Failed to capture page HTML on retry');
                    const outPath = prerenderedFilePath(cleanRoute);
                    fs.mkdirSync(path.dirname(outPath), { recursive: true });
                    fs.writeFileSync(outPath, html.startsWith('<!DOCTYPE') ? html : `<!DOCTYPE html>\n${html}`);
                    visitedRoutes.add(cleanRoute);
                } catch (retryErr) {
                    console.error(`Retry failed for ${cleanRoute}:`, retryErr);
                }
            }
            await page.close().catch(() => {});
            page = null;
        }

        // Clean up final page tab if still active
        if (page) {
            await page.close().catch(() => {});
        }

        // Generate and save the final comprehensive sitemap
        console.log(`\nDiscovered and rendered ${visitedRoutes.size} unique pages.`);
        const sitemapXml = generateSitemap(visitedRoutes);
        const outSitemapPath = path.join(distDir, 'sitemap.xml');
        fs.writeFileSync(outSitemapPath, sitemapXml);
        console.log(`Successfully generated dynamic sitemap at ${outSitemapPath}`);

        await captureOgCards(browser, visitedRoutes, port);
        fixupMissingOgImages();

        await pingIndexNow(visitedRoutes);

        await browser.close();
        server.close();
        console.log('Prerendering complete!');
    });
}

run().catch(console.error);
