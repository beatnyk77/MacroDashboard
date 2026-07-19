# SDD Progress — Credibility Sprint PR1+PR2
Branch: fix/credibility-sprint-pr1-pr2
Started: 2026-07-20
Merge-base: 3ab2222

## Tasks
- T1 types: complete (supabase gen types --linked)
- T2 India kill: complete (unmount Terminal+IntelIndia, migration unschedule, deprecate file)
- T3 corp debt: complete (USD presentation + FreshnessChip + withhold stale >30d)
- T4 credit cycle: complete (freshness SLA + dual-exit UI, no green pulse when lagged)
- T5 regime digest: complete (archive gaps, DEV-only regenerate, provenance)
- T6 gold arb: complete (empty-write throw + FreshnessChip + withhold stale >72h)
- T7 tests: complete (credibilitySprintMounts + corp debt tests)
- T8 morning brief UI: complete (desk 3-col restyle + provenance)
- T9 regime digest UI: complete (archive gaps + hierarchy)
- T10 ISSUES_LEDGER TODOs: complete (P2-010, P2-011, P1-010)

## Verify
- tsc --noEmit: exit 0
- vitest credibility + CorporateDebt: 10/10 pass
- eslint changed files: exit 0
