# Design Spec: Social Sharing + Terminal Expansion
Date: 2026-06-05

## Overview

Three parallel workstreams:
1. Per-card social sharing system (client-side image capture → watermarked PNG → share modal)
2. Delete orphaned `/macro-observatory` route (redirect to `/labs`)
3. Add two new ModuleRows to Terminal home: DE-DOLLARIZATION & GOLD, SHADOW SYSTEM

---

## 1. Social Sharing System

### Goal
Every chart/metric card on the site gets a share icon on hover. Clicking it captures the card as a high-DPI watermarked PNG and opens a share modal with buttons for X/Twitter, LinkedIn, WhatsApp, Copy Link, and Download.

### New dependency
`html2canvas` (~45KB gzipped). Install via `npm install html2canvas`.

### Components

#### `ShareButton` (`src/components/ShareButton.tsx`)
- Props: `targetRef: React.RefObject<HTMLElement>`, `title: string`, `dataSource: string`, `href?: string`
- Renders a `Share2` (lucide) icon absolutely positioned top-right of its parent card
- Visibility: `opacity-0 group-hover:opacity-100` transition (parent card needs `group` class)
- Mobile: always visible at `opacity-30` (no hover on touch)
- On click: calls `useCardCapture` → on success opens `ShareModal`

#### `useCardCapture` (`src/hooks/useCardCapture.ts`)
Capture sequence:
1. Create and inject a watermark `div` pinned `absolute bottom-0 inset-x-0` inside `targetRef.current`
   - Dark gradient background (`rgba(2,6,23,0.92)`)
   - Left: `◆ GraphiQuestor · graphiquestor.com` (white, bold, small)
   - Right: `{dataSource} · {formatted date}` (muted, small)
   - Height: 28px
2. Call `html2canvas(targetRef.current, { useCORS: true, allowTaint: false, scale: 2, logging: false })`
3. Remove the watermark div (cleanup runs even on error)
4. Return `{ dataUrl: string, blob: Blob }`
- Returns `{ capture, isCapturing, error }` — `capture()` is async

#### `ShareModal` (`src/components/ShareModal.tsx`)
Opens after a successful capture.
- Props: `open: boolean`, `onClose: () => void`, `dataUrl: string`, `blob: Blob`, `title: string`, `href: string`
- Content:
  - PNG preview (max 420px wide, `object-contain`)
  - Platform buttons row (icon + label):
    - **X / Twitter** → `https://twitter.com/intent/tweet?text={encoded}&url={encoded_url}`
    - **LinkedIn** → `https://www.linkedin.com/sharing/share-offsite/?url={encoded_url}`
    - **WhatsApp** → `https://wa.me/?text={encoded_text}%20{encoded_url}`
    - **Copy Link** → `navigator.clipboard.writeText(href)`
    - **Download PNG** → `<a href={dataUrl} download="gq-{slug}.png">`
- Pre-filled share text: `"{title}" — institutional macro intelligence via GraphiQuestor`
- Uses existing `Dialog`/modal primitives from shadcn/ui

### Watermark layout
```
┌──────────────────────────────────────────────────────┐
│                  [captured card content]              │
├──────────────────────────────────────────────────────┤
│ ◆ GraphiQuestor · graphiquestor.com    FRED · Jun 05 │
└──────────────────────────────────────────────────────┘
```

### Known caveats
- Recharts SVG: renders correctly with html2canvas
- Cross-origin images (Leaflet tiles, external SVGs): require `crossOrigin="anonymous"` on `<img>` elements — handle per-component as needed, not globally
- `allowTaint: false` is conservative; flip to `true` only if a specific chart consistently fails

### Rollout — Terminal home (first pass)
Add `ShareButton` to these cards in `Terminal.tsx` and their child components:
- RegimeAnchor strip
- NetLiquidityRow card
- FedMonetizationMonitor card
- USTreasuryDemandGauge card
- USDebtMaturityWall card
- CorporateDebtMaturityWall card
- EnergySection primary chart card
- IndiaMacroDashboard key metric cards
- ChinaMacroPulseSection card
- (New) Central Bank Gold Net Purchases card
- (New) De-Dollarization Pressure card
- (New) Shadow System metric cards

Each card that hosts a `ShareButton` must:
- Have `relative` positioning (for absolute button placement)
- Have `group` class on the outer wrapper (for hover opacity)
- Pass a `ref` to the element being captured

---

## 2. MacroObservatory Cleanup

### Problem
`/macro-observatory` is a static card grid linking to 8 labs. `/labs` (`ThematicLabsIndexPage`) does the identical job. The route is not in the sidebar nav and has no live data.

### Changes

**`src/App.tsx`**
Replace:
```tsx
const MacroObservatory = lazy(...)
<Route path="/macro-observatory" element={<MacroObservatory />} />
```
With:
```tsx
<Route path="/macro-observatory" element={<Navigate to="/labs" replace />} />
```
Remove the `MacroObservatory` lazy import entirely.

**`src/pages/MacroObservatory.tsx`**
Delete the file.

**`src/layout/GlobalLayout.tsx`**
Remove:
```tsx
const isObservatory = location.pathname.includes('/macro-observatory');
// ...
{isObservatory && !isEmbedded && <DataHealthBanner />}
```
The `DataHealthBanner` conditional is dead once the route is gone. If the banner is wanted elsewhere, it can be promoted separately.

---

## 3. Two New Terminal ModuleRows

Both rows are added to `src/pages/Terminal.tsx`. Each card within a row is full-width (stacked vertically with `flex-col gap-6`), matching the pattern in `US SOVEREIGN STRESS`.

### Row A: DE-DOLLARIZATION & GOLD
Position: after `TRADE INTELLIGENCE`, before `INDIA MACRO`

```tsx
<ModuleRow label="DE-DOLLARIZATION & GOLD" href="/labs/de-dollarization-gold" labelColor="text-amber-500/80">
  {/* Card 1 — full width */}
  <Card variant="elevated">
    <CardHeader>
      <CardTitle>Central Bank Gold Net Purchases</CardTitle>
      <LiveStatusIndicator source="IMF COFER / WGC" />
    </CardHeader>
    <CardContent>
      <CentralBankGoldNetChart />   {/* new component, uses useCentralBankGoldNet */}
    </CardContent>
  </Card>

  {/* Card 2 — full width */}
  <Card variant="elevated">
    <CardHeader>
      <CardTitle>De-Dollarization Pressure</CardTitle>
      <LiveStatusIndicator source="IMF COFER / BRICS" />
    </CardHeader>
    <CardContent>
      <DeDollarizationPressureChart />  {/* new component, uses useDeDollarization + useBricsTracker */}
    </CardContent>
  </Card>
</ModuleRow>
```

**Hooks used:** `useCentralBankGoldNet`, `useDeDollarization`, `useBricsTracker`

**New child components needed:**
- `src/features/dashboard/components/rows/CentralBankGoldNetChart.tsx`
- `src/features/dashboard/components/rows/DeDollarizationPressureChart.tsx`

Both use Recharts (`BarChart` for CB gold, `LineChart` for COFER % trend). Both get `ShareButton`.

### Row B: SHADOW SYSTEM
Position: final row, after `SOVEREIGN COMPASS`, `alternateBg`

```tsx
<ModuleRow label="SHADOW SYSTEM" href="/labs/shadow-system" labelColor="text-zinc-400/80" alternateBg>
  {/* Card 1 — full width */}
  <ShadowTradeVolumeCard />   {/* uses useShadowTradeData */}

  {/* Card 2 — full width */}
  <CapitalFlightPressureCard />   {/* uses useShadowTradeData */}

  {/* Card 3 — full width */}
  <GeopoliticalOSINTCard />   {/* uses useGeopoliticalOSINT */}
</ModuleRow>
```

Each card: `MetricCard` or `Card variant="elevated"` with `FreshnessChip` (data is slower-moving, staleness visibility is important). Footer link: "Enter Shadow System Lab →" pointing to `/labs/shadow-system`.

**New child components needed:**
- `src/features/dashboard/components/rows/ShadowTradeVolumeCard.tsx`
- `src/features/dashboard/components/rows/CapitalFlightPressureCard.tsx`
- `src/features/dashboard/components/rows/GeopoliticalOSINTCard.tsx`

All three get `ShareButton`.

---

## Implementation Order

1. Install `html2canvas`
2. Build `useCardCapture` hook + `ShareButton` + `ShareModal`
3. Wire `ShareButton` into 3–4 existing Terminal cards to validate capture quality
4. Remove `/macro-observatory` (App.tsx + delete file + GlobalLayout cleanup)
5. Build `CentralBankGoldNetChart` + `DeDollarizationPressureChart` → add DE-DOLLARIZATION & GOLD row
6. Build Shadow System cards → add SHADOW SYSTEM row
7. Roll `ShareButton` out to all remaining cards

---

## Out of Scope
- Server-side OG image generation (future)
- Edge function consolidation (separate session)
- Other UI/UX improvements discussed (separate session)
