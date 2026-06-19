/**
 * Validates AI/research growth surfaces.
 * Run: npx tsx scripts/validate-ai-surfaces.ts
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glossaryData } from '../src/features/glossary/glossaryData';
import { METHOD_CITATIONS } from '../src/config/methodCitations';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
    if (ok) {
        passed++;
        console.log(`  ✓ ${name}`);
    } else {
        failed++;
        console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

console.log('\n🔍 AI & Research Surface Validation\n');

// Static files
for (const file of ['public/llms.txt', 'public/llm.txt', 'public/robots.txt']) {
    const path = `${ROOT}/${file}`;
    check(`${file} exists`, existsSync(path));
    if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');
        check(`${file} mentions for-researchers`, content.includes('for-researchers'));
        check(`${file} mentions intel/china`, content.includes('intel/china'));
    }
}

// Methods citation coverage
const methodSlugs = [
    'net-liquidity-z-score', 'debt-gold-z-score', 'loan-to-job-efficiency',
    'energy-dependency-ratio', 'fiscal-dominance-meter', 'm2-gold-ratio',
    'de-dollarization-guide', 'fed-monetization-monitor', 'india-credit-cycle-clock',
];
for (const slug of methodSlugs) {
    check(`METHOD_CITATIONS[${slug}]`, Boolean(METHOD_CITATIONS[slug]));
}

// Component wiring in key pages
const pagesToCheck: [string, string[]][] = [
    ['src/pages/GlossaryTermPage.tsx', ['CiteThisPage']],
    ['src/components/research/CiteThisPage.tsx', ['llm-summary', 'cite-this-page']],
    ['src/pages/MetricsMethodologyPage.tsx', ['InstitutionalAccessStrip', 'for-researchers']],
    ['src/pages/ForResearchersPage.tsx', ['CiteThisPage', 'llms.txt']],
    ['src/pages/Terminal.tsx', ['InstitutionalAccessStrip', 'ChinaLocaleHint']],
    ['src/components/engagement/EngagementLayer.tsx', ['MethodCitationPanel']],
    ['src/App.tsx', ['ForResearchersPage', '/for-researchers']],
];

for (const [file, needles] of pagesToCheck) {
    const path = `${ROOT}/${file}`;
    if (!existsSync(path)) {
        check(`${file} exists`, false);
        continue;
    }
    const content = readFileSync(path, 'utf-8');
    for (const needle of needles) {
        check(`${file} → ${needle}`, content.includes(needle));
    }
}

// Glossary count in llms.txt
const llms = readFileSync(`${ROOT}/public/llms.txt`, 'utf-8');
const glossaryMentions = (llms.match(/\/glossary\//g) ?? []).length;
check(`llms.txt glossary links ≥ ${glossaryData.length}`, glossaryMentions >= glossaryData.length);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);