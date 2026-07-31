# Priority 3: SEO/Technical Hygiene Audit — Design

**Status:** Approved for planning
**Date:** 2026-08-01
**Source data:** `/Users/kartikaysharma/Desktop/GraphiQuestor/audit-issues.json` (93 items, sibling directory, not in this repo)

## Context

Priorities 0–2 are merged to `main` (HEAD `c937926`). This is Priority 3: fixing the 93-item SEO/AEO technical hygiene audit. The 93 items break down as:

| issueType | count |
|---|---|
| title-too-long | 34 |
| heading-order-skip | 33 |
| meta-description-too-long | 14 |
| multiple-h1 | 8 |
| slow-response | 3 |
| canonicalized-page | 1 (no action — audit's own guidance) |

All four actionable categories are mechanical enough to ship as **one design and one implementation plan**, not four separate sub-projects — confirmed during investigation, since three of the four collapse into shared-component fixes rather than 93 independent edits.

## Investigation method

Rather than trust the audit JSON or static source-reading alone, findings below were verified two ways:
1. **Live rendered DOM** — booted the dev server, navigated to each URL, and read `document.querySelectorAll('h1,h2,h3,h4,h5,h6')` in document order to get the *actual* heading tree, not the assumed one.
2. **Live production timing** — `curl -w "%{time_total}"` against `graphiquestor.com` directly, for the slow-response claim.

This surfaced two corrections to the audit's own framing (both documented below): the country-page title bug affects all 40 country pages, not the 10 sampled, and the slow-response measurements don't reproduce against production at all.

---

## Category 1: multiple-h1 (8 items) — apply as scoped

Confirmed: [ArticlePage.tsx:152-161](../../../src/pages/ArticlePage.tsx) renders the real page H1 via `<Typography variant="h3" component="h1">{article.title}</Typography>`. The markdown body (rendered via `ReactMarkdown` at line 267) starts with a leading `# <Title>` line in exactly 8 of 9 posts in [blogData.ts](../../../src/features/blog/blogData.ts), which `ReactMarkdown` renders as a second, real (CSS-hidden but DOM-present) `<h1>`.

**Fix:** delete the leading `# <Title>` line (and its trailing blank line) from `content` for these 8 slugs: `asi-manufacturing-intelligence-india-advantage`, `brics-de-dollarization-tracker-2026`, `debt-gold-ratio-analysis-2026`, `g20-macro-surveillance-dashboard-analysis`, `global-net-liquidity-guide-2026`, `india-energy-security-state-wise-analysis`, `india-macro-pulse-mospi-dashboard-guide`, `shanghai-divergence-indicator-explained`. Verified each post's second line is a `##` subheading or a paragraph, so the body reads correctly with the line removed — no case blindly strips real content.

---

## Category 2: heading-order-skip (33 items)

### Root cause

Not 33 independent bugs. The same anti-pattern — **a heading tag chosen for its visual size instead of its position in the document outline** — recurs in four places:

1. **MUI `Typography` variant defaults.** `variant="subtitle1"`, `"subtitle2"`, and `"h6"` all default their rendered `component` to `<h6>` when no explicit `component` prop is given. Developers used these variants purely for *text styling* (bylines, captions, job titles) without realizing MUI silently emits a real heading tag.
   - [ArticlePage.tsx:289](../../../src/pages/ArticlePage.tsx) (`variant="subtitle1"`, author byline), `:353` (`variant="h6"`, "Continue Reading"), `:373` (`variant="subtitle2"`, related-article titles) — jumps straight from the body's last H2 to H6, on all **8 blog post pages**.
   - [About.tsx:68](../../../src/pages/About.tsx) (`variant="subtitle2"`, "Principal Analyst, CA") — jumps from H3 ("Kartikay Sharma") to H6, on `/about/`.

2. **MUI `variant`/`component` set to different levels on purpose, but the wrong level.** [CountryNarrativeBlock.tsx:120](../../../src/components/CountryNarrativeBlock.tsx) uses `variant="h5"` with no `component` override, rendering a real `<h5>` immediately after the page's H1 (`countryName`) with no H2 in between — on **all country pages**.

3. **A shared shadcn/ui primitive hardcoded to one tag.** `CardTitle` in [card.tsx:48-61](../../../src/components/ui/card.tsx) always renders `<h3>` regardless of context. That's correct wherever it sits under an existing H2 (verified fine on the homepage's card grids), but on `/labs/` ([ThematicLabsIndexPage.tsx](../../../src/pages/labs/ThematicLabsIndexPage.tsx)) the card grid is the first content after the page H1, so every `CardTitle` renders H1→H3, skipping H2.

4. **Raw HTML tags picked for Tailwind font-size classes, not semantics.** [TodaysBriefPanel.tsx:139](../../../src/features/dashboard/components/sections/TodaysBriefPanel.tsx) (`<h3>` for a date string) and `:158`/`:177` (`<h5>` for "Regime Consensus"/"Liquidity Impulse" values) — jumps H3→H5 on the homepage. [China15thFYPTeaserRow.tsx:42](../../../src/features/dashboard/components/rows/China15thFYP/China15thFYPTeaserRow.tsx) (`<h3>`) — jumps H1→H3 on `/intel/china/`, since that teaser sits right under the page hero with no H2 between.

### Coverage verified so far (22 of 33 URLs)

| Root cause | URLs fixed |
|---|---|
| ArticlePage.tsx subtitle1/h6/subtitle2 | 8 blog post pages |
| CountryNarrativeBlock.tsx h5 | 10 sampled country pages, **and the other 30 not sampled by the audit** (see Category 3 for why the sample undercounts) |
| CardTitle hardcoded h3 | `/labs/` |
| TodaysBriefPanel.tsx h3/h5 | `/` (homepage) |
| China15thFYPTeaserRow.tsx h3 | `/intel/china/` |
| About.tsx subtitle2 | `/about/` |

### Remaining 10 URLs — audit during implementation

`/weekly-narrative/`, `/api-access/`, `/glossary/`, `/glossary/breakeven-inflation-rate/`, `/glossary/foreign-exchange-reserves/`, `/glossary/fiscal-dominance/`, `/glossary/tga/`, `/methods/m2-gold-ratio/`, `/labs/de-dollarization-gold/`, `/labs/africa-macro/`.

These weren't reproducible against the local dev server during investigation (glossary term pages render blank locally without Supabase env data — a local-only quirk, not a production issue) and weren't chased further to keep the design phase scoped. Per the approved decision, the implementation plan audits each of these ten against the *live rendered DOM* (production or a properly configured local env) the same way the other 22 were verified, and fixes whatever surfaces — expected to be more instances of the same four patterns above, not a new mechanism.

### Fix approach

- **MUI variant-default instances** (pattern 1 & 2): add an explicit `component` prop at each specific instance. Non-heading text (bylines, job titles, captions) gets `component="p"` or `component="span"` — it was never a heading. Text that *is* legitimately a subheading gets the correct heading level for its position (e.g. `CountryNarrativeBlock`'s h5 becomes `component="h2"`, matching the existing precedent at `ArticlePage.tsx:153` of `variant="h3" component="h1"` — visual size stays, semantic tag changes).
- **`CardTitle` (pattern 3):** add an optional `as?: keyof JSX.IntrinsicElements` prop, defaulting to `'h3'` (zero behavior change anywhere it's already correct — Terminal.tsx, CountriesIndexPage.tsx, MacroObservatory.tsx stay as-is unless the live-DOM audit finds them broken too). Pass `as="h2"` at the specific callsites (starting with `ThematicLabsIndexPage.tsx`) where `CardTitle` is the first heading-bearing content after the page H1.
- **Raw HTML instances (pattern 4):** change the tag directly to match the element's real position in the outline (e.g. `TodaysBriefPanel`'s date `<h3>` → `<h4>` since it sits under the implicit page structure between H1/H2 and the H5s beneath it — exact level to be confirmed against each page's full tree during implementation).

---

## Category 3 & 4: title-too-long (34) / meta-description-too-long (14)

Every affected page sets these via `<SEOManager title=... description=... />` ([SEOManager.tsx](../../../src/components/SEOManager.tsx)), which auto-appends `" | GraphiQuestor"` (17 chars) to any title that doesn't already contain the brand name. **This suffix must be counted** when trimming — the audit measures the final rendered `<title>`, not the raw prop.

### Country pages — template-level fix (not 10 one-off edits)

[`countryMeta()` in seoTemplates.ts:8-19](../../../src/lib/seoTemplates.ts) builds titles as `` `${countryName} (${code}) Macro Data & Sovereign Risk Terminal` ``. With the auto-appended brand suffix, this exceeds 60 chars for **39 of the 40** countries in [countries.ts](../../../src/lib/countries.ts) — the audit's 10 flagged rows (`ae, ar, au, br, ca, ch, cl, cn, de, eg`) are alphabetically the first ones a shallow crawl reached, not the full defect surface. The description template is already fine for all 40 (max 154 chars for "United Kingdom", well under 160) — no change needed there.

**Fix:** shorten the fixed part of the title template so even the longest country name ("United Kingdom", 14 chars) stays under 60 with the brand suffix, while keeping the "Sovereign Risk" keyword phrase intact (it's core to the site's SEO positioning per CLAUDE.md). Candidate: `` `${countryName} (${code}) Macro & Sovereign Risk` `` → max 58 chars across all 40 countries including the suffix. Exact wording to be finalized in the plan.

### Everything else — mechanical per-page trims

The remaining ~24 items are hardcoded strings in individual files:
- **Page-level hardcoded `SEOManager` props:** `/labs/`, `/labs/us-macro-fiscal`, `/intel/china/`, `/intel/india/`, `/labs/energy-commodities/`, `/labs/sovereign-stress/`, `/labs/de-dollarization-gold/`, `/blog/` (index), `/countries/` (index), `/labs/africa-macro/`, `/methods/m2-gold-ratio/`, homepage (description only — title is fine).
- **`glossarySeoEnrichment.ts`** (highest-priority override in `GlossaryTermPage.tsx`'s title/description resolution): `breakeven-inflation-rate`, `foreign-exchange-reserves`, `tga` (title+desc), `fiscal-dominance` (title only — its description measured under the 160 threshold in this investigation, to be re-confirmed in the plan against the audit's own count).
- **`blogData.ts`** article `title`/`description` fields: the 8 posts already touched for multiple-h1, plus `m2-gold-ratio-debasement-signal-2026` (worst offender — 246-char description).

Each trim preserves the primary keyword (front-loaded per the audit's own `howToFix` guidance) and targets ~50–60 chars for titles (accounting for the brand suffix) and 70–160 for descriptions. No shared template applies here beyond the country one — these are legitimately one-off edits, done directly in each file.

---

## Category 5: slow-response (3 items) — no code change

The audit logs `/glossary/fiscal-dominance/`, `/glossary/tga/`, and `/methods/m2-gold-ratio/` at an identical **2424ms**. Direct repeated `curl -w "%{time_total}"` timing against the live production site shows all three settling around **300–650ms** — indistinguishable from unflagged control routes (e.g. `/glossary/breakeven-inflation-rate/` measured ~1.0s on a cold hit). Nothing in these three routes' code or data dependencies is measurably slower than any other page.

An identical duration across three otherwise-unrelated routes (two glossary terms sharing `useGlossaryDataHub`'s 8 unconditional hooks, one methods page with a completely different hook set) is far more consistent with a shared timeout/retry ceiling or a one-time cold-start hit inside the audit crawler than three independent real bottlenecks.

**Decision (confirmed):** no code change. Document this finding in the final report; treat it as a false positive to re-check on the next audit run rather than adding caching/SSG for a problem that doesn't reproduce.

---

## Non-negotiables carried into implementation

- `npm run lint && npm run build` after every change, results reported.
- No new dependencies (none needed — every fix uses existing MUI/shadcn/React primitives).
- Smallest diff per issue; country-title template is the one deliberate exception (one template edit instead of 40 duplicated ones, because it *is* the smallest diff that fully fixes all 40 pages).
- Verification in browser preview: spot-check a few pages per category, confirm heading order and H1 count via the live accessibility tree / heading query — not just visual appearance.
- Report before/after counts per category.
