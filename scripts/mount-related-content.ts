#!/usr/bin/env tsx
/**
 * scripts/mount-related-content.ts
 *
 * Ensures every data page in src/pages/ has:
 *   import { RelatedContent } from '@/components/RelatedContent';
 *   <RelatedContent /> at the end of the main content container
 *
 * Usage:
 *   npx tsx scripts/mount-related-content.ts --dry-run   # preview changes
 *   npx tsx scripts/mount-related-content.ts             # apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES_DIR = path.join(ROOT, 'src/pages');

const IMPORT_STMT = `import { RelatedContent } from '@/components/RelatedContent';`;

// Non-data pages: utility, legal, admin, index/listing, article wrappers, tools
const SKIP_FILES = new Set([
  'About.tsx',
  'AdminDashboard.tsx',
  'APIAccessPage.tsx',
  'APIDocsPage.tsx',
  'ArticlePage.tsx',
  'BlogPage.tsx',
  'CountriesIndexPage.tsx',
  'CountryProfilePage.tsx',
  'Dashboard.tsx',
  'DataHealthDashboard.tsx',
  'DataHealthPublic.tsx',
  'DataSourcesPage.tsx',
  'ExportScoutPlaybookPage.tsx',
  'ForInstitutional.tsx',
  'GlossaryIndexPage.tsx',
  'GlossaryTermPage.tsx',
  'MacroBrief.tsx',
  'MacroBriefArchive.tsx',
  'MacroBriefArchivePage.tsx',
  'MacroBriefPage.tsx',
  'MetricsMethodologyPage.tsx',
  'NotFound.tsx',
  'PrivacyPolicy.tsx',
  'RegimeDigestArchivePage.tsx',
  'SubscribeConfirm.tsx',
  'TermsOfService.tsx',
  'WeeklyNarrativeArchive.tsx',
  'WeeklyNarrativePage.tsx',
  'ThematicLabsIndexPage.tsx',
]);

// Skip entire subdirectories
const SKIP_DIRS = new Set(['tools']);

function* walkTsx(dir: string): Generator<string> {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) yield* walkTsx(full);
    } else if (ent.name.endsWith('.tsx') && !SKIP_FILES.has(ent.name)) {
      yield full;
    }
  }
}

/** Insert the RelatedContent import after the last existing import line. */
function addImport(content: string): string {
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIdx = i;
  }
  if (lastImportIdx === -1) return content;
  lines.splice(lastImportIdx + 1, 0, IMPORT_STMT);
  return lines.join('\n');
}

/**
 * Find the right place to insert <RelatedContent /> and return the updated content.
 *
 * Strategy A (MUI pages): insert just before the last </Container>.
 *   The closing tag sits at N spaces; we indent the component at N+4.
 *
 * Strategy B (Tailwind/fragment pages): insert before the outer closing </div>
 *   that immediately precedes </> near the end of the file.
 *
 * Returns null if no insertion point was found.
 */
function insertComponent(content: string): string | null {
  // ── Strategy A: MUI Container ──────────────────────────────────────────
  const containerIdx = content.lastIndexOf('</Container>');
  if (containerIdx !== -1) {
    // Split at the newline that starts the </Container> line so the indentation
    // on that line is preserved in content.slice(lineNewline + 1), not swallowed.
    const lineNewline = content.lastIndexOf('\n', containerIdx);
    // Measure indentation: characters between the newline and the '<'
    const containerIndent = content.slice(lineNewline + 1, containerIdx);
    const componentIndent = containerIndent + '    ';
    return (
      content.slice(0, lineNewline + 1) +
      `${componentIndent}<RelatedContent />\n` +
      content.slice(lineNewline + 1)
    );
  }

  // ── Strategy B: JSX fragment wrapper (<> … </>) ────────────────────────
  // Match the final "      </>\n    );\n};" so we can work backwards from it.
  const fragCloseMatch = content.match(/\n([ \t]+)<\/>\n([ \t]+\);\n\};?\s*)$/);
  if (fragCloseMatch && fragCloseMatch.index !== undefined) {
    // Everything before the "\n        </>"
    const beforeFrag = content.slice(0, fragCloseMatch.index);

    // The last line before </> should be the outer container's closing </div>
    const outerDivNewline = beforeFrag.lastIndexOf('\n');
    const outerDivLine = beforeFrag.slice(outerDivNewline + 1);
    if (!outerDivLine.trimEnd().endsWith('</div>')) return null;

    // Locate the closing </div> one level in (inside the outer container)
    const innerDivClose = beforeFrag.lastIndexOf('</div>', outerDivNewline - 1);
    if (innerDivClose === -1) return null;

    // Insert immediately after the inner </div>'s line
    const insertAfter = beforeFrag.indexOf('\n', innerDivClose) + 1;

    // Component indent = outer div indent + 4 spaces
    const outerIndent = outerDivLine.match(/^(\s*)/)?.[1] ?? '';
    const componentIndent = outerIndent + '    ';

    return (
      content.slice(0, insertAfter) +
      `${componentIndent}<RelatedContent />\n` +
      content.slice(insertAfter)
    );
  }

  return null;
}

// ── Main ───────────────────────────────────────────────────────────────────

type Result = { file: string; status: 'already' | 'modified' | 'skipped' };
const results: Result[] = [];

for (const absPath of walkTsx(PAGES_DIR)) {
  const rel = path.relative(ROOT, absPath);
  const original = fs.readFileSync(absPath, 'utf-8');

  if (original.includes('RelatedContent')) {
    results.push({ file: rel, status: 'already' });
    continue;
  }

  const withImport = addImport(original);
  const updated = insertComponent(withImport);

  if (!updated) {
    results.push({ file: rel, status: 'skipped' });
    continue;
  }

  results.push({ file: rel, status: 'modified' });

  if (!DRY_RUN) {
    fs.writeFileSync(absPath, updated, 'utf-8');
  }
}

// ── Report ─────────────────────────────────────────────────────────────────

const modified = results.filter(r => r.status === 'modified');
const already  = results.filter(r => r.status === 'already');
const skipped  = results.filter(r => r.status === 'skipped');

console.log('\n=== mount-related-content' + (DRY_RUN ? ' [DRY RUN]' : '') + ' ===\n');

if (modified.length) {
  console.log(`${DRY_RUN ? 'Would modify' : 'Modified'} (${modified.length}):`);
  for (const r of modified) {
    console.log(`  ✓  ${r.file}`);
    console.log(`       + ${IMPORT_STMT}`);
    console.log(`       + <RelatedContent />`);
  }
  console.log('');
}

if (skipped.length) {
  console.log(`Skipped — no insertion point found (${skipped.length}):`);
  skipped.forEach(r => console.log(`  ⚠  ${r.file}`));
  console.log('');
}

console.log(`Summary:`);
console.log(`  Already have RelatedContent : ${already.length}`);
console.log(`  ${DRY_RUN ? 'Would modify' : 'Modified'}               : ${modified.length}`);
console.log(`  Skipped                     : ${skipped.length}`);

if (DRY_RUN && modified.length) {
  console.log('\nRun without --dry-run to apply changes.\n');
}
