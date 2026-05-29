# Trailing Slash Duplicate Canonicalization Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate trailing-slash duplicate content by enforcing 301 redirects at the Netlify layer and normalizing auto-generated canonical URLs in SEOManager.

**Architecture:** Two-layer fix. First, a server-side Netlify redirect converts any `/*/<path>/` request to `/<path>` (301) before the SPA catch-all runs. Second, SEOManager strips trailing slashes from its auto-generated canonical as defense-in-depth for prerendering and any CDN-bypass scenarios. The sitemap and hardcoded canonicalUrl props already use no-trailing-slash form — no changes needed there.

**Tech Stack:** Netlify redirect rules (netlify.toml, public/_redirects), React (SEOManager.tsx using react-router-dom `useLocation`), Vitest + Testing Library (unit test), robots.txt (minor cleanup).

---

## Background: The Problem

Currently, `graphiquestor.com/about` and `graphiquestor.com/about/` both serve the same HTML. The canonical tag each gets depends on which URL the visitor arrived at, because `SEOManager.tsx:40` builds the canonical directly from `location.pathname`:

```ts
const resolvedCanonical = canonicalUrl || `https://graphiquestor.com${location.pathname}`;
```

This means:
- Visitor hits `/about` → canonical = `https://graphiquestor.com/about` ✓
- Visitor hits `/about/` → canonical = `https://graphiquestor.com/about/` ✗ (wrong canonical)

Google treats these as separate pages and may split link equity between them. Both URLs are currently accessible because `netlify.toml` only has the SPA catch-all `/* → /index.html 200`, with no prior rule to redirect trailing slashes.

The pages that pass an explicit `canonicalUrl` prop (e.g. `MetricsMethodologyPage`, `ArticlePage`) are safe. The ~25 pages that do NOT pass `canonicalUrl` are all vulnerable.

---

## File Map

| File | Change |
|---|---|
| `netlify.toml` | Add trailing-slash → no-slash 301 redirect BEFORE the SPA catch-all |
| `public/_redirects` | Add same redirect for belt-and-suspenders (Netlify processes toml first) |
| `src/components/SEOManager.tsx` | Normalize `location.pathname` to strip trailing slash before building canonical |
| `src/components/__tests__/SEOManager.test.tsx` | New: unit tests for canonical normalization |
| `public/robots.txt` | Minor: change `Allow: /blog/` → `Allow: /blog` for consistency |

---

## Task 1: Add Netlify trailing-slash redirect rule

**Files:**
- Modify: `netlify.toml` (add before existing `[[redirects]]` block)
- Modify: `public/_redirects` (add before the SPA catch-all line)

The redirect pattern `/*/ → /:splat` uses Netlify's splat wildcard (`*` is captured as `:splat`). It matches `/about/` → `/about`, `/labs/us-macro-fiscal/` → `/labs/us-macro-fiscal`, etc. The root URL `/` does NOT match `/*/ ` because the pattern requires at least one path character between the two slashes.

- [ ] **Step 1: Read the current netlify.toml to confirm line positions**

Run: `cat -n netlify.toml`  
Expected: lines 1-30, with `[[redirects]]` around line 13.

- [ ] **Step 2: Insert trailing-slash redirect in netlify.toml BEFORE the existing [[redirects]] block**

Open `netlify.toml`. The file currently reads:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Replace that block with:
```toml
# 301: strip trailing slash from all non-root paths before the SPA catch-all
[[redirects]]
  from = "/*/"
  to = "/:splat"
  status = 301
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 3: Add the same rule to public/_redirects BEFORE the SPA catch-all**

Open `public/_redirects`. It currently reads:
```
# Legacy Redirects for SEO
/thematics /#thematic-labs 301

# SPA Fallback (Netlify/Vercel/others)
/* /index.html 200
```

Replace with:
```
# Legacy Redirects for SEO
/thematics /#thematic-labs 301

# Strip trailing slashes (301) — must come before SPA catch-all
/*/ /:splat 301

# SPA Fallback (Netlify/Vercel/others)
/* /index.html 200
```

- [ ] **Step 4: Verify the build still compiles**

Run: `npm run build`  
Expected: exits 0, no errors. The netlify.toml and _redirects changes are static files — build output should be unchanged.

- [ ] **Step 5: Commit**

```bash
git add netlify.toml public/_redirects
git commit -m "feat(seo): add 301 redirect to strip trailing slashes at Netlify layer"
```

---

## Task 2: Normalize canonical URL in SEOManager

**Files:**
- Modify: `src/components/SEOManager.tsx` (line 40)

The fix: when auto-generating the canonical from `location.pathname`, strip any trailing slash — EXCEPT when pathname is exactly `"/"` (the root, which must stay as `https://graphiquestor.com/`).

- [ ] **Step 1: Open SEOManager.tsx and read it**

File: `src/components/SEOManager.tsx`  
Focus on lines 36-42 (the `resolvedCanonical` derivation).

Current code (line 40):
```ts
const resolvedCanonical = canonicalUrl || `https://graphiquestor.com${location.pathname}`;
```

- [ ] **Step 2: Replace the canonical derivation logic**

Change line 40 from:
```ts
    const resolvedCanonical = canonicalUrl || `https://graphiquestor.com${location.pathname}`;
```

To:
```ts
    const canonicalPath = location.pathname === '/'
        ? '/'
        : location.pathname.replace(/\/$/, '');
    const resolvedCanonical = canonicalUrl || `https://graphiquestor.com${canonicalPath}`;
```

- [ ] **Step 3: Verify TypeScript compiles without errors**

Run: `npx tsc --noEmit`  
Expected: exits 0, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SEOManager.tsx
git commit -m "fix(seo): strip trailing slash from auto-generated canonical in SEOManager"
```

---

## Task 3: Unit tests for SEOManager canonical normalization

**Files:**
- Create: `src/components/__tests__/SEOManager.test.tsx`

These tests mount SEOManager with a MemoryRouter at a given path and assert that the rendered `<link rel="canonical">` has the expected `href`. The test pattern mirrors `src/smoke.test.tsx` — use `HelmetProvider`, `MemoryRouter`, and `@testing-library/react`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/__tests__/SEOManager.test.tsx`:

```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SEOManager } from '@/components/SEOManager';

function renderSEOManager(path: string, canonicalUrl?: string) {
    render(
        <HelmetProvider>
            <MemoryRouter initialEntries={[path]}>
                <SEOManager
                    title="Test"
                    description="Test description"
                    canonicalUrl={canonicalUrl}
                />
            </MemoryRouter>
        </HelmetProvider>
    );
    return document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
}

describe('SEOManager canonical URL', () => {
    it('root path "/" stays as https://graphiquestor.com/', () => {
        const link = renderSEOManager('/');
        expect(link?.href).toBe('https://graphiquestor.com/');
    });

    it('path without trailing slash is unchanged', () => {
        const link = renderSEOManager('/about');
        expect(link?.href).toBe('https://graphiquestor.com/about');
    });

    it('path with trailing slash is normalized to no-slash canonical', () => {
        const link = renderSEOManager('/about/');
        expect(link?.href).toBe('https://graphiquestor.com/about');
    });

    it('multi-segment path with trailing slash is normalized', () => {
        const link = renderSEOManager('/labs/us-macro-fiscal/');
        expect(link?.href).toBe('https://graphiquestor.com/labs/us-macro-fiscal');
    });

    it('dynamic segment path with trailing slash is normalized', () => {
        const link = renderSEOManager('/countries/IN/');
        expect(link?.href).toBe('https://graphiquestor.com/countries/IN');
    });

    it('explicit canonicalUrl prop overrides auto-generation entirely', () => {
        const link = renderSEOManager('/about/', 'https://graphiquestor.com/about');
        expect(link?.href).toBe('https://graphiquestor.com/about');
    });

    it('embed-mode path (no trailing slash) generates correct canonical', () => {
        // ?embed=true is a query param, location.pathname excludes it
        const link = renderSEOManager('/tools/net-liquidity-gauge');
        expect(link?.href).toBe('https://graphiquestor.com/tools/net-liquidity-gauge');
    });
});
```

- [ ] **Step 2: Run tests and verify they FAIL before the fix**

Run: `npx vitest run src/components/__tests__/SEOManager.test.tsx`  
Expected: the trailing-slash tests fail (because `SEOManager` hasn't been patched yet in this step order).

Note: If you've already done Task 2 before Task 3, the tests will pass immediately — that's fine. The order is Task 1 → Task 2 → Task 3.

- [ ] **Step 3: Confirm tests pass with the Task 2 fix applied**

Run: `npx vitest run src/components/__tests__/SEOManager.test.tsx`  
Expected: all 7 tests pass.

- [ ] **Step 4: Run the full test suite to check for regressions**

Run: `npm run test`  
Expected: exits 0. All tests pass including the existing smoke tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/__tests__/SEOManager.test.tsx
git commit -m "test(seo): add unit tests for SEOManager trailing-slash canonical normalization"
```

---

## Task 4: robots.txt trailing-slash consistency cleanup

**Files:**
- Modify: `public/robots.txt`

`robots.txt:3` currently has `Allow: /blog/` (with trailing slash). This is a minor inconsistency — the rest of the `Allow` directives use paths without trailing slashes. While Google treats these equivalently for robots.txt, it should be consistent with the site's canonical form.

- [ ] **Step 1: Open and read robots.txt**

File: `public/robots.txt`, lines 1-28.

- [ ] **Step 2: Change the trailing-slash Allow directive**

Change:
```
Allow: /blog/
```

To:
```
Allow: /blog
```

- [ ] **Step 3: Verify no other trailing-slash Allow directives exist**

Run: `grep "Allow:.*/$" public/robots.txt`  
Expected: no output (zero matches).

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt
git commit -m "fix(seo): normalize trailing slash in robots.txt Allow directive"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Covered by |
|---|---|
| Prevent `/path/` and `/path` from being indexed as separate pages | Task 1 (Netlify 301), Task 2 (canonical normalization) |
| Fix applies to ALL ~25 pages using auto-generated canonical | Task 2 (SEOManager is the single source) |
| Root `/` stays as `https://graphiquestor.com/` | Task 2 (explicit guard: `pathname === '/'`) |
| Pages with hardcoded `canonicalUrl` are unaffected | No change — they bypass auto-generation entirely |
| Sitemap URLs are already no-trailing-slash | No change needed — sitemap is already correct |
| Test coverage for canonical normalization | Task 3 (7 cases) |
| robots.txt consistency | Task 4 |

**Placeholder scan:** None found. All steps contain exact code/commands.

**Type consistency:** `canonicalPath` and `resolvedCanonical` types are both `string`. No interface changes. The `SEOManager` component signature is unchanged — callers are unaffected.

**Edge cases verified:**
- Root `/` → stays `https://graphiquestor.com/` (not stripped to `https://graphiquestor.com`)
- `/about` → unchanged `https://graphiquestor.com/about`
- `/about/` → normalized to `https://graphiquestor.com/about`
- `/labs/us-macro-fiscal/` → `https://graphiquestor.com/labs/us-macro-fiscal`
- Explicit `canonicalUrl` prop → always wins (no mutation)
- Netlify redirect `/*/ → /:splat` does NOT match the root `/` (pattern requires content before trailing slash)
