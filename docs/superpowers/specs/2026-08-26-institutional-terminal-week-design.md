# Institutional Terminal Improvement Week

## Goal

Make GraphiQuestor faster to use for institutional macro professionals during a one-week improvement cycle. Preserve the current public data model, source claims, and terminal aesthetic. Prefer existing hooks and views over new ingestion work.

## Priority order

1. Desk context strip: regime, freshness, data-health state, and anchor metrics above the main modules. (1–2 days)
2. Change deltas on major cards: latest observation, prior observation, absolute change, and period. (2–3 days)
3. Cross-asset watchlist view using existing live metrics. (2–4 days)
4. Inline provenance contract on metric cards. (1–2 days)
5. URL-addressable views and local saved desk presets. (3–5 days)
6. Sidebar grouping into Core Desk, Regional, Structural, and Methods. (1–2 days)
7. Consistent stale, delayed, unavailable, and loading states. (2–3 days)
8. Feature-level extraction for repeated query and card logic. (3–5 days)
9. Module-level diagnostics for data integrity and operational failure. (2–3 days)
10. Route and component performance budgets in CI. (2–4 days)

## Architecture

Build each item as a small feature component or utility over the existing TanStack Query hooks. The first item will be `DeskContextStrip`, rendered by `Terminal` between the SEO/snapshot content and the regime anchor. It will consume `useRegime`, `useDataIntegrity`, and three existing `useLatestMetric` calls. Every remote value remains optional and renders an explicit unavailable state.

The change-delta work will extend the canonical metric response with a stable presentation helper rather than duplicating arithmetic in cards. Watchlist and saved views will use a registry of metric IDs so URL state stays deterministic. Provenance and state handling will reuse `FreshnessChip`, `DataProvenanceBadge`, and existing data-state primitives.

## UX behavior

The context strip is compact, keyboard navigable, and horizontally scrollable on small screens. Anchor metrics link to their existing terminal sections or methodology pages. The strip shows the observation date and freshness state beside the value. It never displays build-time fallback numbers as if they were live.

Navigation changes will preserve every route. Saved presets will be local to the browser until an authenticated persistence path exists. Public data-health remains public; operational diagnostics remain behind the existing admin boundary.

## Error handling

Loading uses skeletons. Missing Supabase data uses `—` and an unavailable label. Stale data stays visible with its freshness state. Query failures stay isolated by the existing section error boundaries. No new mutation or backend write is required for the first four items.

## Testing

Add component tests for the context strip covering loading, fresh, lagged, unavailable, and anchor-link behavior. Add pure helper tests for change deltas and watchlist URL serialization. Run lint, TypeScript, the relevant Vitest files, and the production Vite build after each staged change.

## First implementation

Implement the desk context strip first. Keep the existing snapshot strip intact for crawler-facing build output. The new strip is the interactive desk layer and should not replace provenance metadata already emitted by the snapshot.
