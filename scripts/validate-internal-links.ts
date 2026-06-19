#!/usr/bin/env tsx
/**
 * Validates internal link coverage for glossary and methods pages.
 *
 * Requirements:
 *   - Every glossary term: 3+ related links + homepage
 *   - Every methods page in contentRelations: 3+ related links + homepage
 *
 * Usage:
 *   npx tsx scripts/validate-internal-links.ts
 *   npx tsx scripts/validate-internal-links.ts --json
 */

import { contentRelations } from '../src/config/contentRelations';
import { ALL_GLOSSARY_SLUGS, getGlossaryRelations } from '../src/config/glossaryRelations';
import { glossaryData } from '../src/features/glossary/glossaryData';

const JSON_OUTPUT = process.argv.includes('--json');
const MIN_LINKS = 3;
const HOMEPAGE = '/';

const METHODS_ROUTES = Object.keys(contentRelations).filter((k) => k.startsWith('/methods/'));

type PageReport = {
  path: string;
  linkCount: number;
  hasHomepage: boolean;
  links: string[];
};

function validateGlossary(): PageReport[] {
  return ALL_GLOSSARY_SLUGS.map((slug) => {
    const relations = getGlossaryRelations(slug);
    const paths = relations.map((r) => r.to);
    return {
      path: `/glossary/${slug}`,
      linkCount: relations.length,
      hasHomepage: paths.includes(HOMEPAGE),
      links: paths,
    };
  });
}

function validateMethods(): PageReport[] {
  return METHODS_ROUTES.map((route) => {
    const relations = contentRelations[route] ?? [];
    const paths = relations.map((r) => r.to);
    return {
      path: route,
      linkCount: relations.length,
      hasHomepage: paths.includes(HOMEPAGE),
      links: paths,
    };
  });
}

function isPassing(report: PageReport): boolean {
  const relatedCount = report.links.filter((l) => l !== HOMEPAGE).length;
  return report.hasHomepage && relatedCount >= MIN_LINKS;
}

const glossaryReports = validateGlossary();
const methodsReports = validateMethods();
const allReports = [...glossaryReports, ...methodsReports];

const failures = allReports.filter((r) => !isPassing(r));
const homepageLinks = contentRelations['/'] ?? [];

const summary = {
  glossaryTerms: glossaryData.length,
  methodsPages: METHODS_ROUTES.length,
  passing: allReports.length - failures.length,
  failing: failures.length,
  homepageExploreCards: homepageLinks.length,
  homepageHasHighImpressionTerms: [
    'breakeven-inflation-rate',
    'foreign-exchange-reserves',
    'fiscal-dominance',
    'tga',
    'm2-gold-ratio',
  ].every((term) =>
    homepageLinks.some((l) => l.to.includes(term))
  ),
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify({ summary, failures, homepageLinks }, null, 2));
} else {
  console.log('\n=== Internal Link Coverage Report ===\n');
  console.log(`Glossary terms : ${summary.glossaryTerms}`);
  console.log(`Methods pages  : ${summary.methodsPages}`);
  console.log(`Passing        : ${summary.passing}/${allReports.length}`);
  console.log(`Homepage cards : ${summary.homepageExploreCards}`);
  console.log(`High-impression terms on homepage: ${summary.homepageHasHighImpressionTerms ? 'YES' : 'NO'}`);

  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length}):`);
    for (const f of failures) {
      const related = f.links.filter((l) => l !== HOMEPAGE).length;
      console.log(`  ✗ ${f.path}`);
      console.log(`      homepage=${f.hasHomepage} related=${related} (need ≥${MIN_LINKS})`);
      console.log(`      links: ${f.links.join(', ')}`);
    }
    process.exit(1);
  }

  console.log('\n✓ All glossary and methods pages meet internal linking requirements.\n');
}

if (failures.length > 0) process.exit(1);