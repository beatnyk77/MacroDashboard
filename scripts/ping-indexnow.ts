import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = 'graphiquestor.com';
const KEY = 'e4d91a27f68c4a17b019dfcfb42e7188';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function pingIndexNow() {
    const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
    if (!fs.existsSync(sitemapPath)) {
        console.error('❌ public/sitemap.xml not found. Run generate-sitemap first.');
        process.exit(1);
    }

    const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
    const urlRegex = /<loc>(https:\/\/graphiquestor\.com[^<]*)<\/loc>/g;
    const urls: string[] = [];
    let match;
    while ((match = urlRegex.exec(sitemapXml)) !== null) {
        urls.push(match[1]);
    }

    console.log(`Found ${urls.length} URLs in sitemap to notify via IndexNow...`);

    // IndexNow API accepts up to 10,000 URLs per batch
    const payload = {
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: urls
    };

    const endpoints = [
        'https://api.indexnow.org/indexnow',
        'https://www.bing.com/indexnow'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Sending ping to ${endpoint}...`);
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(payload)
            });

            // IndexNow returns 200 OK or 202 Accepted on success
            if (res.status === 200 || res.status === 202) {
                console.log(`✅ ${endpoint}: Success (HTTP ${res.status}) — ${urls.length} URLs queued for indexing.`);
            } else {
                const text = await res.text();
                console.warn(`⚠ ${endpoint}: Received HTTP ${res.status} — ${text.slice(0, 200)}`);
            }
        } catch (err: any) {
            console.error(`❌ Failed to ping ${endpoint}:`, err.message);
        }
    }
}

pingIndexNow().catch((err) => {
    console.error('Fatal IndexNow error:', err);
    process.exit(1);
});
