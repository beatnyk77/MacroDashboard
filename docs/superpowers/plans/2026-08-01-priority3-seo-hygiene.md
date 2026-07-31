# Priority 3 SEO Hygiene — Implementation Plan

> Executed 2026-08-01 on `main`.

## Tasks

### Task 1: multiple-h1 (8 blog posts)
- [x] Strip leading `# Title` from 8 `blogData.ts` content bodies

### Task 2: heading-order-skip
- [x] ArticlePage: author/related/continue-reading components
- [x] About: job title → `p`
- [x] CountryNarrativeBlock: thesis → `h2`
- [x] CardTitle: optional `as` prop; labs index `as="h2"`
- [x] TodaysBriefPanel: date/values → non-heading
- [x] China15thFYPTeaser: `h2`
- [x] Methods/glossary/weekly/API bulk MUI `component` fixes

### Task 3: titles & meta
- [x] `countryMeta` template: `${name} (${code}) Sovereign Risk` (≤60 w/ brand)
- [x] Blog titles + M2 description
- [x] glossarySeoEnrichment key terms
- [x] Lab/intel/methods/page SEOManager trims

### Task 4: slow-response
- [x] No code — false positive (documented in design)

## Verify
- `npm run lint` clean
- `npm run build` / `tsc --noEmit` clean
- Spot-check headings via browser when convenient
