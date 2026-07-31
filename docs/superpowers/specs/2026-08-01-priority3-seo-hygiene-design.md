# Priority 3: SEO/Technical Hygiene Audit — Design

**Status:** Approved · implement 2026-08-01  
**Source:** audit-issues.json (93 items, external)

## Summary

| Type | Count | Action |
|------|------:|--------|
| title-too-long | 34 | Shorten (country template + per-page) |
| heading-order-skip | 33 | Semantic heading levels (shared patterns) |
| meta-description-too-long | 14 | Shorten descriptions |
| multiple-h1 | 8 | Remove leading `# Title` from blog markdown |
| slow-response | 3 | **No code** — false positive vs prod timing |
| canonicalized-page | 1 | No action |

## Fixes (collapsed)

1. **multiple-h1:** 8 posts in `blogData.ts` — strip leading `# title` line (page already has H1).
2. **heading-order:** MUI `component` overrides; `CardTitle` optional `as`; raw HTML tag fixes; remaining ~10 URLs audited live during impl.
3. **titles/descriptions:** `countryMeta()` template for all 40 countries; mechanical trims elsewhere; SEOManager brand suffix counts toward 60-char title budget.
4. **slow-response:** document only.

## Non-negotiables

- `npm run lint && npm run build` after changes  
- No new dependencies  
- Smallest diff; country title is one template edit for all 40 pages  
