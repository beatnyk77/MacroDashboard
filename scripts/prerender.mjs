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

const urlRegex = /<loc>https:\/\/graphiquestor\.com([^<]+)<\/loc>/g;
const seedRoutes = new Set();
let match;
while ((match = urlRegex.exec(sitemap)) !== null) {
    if (match[1] === '/') {
        seedRoutes.add('/');
    } else {
        seedRoutes.add(match[1]);
    }
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
            seedRoutes.add(match[1]);
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
const ignorePrefixes = ['/admin', '/api'];

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
    // 1a. Morning brief: /macro-brief/YYYY-MM-DD
    const briefMatch = route.match(/^\/macro-brief\/(\d{4}-\d{2}-\d{2})$/);
    if (briefMatch) return briefMatch[1];

    // 1b. Weekly narrative: /weekly-narrative/YYYY-MM-DD
    const narrativeMatch = route.match(/^\/weekly-narrative\/(\d{4}-\d{2}-\d{2})$/);
    if (narrativeMatch) return narrativeMatch[1];

    // 1c. Regime digest: /regime-digest/YYYY/MM
    const digestMatch = route.match(/^\/regime-digest\/(\d{4})\/(\d{2})$/);
    if (digestMatch) return `${digestMatch[1]}-${digestMatch[2]}-01`;

    // 1d. Blog article: /blog/:slug — publish date from RSS feed
    const blogMatch = route.match(/^\/blog\/([^/]+)$/);
    if (blogMatch && BLOG_LASTMOD.has(blogMatch[1])) {
        return BLOG_LASTMOD.get(blogMatch[1]);
    }

    // 2. Static page with a known source file
    if (STATIC_PAGE_FILES[route]) return gitLastmod(STATIC_PAGE_FILES[route]);

    // 3. Live-data page — build date is the honest lastmod
    return BUILD_DATE;
}

const BUILD_DATE = new Date().toISOString().split('T')[0];

// Function to generate the new exhaustive sitemap.xml
function generateSitemap(routes) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Sort routes for a cleaner XML output
    const sortedRoutes = Array.from(routes).sort();

    for (const route of sortedRoutes) {
        const lastmod = routeLastmod(route);
        // Priority heuristic (sitemap hints, not ranking signals):
        //   1.0 homepage | 0.9 macro-brief, intel/india | 0.8 top-level sections
        //   0.7 deeper content | 0.6 archives
        const segments = route.split('/').filter(Boolean).length;
        const priority =
            route === '/' ? '1.0'
            : route === '/macro-brief' || route === '/intel/india' ? '0.9'
            : route === '/macro-brief/archive' ? '0.6'
            : segments >= 2 ? '0.7'
            : '0.8';
        xml += `  <url>\n`;
        xml += `    <loc>https://graphiquestor.com${route}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
}

async function run() {
    const port = Number(process.env.PRERENDER_PORT || process.env.PORT || 4173);
    const server = app.listen(port, '127.0.0.1', async () => {
        console.log(`Server listening on port ${port} for recursive prerendering...`);
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });
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
            
            const cleanRoute = route.split('#')[0].split('?')[0];
            
            if (visitedRoutes.has(cleanRoute)) continue;
            visitedRoutes.add(cleanRoute);
            
            console.log(`Prerendering [${visitedRoutes.size}] ${cleanRoute}...`);
            
            // Recreate page every 15 renders or if it is currently null to avoid CDP bottlenecks & memory issues
            if (!page || pagesRenderedWithCurrentTab >= 15) {
                if (page) {
                    await page.close().catch(() => {});
                }
                try {
                    page = await browser.newPage();
                    pagesRenderedWithCurrentTab = 0;
                    
                    // Block analytics/ads during prerendering
                    await page.setRequestInterception(true);
                    page.on('request', (req) => {
                        if (req.url().includes('google-analytics') || req.url().includes('googletagmanager')) {
                            req.abort();
                        } else {
                            req.continue();
                        }
                    });
                } catch (pageInitErr) {
                    console.error('Failed to create new page context, forcing page recreate on next loop:', pageInitErr);
                    page = null;
                    // Push route back to routesToVisit to retry
                    routesToVisit.add(route);
                    continue;
                }
            }

            try {
                await page.goto(`http://localhost:${port}${cleanRoute}`, { waitUntil: 'networkidle0', timeout: 30000 });
                pagesRenderedWithCurrentTab++;
                
                // Wait an extra second for dynamic charts/components to finish rendering
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Extract internal links from the rendered DOM
                const newLinks = await page.evaluate(() => {
                    const anchors = Array.from(document.querySelectorAll('a'));
                    return anchors.map(a => a.getAttribute('href'));
                });

                // Add valid discovered links to the queue
                for (const href of newLinks) {
                    const cleanedHref = href ? href.split('#')[0].split('?')[0] : '';
                    if (isRoutable(cleanedHref) && !visitedRoutes.has(cleanedHref)) {
                        routesToVisit.add(cleanedHref);
                    }
                }

                // documentElement.outerHTML already includes <html>…</html> — do not wrap again
                const html = await page.evaluate(() => document.documentElement.outerHTML);
                const finalHtml = `<!DOCTYPE html>\n${html}`;

                const routeDir = path.join(distDir, cleanRoute);
                if (!fs.existsSync(routeDir)) {
                    fs.mkdirSync(routeDir, { recursive: true });
                }
                
                const filePath = path.join(routeDir, 'index.html');
                fs.writeFileSync(filePath, finalHtml);
            } catch (err) {
                console.error(`Failed to prerender ${cleanRoute}:`, err);
                // If it failed because of a connection issue or page crash, discard page to force recreate
                try {
                    await page.close();
                } catch (e) {}
                page = null;
                // Retry this route next time
                visitedRoutes.delete(cleanRoute);
                routesToVisit.add(route);
            }
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

        await browser.close();
        server.close();
        console.log('Prerendering complete!');
    });
}

run().catch(console.error);
