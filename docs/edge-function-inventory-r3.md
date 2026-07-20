# Edge Function Inventory (R3)

Generated: 2026-07-20  
After R2 delete: **94** function dirs (excl. `_shared`).  
Target this cycle: **≤80 ACTIVE** via pilot delete of retired/debug/equity-adjacent wrappers.  
Hard ceiling **&lt;20** deferred to R4 consolidator design.

## Legend

| Status | Meaning |
|--------|---------|
| keep | Macro / CB / gold / platform required |
| pilot-delete | Removed in R3 pilot (repo); unschedule via migration |
| merge-candidate | Future R4 family merge |

## Pilot delete batch (14 → ~80)

| slug | reason |
|------|--------|
| api-auth-middleware | already retired |
| debug-logs | debug-only |
| execute-restoration-sql | one-shot ops |
| ingest-china-defaults | already retired |
| ingest-eurostat-debt | already retired |
| ingest-financial-hubs-gold | already retired |
| ingest-imf-gdp-per-capita | already retired |
| ingest-macro-events | already retired |
| llm-knowledge | non-telemetry |
| ingest-us-edgar-fundamentals | equities; out of macro wedge |
| ingest-corporate-debt-maturities | credibility: wall unmounted |
| ingest-events | low-value / merge later |
| ingest-events-markers | low-value / merge later |
| ingest-asi | non-core pilot |

**Timeout budget for future merges (R4):** max 60s wall for thin wrappers; do not fuse multi-source heavy ingests without partial-failure isolation in `serveIngest`.

## Keep families (not merged this cycle)

- **US/Fed:** ingest-fred, ingest-us-macro, ingest-fiscaldata, ingest-nyfed-markets, ingest-us-debt-maturities, ingest-yield-curves, …
- **India/RBI:** ingest-india-*, ingest-rbi-fx-defense, ingest-rbi-money-market, ingest-mospi, …
- **China:** ingest-china-*, ingest-pboc-liquidity, compute-china-debt-signals
- **Gold/energy:** ingest-gold*, ingest-cb-gold-net, ingest-oil-*, ingest-energy*, …
- **De-dollarization:** ingest-cofer, ingest-currency-wars, ingest-shadow-trade, ingest-bis-reer, ingest-tic-foreign-holders
- **Platform:** check-data-health, generate-*, send-*, get-newsletter-data, report-client-error, trigger-site-rebuild

## serveIngest adoption

Approx **80/94** wrappers already use `serveIngest` (`_shared/handler.ts`). R3 does not rewrite remaining bare handlers — inventory only + pilot deletes.

## R4 path to ≤19

Separate design required: source-family merges (FRED pack, India pack, China pack, oil pack, gold pack, platform pack) with cron remaps and timeout budgets. Do not claim &lt;20 after this cycle.
