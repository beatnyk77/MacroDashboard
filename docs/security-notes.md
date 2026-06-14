# Security Notes — GraphiQuestor

_Last updated: 2026-06-14_

## CSP Configuration

### Architecture Decision: Server Header Only (no meta tag)

CSP is enforced exclusively via `netlify.toml` `[[headers]]`. The `<meta http-equiv="Content-Security-Policy">` tag was removed from `index.html` on 2026-06-14.

**Why remove the meta tag?**
When multiple CSP policies exist (HTTP header + meta tag), browsers enforce both simultaneously — a request must pass ALL policies. The old meta tag had a narrower `connect-src` (missing Google Analytics, Clarity endpoints) and an extra `unsafe-eval` directive. This caused the meta tag to silently block analytics reporting that the server header intended to allow, while also permitting `unsafe-eval` in the meta-only policy (which the server header correctly excluded). The server header in `netlify.toml` is the authoritative, single source of truth.

### Inline Scripts Inventory

| Script | Location | Type | unsafe-inline required? |
|--------|----------|------|------------------------|
| `gtag.js` bootstrap | `index.html` lines 22–28 | Inline JS (GTM init + config) | **Yes** |
| Microsoft Clarity | `index.html` lines 31–39 | Commented out (disabled) | N/A |
| JSON-LD structured data | None currently | `<script type="application/ld+json">` | No — ld+json is not executable; not covered by script-src |

### Why `unsafe-inline` Remains in script-src

The GTM `gtag()` initialization is an inline `<script>` block with no nonce or hash. Three paths exist to eliminate it:

1. **Nonce-based CSP** — Netlify serves static HTML from its CDN edge; there is no server-side rendering layer to inject a per-request nonce. Implementing this would require Netlify Edge Functions to rewrite `index.html` on every request — significant operational complexity for a no-auth, read-mostly terminal with zero PII in the frontend.

2. **Hash-based CSP** — The GTM bootstrap content is stable (fixed GA4 property `G-DK977Y5QG2`), so a `sha256-...` hash in `script-src` is technically feasible. The risk: any change to the inline block (adding a second GA property, updating the gtag version) breaks the hash silently with no build-time warning.

3. **External file** — Extracting the gtag init to `/src/gtag.ts` and importing it via the module bundle is possible. GTM recommends inline placement for accurate first-paint attribution, but a top-of-`<body>` module script would be functionally equivalent.

**Current decision:** Keep `unsafe-inline`. This terminal has no user auth, stores no PII in the frontend, and has no privileged API tokens accessible from the browser (Supabase anon key is intentionally public). The XSS risk-surface does not justify the operational cost of nonce injection. **Reassess if authentication is ever added.**

### `frame-ancestors 'none'`

Added 2026-06-14 alongside the existing `X-Frame-Options: DENY` header. `frame-ancestors` is the CSP Level 2 directive that supersedes `X-Frame-Options` in all modern browsers. Both headers are present for maximum compatibility (IE11 / older Safari honour X-Frame-Options only).

### CSP Sources — Rationale per Directive

| Directive | Sources | Notes |
|-----------|---------|-------|
| `script-src` | `'self'`, `'unsafe-inline'`, GTM, GA, Clarity, Cloudflare Insights | GTM required; Clarity source present even while disabled, costs nothing |
| `style-src` | `'self'`, `'unsafe-inline'`, Google Fonts | MUI and Tailwind inject inline styles at runtime |
| `img-src` | `'self'`, `data:`, CartoDB basemaps, jsDelivr, unpkg | CartoDB: Leaflet tiles; unpkg/jsDelivr: world-atlas TopoJSON for react-simple-maps |
| `font-src` | `'self'`, Google Fonts, `data:` | `data:` needed for MUI's embedded icon font |
| `connect-src` | `'self'`, Supabase wildcard, GA, Clarity, jsDelivr, Cloudflare Insights | All fetch/XHR targets for data and analytics |
| `frame-src` | `'none'` | No iframes are loaded by this app |
| `frame-ancestors` | `'none'` | Prevents clickjacking; belt-and-suspenders with X-Frame-Options |

---

## npm Audit Policy

### d3-color Pin (2026-06-14)

5 high-severity ReDoS vulnerabilities (GHSA-36jr-mh4h-2g58) via:
```
react-simple-maps@3.0.0 → d3-zoom@2.0.0 → d3-color@2.0.0 (unmaintained)
```

**Mitigation:** `package.json` `"overrides": { "d3-color": "^3.1.0" }` forces all transitive consumers to resolve d3-color@3.1.x. Verified via `npm ls d3-color` — every entry in the tree now shows 3.1.0.

`react-simple-maps` itself remains at 3.0.0 (the library is unmaintained but the attack surface is eliminated by pinning the vulnerable sub-dependency).

**Follow-up:** Replace react-simple-maps with react-leaflet per-component to remove the unmaintained chain entirely. All 5 active map components are self-contained files — migration can be incremental:

| Priority | Component | Route | Complexity |
|----------|-----------|-------|------------|
| 1 | `EventsMap.tsx` | Terminal / home | Markers only — lowest |
| 2 | `ImportOriginMap.tsx` | `/trade` | Choropleth |
| 3 | `G20GoldDebtCoveragePanel.tsx` | `/labs/de-dollarization-gold` | Choropleth |
| 4 | `TICChoroplethMap.tsx` | `/labs/us-macro-fiscal` | Choropleth |
| 5 | `GlobalRefiningMap.tsx` | `/labs/energy-commodities` | Markers + flow lines — highest |

### yaml Removal (2026-06-14)

`yaml@2.8.2` was a direct production dependency with a moderate Stack Overflow vuln (GHSA-48c2-rrv3-qjmp). It was unused in all of `src/`, `scripts/`, and `supabase/functions/` (Deno functions use `npm:yaml` independently). Removed from `package.json`. Transitive consumers (vite, postcss-load-config) were upgraded to yaml@2.9.0 via `npm audit fix`.

### esbuild (2026-06-14)

`esbuild@0.28.0` (devDep via vite + tsx) had two high advisories (GHSA-gv7w-rqvm-qjhr, GHSA-g7r4-m6w7-qqqr). Resolved to 0.28.1 via `npm audit fix` (non-breaking patch). Note: `npm audit --omit=dev` on npm 10.x does not fully filter transitive dev-dependency vulnerabilities, so these appeared in `--omit=dev` runs. Both advisories are development-time only (Deno-specific integrity check + Windows dev server path traversal).

### CI Audit Gate

`npm audit --omit=dev --audit-level=high` runs in `.github/workflows/deploy.yml` after `npm ci`. Currently non-blocking (exits 0 even on findings via `|| echo`).

**Flip to blocking on 2026-07-14** — remove the `|| echo "..."` fallback from the workflow step.
