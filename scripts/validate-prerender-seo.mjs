import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const CHECKS = [
    { file: 'index.html', label: 'homepage' },
    { file: 'intel/india/index.html', label: 'intel/india' },
];

function readHtml(relPath) {
    const full = path.join(distDir, relPath);
    if (!fs.existsSync(full)) {
        throw new Error(`Missing prerendered file: ${relPath}`);
    }
    return fs.readFileSync(full, 'utf8');
}

let failed = 0;

for (const { file, label } of CHECKS) {
    const html = readHtml(file);
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
}

if (failed > 0) {
    console.error(`\nPrerender SEO validation failed (${failed} missing tags).`);
    process.exit(1);
}

console.log(`✓ Prerender SEO validation passed (${CHECKS.length} pages).`);