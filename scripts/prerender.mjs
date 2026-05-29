import puppeteer from 'puppeteer';
import express from 'express';
import portfinder from 'portfinder';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const rssPath = path.resolve(__dirname, '../public/rss.xml');
if (fs.existsSync(rssPath)) {
    const rss = fs.readFileSync(rssPath, 'utf8');
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

// Function to generate the new exhaustive sitemap.xml
function generateSitemap(routes) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const today = new Date().toISOString().split('T')[0];
    
    // Sort routes for a cleaner XML output
    const sortedRoutes = Array.from(routes).sort();
    
    for (const route of sortedRoutes) {
        xml += `  <url>\n`;
        xml += `    <loc>https://graphiquestor.com${route}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        // Basic priority logic
        const priority = route === '/' ? '1.0' : route.split('/').length > 2 ? '0.7' : '0.8';
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
    }
    xml += `</urlset>`;
    return xml;
}

async function run() {
    const port = await portfinder.getPortPromise();
    const server = app.listen(port, '127.0.0.1', async () => {
        console.log(`Server listening on port ${port} for recursive prerendering...`);
        
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });
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

                const html = await page.evaluate(() => document.documentElement.outerHTML);
                const finalHtml = `<!DOCTYPE html>\n<html>${html}</html>`;

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
