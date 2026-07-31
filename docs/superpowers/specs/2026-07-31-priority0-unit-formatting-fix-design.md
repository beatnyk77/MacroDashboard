# Priority 0: Fed Balance Sheet / TGA unit-formatting bug

Date: 2026-07-31
Status: Approved for implementation

## Problem

Production shows `$6747.38T` for the Fed Balance Sheet and `$829.62T` for TGA in the
homepage "Key telemetry" strip. Real values are ~$6.7T and ~$0.83T respectively — off
by ~1000x with a wrong unit label.

## Root cause

`SnapshotCell` in
[`src/features/dashboard/components/TerminalSnapshotStrip.tsx`](../../../src/features/dashboard/components/TerminalSnapshotStrip.tsx)
(lines 39–44) formats live-hydrated values with a substring heuristic:

```ts
if (Math.abs(n) >= 1000 && (m.metricId.includes('BALANCE') || m.metricId === 'FED_BALANCE_SHEET'))
    return `${(n / 1000).toFixed(2)}T`;
```

Two independent bugs collapse into this one line:

1. **Wrong divisor for `FED_BALANCE_SHEET`.** The raw value stored in
   `metric_observations` comes from FRED's `WALCL` series in **millions** (ingested
   as-is by `supabase/functions/ingest-fred/index.ts`, no scale applied). Millions →
   trillions requires `/1e6`, not `/1e3`. `/1e3` only reaches billions, then gets
   mislabeled `T`.
2. **Wrong bucket entirely for `TGA_BALANCE_BN`.** It matches the same branch purely
   because its metric ID string contains `"BALANCE"`. Its raw value is also stored in
   millions (from FRED's `WTREGEN`, via
   `supabase/functions/ingest-nyfed-markets/index.ts`, which never applies a scale
   despite the code comment claiming "Billions"). It should resolve to **billions**
   (`/1e3` → `B`), not trillions.

## What's already correct (verified, not touched)

`NetLiquidityCard.tsx` (lines 35–37) reads the *same* raw `metric_observations`
values and formats them correctly today:

```ts
{ label: 'Fed Assets', value: `$${formatNumber(netLiq?.fed_assets ? netLiq.fed_assets / 1e6 : 0, ...)}T` }
{ label: 'TGA Balance', value: `$${formatNumber(netLiq?.tga_balance ? netLiq.tga_balance / 1e3 : 0, ...)}B` }
```

This is the reference implementation the fix will match.

Audited and confirmed correct (consistent divisor for their known source units, no
change needed): `ECBBalanceSheetCard`, `BoJBalanceSheetCard`, `USDebtMaturityWall`,
`CorporateDebtMaturityWall`, `ShadowTradeCard`, `ChinaLGFFiscalPanel`,
`IndiaLiquidityStressMonitor`, `IndiaDigitizationPremiumMonitor`, `ASISection`,
`FundingPlumbingStress`, `FedMonetizationMonitor` (both `rows/` and `labs/`
variants), `ingest-global-liquidity`'s `cb_aggregate` computation (Global M2, CB
Aggregate). No other instance of the `.includes('BALANCE')`-style heuristic exists
in the codebase.

## Explicitly out of scope (and why)

- **Rescaling `TGA_BALANCE_BN` at ingestion** so its stored value matches its `_BN`
  name. Rejected: `NetLiquidityCard` and the `vw_net_liquidity` SQL view already
  correctly assume the stored value is millions; rescaling storage would silently
  break both. The bug is in one consumer's math, not the pipeline.
- **Renaming `TGA_BALANCE_BN`** to something accurate (e.g. `TGA_BALANCE_MN`).
  Rejected for this pass: touches the ingest function, `metricIds.ts`, every
  consumer, and live `metric_observations` history under that ID — too large a
  blast radius for an urgent production fix. Addressed instead with a code comment
  (see below).

## Fix

**File: `src/features/dashboard/components/TerminalSnapshotStrip.tsx`**

Replace the substring-matching branch with an explicit per-metric lookup (no
metric ID is bucketed by accident):

```ts
const SNAPSHOT_SCALE: Record<string, { divisor: number; suffix: string }> = {
    FED_BALANCE_SHEET: { divisor: 1e6, suffix: 'T' }, // raw value: millions (FRED WALCL)
    TGA_BALANCE_BN: { divisor: 1e3, suffix: 'B' },     // raw value: millions (FRED WTREGEN, despite the _BN name)
};
```

`SnapshotCell` looks up `SNAPSHOT_SCALE[m.metricId]` instead of testing
`.includes('BALANCE')`. Unmapped metrics fall through to the existing behavior
unchanged (build-time `m.display`, or the existing GOLD/YIELD/VIX/DXY branches).

**File: `src/utils/formatNumber.ts`**

Extract the scale+label logic into a small exported, testable function (e.g.
`formatScaledMetric(value, config)`) so `TerminalSnapshotStrip` calls a tested unit
instead of inlining the arithmetic again.

**File: `supabase/functions/ingest-nyfed-markets/index.ts`**

Add the documentation comment (agreed scope: comment/metadata only, no rename):

```ts
// 1. TGA (FRED - WTREGEN)
// NOTE: metric_id says "_BN" but WTREGEN reports in MILLIONS of dollars.
// Raw value is stored as-is (millions) — do not rename this ID without
// migrating every consumer that assumes millions (NetLiquidityCard,
// vw_net_liquidity, TerminalSnapshotStrip).
await fetchFred('WTREGEN', 'TGA_BALANCE_BN');
```

## Testing

Add to `src/utils/__tests__/formatNumber.test.ts`:

- Regression tests for both metrics using realistic raw (millions) sample inputs,
  asserting the exact corrected output string.
- Sanity-range assertions that fail loudly if a formatted value falls outside a
  plausible historical band:
  - `FED_BALANCE_SHEET`: resolved trillions must be within `[1, 15]`.
  - `TGA_BALANCE_BN`: resolved billions must be within `[50, 2000]`.

These ranges live next to the scale config so a future metric added to
`SNAPSHOT_SCALE` is expected to bring its own range.

## Verification

- `npm run lint && npm run build` — must be clean.
- `npx vitest run src/utils/__tests__/formatNumber.test.ts` — new tests pass.
- Manual check in the dev server: homepage "Key telemetry" strip shows Fed Balance
  Sheet as `$~6.7T` and TGA as `$~0.8B`–`$~0.9B` (whatever the current live value
  is), not `T`-suffixed four-digit numbers.
