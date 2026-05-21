import puppeteer from 'puppeteer';
import express from 'express';
import portfinder from 'portfinder';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read sitemap to get routes
const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
let sitemap = '';
try {
    sitemap = fs.readFileSync(sitemapPath, 'utf8');
} catch (e) {
    console.error('Could not read sitemap.xml', e);
    process.exit(1);
}

const urlRegex = /<loc>https:\/\/graphiquestor\.com([^<]+)<\/loc>/g;
const routes = [];
let match;
while ((match = urlRegex.exec(sitemap)) !== null) {
    if (match[1] === '/') {
        routes.push('/');
    } else {
        routes.push(match[1]);
    }
}

// Add any dynamically generated blog routes that might not be in static sitemap
// We can also extract from public/rss.xml if needed
const rssPath = path.resolve(__dirname, '../public/rss.xml');
if (fs.existsSync(rssPath)) {
    const rss = fs.readFileSync(rssPath, 'utf8');
    const rssRegex = /<link>https:\/\/graphiquestor\.com([^<]+)<\/link>/g;
    while ((match = rssRegex.exec(rss)) !== null) {
        if (!routes.includes(match[1]) && match[1] !== '') {
            routes.push(match[1]);
        }
    }
}

// Remove duplicates
const uniqueRoutes = [...new Set(routes)];

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

async function run() {
    const port = await portfinder.getPortPromise();
    const server = app.listen(port, async () => {
        console.log(`Server listening on port ${port} for prerendering...`);
        
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        // Optional: block analytics/ads during prerendering
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (req.url().includes('google-analytics') || req.url().includes('googletagmanager')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        for (const route of uniqueRoutes) {
            console.log(`Prerendering ${route}...`);
            await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
            
            // Wait an extra second for dynamic charts/components to finish rendering
            await new Promise(resolve => setTimeout(resolve, 1500));

            const html = await page.evaluate(() => document.documentElement.outerHTML);
            const finalHtml = `<!DOCTYPE html>\n<html>${html}</html>`;

            const routeDir = path.join(distDir, route);
            if (!fs.existsSync(routeDir)) {
                fs.mkdirSync(routeDir, { recursive: true });
            }
            
            const filePath = path.join(routeDir, 'index.html');
            fs.writeFileSync(filePath, finalHtml);
            console.log(`Saved ${filePath}`);
        }

        await browser.close();
        server.close();
        console.log('Prerendering complete!');
    });
}

run().catch(console.error);
