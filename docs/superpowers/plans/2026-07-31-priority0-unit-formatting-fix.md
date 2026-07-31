# Priority 0: Fed Balance Sheet / TGA Unit-Formatting Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the homepage "Key telemetry" strip showing `$6747.38T` (Fed Balance Sheet) and `$829.62T` (TGA) instead of their real values (~$6.7T and ~$0.83B) by replacing a substring-matching formatting heuristic with an explicit, tested per-metric scale lookup.

**Architecture:** Extract the scale/divisor/label logic that `TerminalSnapshotStrip.tsx` currently inlines (and gets wrong) into a small, independently-tested pair of functions in `src/utils/formatNumber.ts`: `formatScaledMetric` (production formatting, non-fatal on out-of-range) and `assertMetricSanityRange` (strict, throws — used by tests as the "fails loudly in CI" guard). `TerminalSnapshotStrip.tsx` then calls the tested function instead of reimplementing the math inline.

**Tech Stack:** TypeScript, React, Vitest. No new dependencies.

## Global Constraints

- Run `npm run lint && npm run build` after every change and report results.
- Never add heavy new dependencies without flagging it first (this plan adds none).
- Preserve existing functionality — every other metric's display path in `TerminalSnapshotStrip.tsx` (GOLD, YIELD, VIX_INDEX, DXY_INDEX, and the build-time-fallback `m.display` path) must behave identically after this change.
- Prefer the smallest diff that fully fixes the issue — no ingestion scale changes, no metric ID renames, no changes to Supabase schema or `metric_observations` rows (ruled out explicitly in the spec).
- This is Priority 0 of a 4-priority sequential worklist. This plan covers Priority 0 only.

Reference spec: `docs/superpowers/specs/2026-07-31-priority0-unit-formatting-fix-design.md`

---

### Task 1: Add tested scale/format utilities to `formatNumber.ts`

**Files:**
- Modify: `src/utils/formatNumber.ts`
- Test: `src/utils/__tests__/formatNumber.test.ts`

**Interfaces:**
- Produces:
  - `interface ScaledMetricConfig { divisor: number; suffix: string; sanityRange: [number, number]; }`
  - `const SNAPSHOT_METRIC_SCALES: Record<string, ScaledMetricConfig>`
  - `function formatScaledMetric(metricId: string, rawValue: number): string | null` — returns `null` if `metricId` has no entry in `SNAPSHOT_METRIC_SCALES` (caller falls back to its own logic); otherwise returns `"${scaled.toFixed(2)}${suffix}"`. Logs `console.warn` (does not throw) if the scaled value falls outside `sanityRange`.
  - `function assertMetricSanityRange(metricId: string, rawValue: number): void` — throws if `metricId` has no config, or if the scaled value falls outside `sanityRange`. Used by tests as the "fails loudly" guard, not called from render paths.

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `src/utils/__tests__/formatNumber.test.ts` (before the final closing `});` of the outer `describe('formatNumber utilities', ...)` block):

```ts
  describe('formatScaledMetric', () => {
    it('formats FED_BALANCE_SHEET raw millions as trillions', () => {
      // Raw FRED WALCL value in millions ($6,747,380M = $6.75T)
      expect(formatScaledMetric('FED_BALANCE_SHEET', 6747380)).toBe('6.75T');
    });

    it('formats TGA_BALANCE_BN raw millions as billions', () => {
      // Raw FRED WTREGEN value in millions ($829,620M = $829.62B)
      expect(formatScaledMetric('TGA_BALANCE_BN', 829620)).toBe('829.62B');
    });

    it('returns null for unmapped metric ids', () => {
      expect(formatScaledMetric('SOME_OTHER_METRIC', 12345)).toBeNull();
    });

    it('warns but does not throw when a value is outside the sanity range', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // 500,000M = $0.5T — below the [1, 15] plausible range for Fed balance sheet
      expect(formatScaledMetric('FED_BALANCE_SHEET', 500000)).toBe('0.50T');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });
  });

  describe('assertMetricSanityRange', () => {
    it('does not throw for a plausible FED_BALANCE_SHEET value', () => {
      expect(() => assertMetricSanityRange('FED_BALANCE_SHEET', 6747380)).not.toThrow();
    });

    it('does not throw for a plausible TGA_BALANCE_BN value', () => {
      expect(() => assertMetricSanityRange('TGA_BALANCE_BN', 829620)).not.toThrow();
    });

    it('throws for a FED_BALANCE_SHEET value outside [1, 15]T', () => {
      // 500,000M = $0.5T — implausibly low for the modern Fed balance sheet
      expect(() => assertMetricSanityRange('FED_BALANCE_SHEET', 500000)).toThrow(/outside plausible range/);
    });

    it('throws for a TGA_BALANCE_BN value outside [50, 2000]B', () => {
      // 10,000,000M = $10,000B — implausibly high for the TGA
      expect(() => assertMetricSanityRange('TGA_BALANCE_BN', 10000000)).toThrow(/outside plausible range/);
    });

    it('throws for an unmapped metric id', () => {
      expect(() => assertMetricSanityRange('SOME_OTHER_METRIC', 12345)).toThrow(/no scale config/);
    });
  });
```

Update the import at the top of the test file to include the two new names:

```ts
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDelta,
  formatBillions,
  formatTrillions,
  getSignalLabel,
  formatScaledMetric,
  assertMetricSanityRange
} from '../formatNumber';
```

And add `vi` to the vitest import at the top of the file:

```ts
import { describe, it, expect, vi } from 'vitest';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/formatNumber.test.ts`
Expected: FAIL — `formatScaledMetric` and `assertMetricSanityRange` are not exported from `../formatNumber` (TypeScript/import error or `undefined is not a function`).

- [ ] **Step 3: Implement the utilities**

Add to `src/utils/formatNumber.ts`, after `formatTrillions` (after the closing `};` on line 144) and before `getSignalLabel`:

```ts
/**
 * Per-metric scale configuration for values whose raw storage unit doesn't
 * match a generic 1e3/1e6/1e9/1e12 heuristic. Add an entry here — with a
 * verified divisor and a plausible historical range — before displaying a
 * new metric through formatScaledMetric.
 */
export interface ScaledMetricConfig {
    /** Raw value is divided by this to reach the display unit. */
    divisor: number;
    /** Unit suffix appended after scaling (e.g. 'T', 'B'). */
    suffix: string;
    /** Plausible historical range for the *scaled* value: [min, max]. */
    sanityRange: [number, number];
}

export const SNAPSHOT_METRIC_SCALES: Record<string, ScaledMetricConfig> = {
    // Raw value from FRED WALCL, stored in millions of USD.
    FED_BALANCE_SHEET: { divisor: 1e6, suffix: 'T', sanityRange: [1, 15] },
    // Raw value from FRED WTREGEN, stored in millions of USD despite the
    // "_BN" suffix in the metric id — see ingest-nyfed-markets/index.ts.
    TGA_BALANCE_BN: { divisor: 1e3, suffix: 'B', sanityRange: [50, 2000] },
};

/**
 * Format a raw metric value using its configured scale/suffix.
 * Returns null when the metric has no entry in SNAPSHOT_METRIC_SCALES so
 * callers can fall back to their own logic. Never throws — logs a warning
 * if the scaled value falls outside its plausible historical range, since
 * this runs on the render path and a bad data point shouldn't crash the UI.
 */
export const formatScaledMetric = (metricId: string, rawValue: number): string | null => {
    const config = SNAPSHOT_METRIC_SCALES[metricId];
    if (!config) return null;

    const scaled = rawValue / config.divisor;
    const [min, max] = config.sanityRange;
    if (scaled < min || scaled > max) {
        console.warn(
            `formatScaledMetric: ${metricId} resolved to ${scaled.toFixed(2)}${config.suffix}, outside plausible range [${min}, ${max}]${config.suffix}. Raw value: ${rawValue}.`
        );
    }

    return `${scaled.toFixed(2)}${config.suffix}`;
};

/**
 * Strict sanity-range check for CI/tests: throws if the metric is unmapped
 * or if its scaled value falls outside the configured plausible range.
 * Not called from render paths — use formatScaledMetric there instead.
 */
export const assertMetricSanityRange = (metricId: string, rawValue: number): void => {
    const config = SNAPSHOT_METRIC_SCALES[metricId];
    if (!config) {
        throw new Error(`assertMetricSanityRange: no scale config for metric "${metricId}"`);
    }

    const scaled = rawValue / config.divisor;
    const [min, max] = config.sanityRange;
    if (scaled < min || scaled > max) {
        throw new Error(
            `${metricId} resolved to ${scaled.toFixed(2)}${config.suffix}, outside plausible range [${min}, ${max}]${config.suffix} (raw value: ${rawValue})`
        );
    }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/formatNumber.test.ts`
Expected: PASS — all tests including the new `formatScaledMetric` and `assertMetricSanityRange` suites.

- [ ] **Step 5: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean (0 errors, `--max-warnings 0` for lint).

- [ ] **Step 6: Commit**

```bash
git add src/utils/formatNumber.ts src/utils/__tests__/formatNumber.test.ts
git commit -m "$(cat <<'EOF'
fix(utils): add tested per-metric scale formatter for balance-sheet metrics

FED_BALANCE_SHEET and TGA_BALANCE_BN raw values are stored in millions but
need different display scales (trillions vs billions respectively). Adds
formatScaledMetric (non-throwing, render-safe) and assertMetricSanityRange
(throws, for tests) so TerminalSnapshotStrip can stop guessing scale from
metric_id substrings.
EOF
)"
```

---

### Task 2: Wire `TerminalSnapshotStrip.tsx` to the new formatter

**Files:**
- Modify: `src/features/dashboard/components/TerminalSnapshotStrip.tsx:1-46`

**Interfaces:**
- Consumes: `formatScaledMetric(metricId: string, rawValue: number): string | null` from `src/utils/formatNumber.ts` (Task 1).

- [ ] **Step 1: Add the import**

In `src/features/dashboard/components/TerminalSnapshotStrip.tsx`, add to the import block at the top (after the existing `cn` import on line 8):

```ts
import { formatScaledMetric } from '@/utils/formatNumber';
```

- [ ] **Step 2: Replace the buggy inline branch**

Replace lines 35–46 (the `display` computation inside `SnapshotCell`):

```ts
    const display =
        live?.value != null && Number.isFinite(Number(live.value))
            ? (() => {
                  const n = Number(live.value);
                  if (m.metricId.includes('GOLD') && n > 100) return `$${Math.round(n).toLocaleString()}`;
                  if (Math.abs(n) >= 1000 && (m.metricId.includes('BALANCE') || m.metricId === 'FED_BALANCE_SHEET'))
                      return `${(n / 1000).toFixed(2)}T`;
                  if (m.metricId.includes('YIELD') || m.metricId === 'VIX_INDEX' || m.metricId === 'DXY_INDEX')
                      return n.toFixed(2);
                  return m.display;
              })()
            : m.display;
```

with:

```ts
    const display =
        live?.value != null && Number.isFinite(Number(live.value))
            ? (() => {
                  const n = Number(live.value);
                  if (m.metricId.includes('GOLD') && n > 100) return `$${Math.round(n).toLocaleString()}`;
                  const scaled = formatScaledMetric(m.metricId, n);
                  if (scaled != null) return scaled;
                  if (m.metricId.includes('YIELD') || m.metricId === 'VIX_INDEX' || m.metricId === 'DXY_INDEX')
                      return n.toFixed(2);
                  return m.display;
              })()
            : m.display;
```

This preserves the GOLD and YIELD/VIX/DXY branches exactly as they were, and replaces only the broken balance-sheet branch with the explicit, tested lookup. Any metric not in `SNAPSHOT_METRIC_SCALES` (i.e. everything except `FED_BALANCE_SHEET` and `TGA_BALANCE_BN`) falls through to `m.display` exactly as before — unchanged behavior.

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add src/features/dashboard/components/TerminalSnapshotStrip.tsx
git commit -m "$(cat <<'EOF'
fix(dashboard): correct Fed balance sheet / TGA scale on homepage telemetry strip

TerminalSnapshotStrip was dividing by 1000 and always labeling "T" for any
metric_id containing "BALANCE", which mislabeled FED_BALANCE_SHEET (needs
/1e6) and wrongly bucketed TGA_BALANCE_BN (needs /1e3, label B) into the
same branch. Now uses the tested formatScaledMetric lookup.
EOF
)"
```

---

### Task 3: Document the `TGA_BALANCE_BN` unit mismatch at the ingest source

**Files:**
- Modify: `supabase/functions/ingest-nyfed-markets/index.ts:39-40`

**Interfaces:** None — documentation-only change, no behavior change.

- [ ] **Step 1: Add the clarifying comment**

Replace lines 39–40:

```ts
    // 1. TGA (FRED - WTREGEN) - Billions
    await fetchFred('WTREGEN', 'TGA_BALANCE_BN');
```

with:

```ts
    // 1. TGA (FRED - WTREGEN)
    // NOTE: metric_id says "_BN" but WTREGEN reports in MILLIONS of dollars.
    // Raw value is stored as-is (millions) — do not rename this id or
    // rescale it here without migrating every consumer that assumes
    // millions (src/hooks/useNetLiquidity.ts, NetLiquidityCard.tsx,
    // the vw_net_liquidity SQL view, and formatNumber.ts's
    // SNAPSHOT_METRIC_SCALES).
    await fetchFred('WTREGEN', 'TGA_BALANCE_BN');
```

- [ ] **Step 2: Verify no behavior change**

Run: `npm run lint && npm run build`
Expected: both clean (this is a comment-only diff — build output should be unaffected).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ingest-nyfed-markets/index.ts
git commit -m "$(cat <<'EOF'
docs(gfp): clarify TGA_BALANCE_BN stores millions despite its name

Prevents the next person from "fixing" the metric_id's apparent unit
mismatch by rescaling storage, which would break NetLiquidityCard and
vw_net_liquidity — both already correctly assume millions.
EOF
)"
```

---

### Task 4: Full verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including the new `formatScaledMetric`/`assertMetricSanityRange` suites from Task 1.

- [ ] **Step 2: Run lint and build one more time on the full diff**

Run: `npm run lint && npm run build`
Expected: both clean.

- [ ] **Step 3: Manual browser verification**

Start the dev server and open the homepage. In the "Key telemetry" strip:
- Fed Balance Sheet should display as approximately `$6.7T`–`$6.8T` (not a 4-digit number followed by `T`).
- TGA should display as approximately `$0.8B`–`$0.9B`-scale, i.e. a number in the hundreds followed by `B` (not followed by `T`).

If Supabase env vars aren't configured for the dev session, the strip falls back to the build-time `terminal-snapshot.json` values — confirm those also render sensibly (this path is unchanged by this plan, but worth a glance).

- [ ] **Step 4: Report**

Summarize for the user: lint/build/test output, the corrected Fed Balance Sheet and TGA figures observed, and confirmation both fall within the plausible historical ranges defined in `SNAPSHOT_METRIC_SCALES` ($1T–$15T and $50B–$2000B respectively).
