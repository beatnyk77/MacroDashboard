# Task 1 Report: SEC corporate transmission schema

Date: 2026-08-30
Workspace: `/Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard`

## Scope completed

Implemented Task 1 only for the SEC EDGAR strategic exposure plan.

- Created `supabase/migrations/20260830000000_sec_corporate_transmission.sql`
- Updated `src/types/database.types.ts`
- Updated `supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts`

No ingestion, signal computation, routing, UI, or documentation work outside the requested Task 1 report was added.

## What changed

### Migration

`supabase/migrations/20260830000000_sec_corporate_transmission.sql` now defines:

- `public.sec_corporate_issuers`
- `public.sec_filing_evidence`
- `public.sec_corporate_signals`
- `public.vw_latest_corporate_signals`
- `public.vw_corporate_transmission_summary`

The migration includes:

- issuer, accession, form type, signal id, macro theme, and observed timestamp indexes
- unique constraint on `(cik, accession_number, section_name, evidence_kind)`
- unique constraint on `(issuer_id, signal_id, observed_at)`
- check constraints for:
  - `freshness_status`: `fresh`, `lagged`, `very_lagged`, `unavailable`
  - `state`: `observed`, `measured`, `changed`, `confirmed`
  - `severity`: `info`, `watch`, `elevated`, `high`
- RLS enablement on all three base tables
- read policies for `anon` and `authenticated`
- `security_invoker = true` on both views
- `SELECT` grants on the base tables and both views

### Database types

`src/types/database.types.ts` now contains Task 1 table and view contracts for:

- `sec_corporate_issuers`
- `sec_filing_evidence`
- `sec_corporate_signals`
- `vw_latest_corporate_signals`
- `vw_corporate_transmission_summary`

The type update fixed malformed placeholder content that was already present in the working tree and restored a valid `severity` field plus the full `sec_filing_evidence` shape and relationship.

### Schema contract test

`supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts` now reads the migration from `process.cwd()` and asserts:

- all three required tables exist in the migration text
- both required unique constraints exist
- RLS is enabled for all three tables
- the read policies exist
- both views exist
- both views are marked `security_invoker = true`
- the freshness, state, and severity value guards exist

## Verification

Focused verification was run after the code changes.

1. `npx vitest run supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts`
   - Result: passed
   - Evidence: `1` test file passed, `3` tests passed

2. `npx tsc --noEmit`
   - Result: passed
   - Evidence: exit code `0`

## Notes

- The task brief expected the initial focused test to fail because the files did not exist. In the current workspace, the migration and schema test already existed as untracked files, and `src/types/database.types.ts` already contained partial malformed Task 1 edits. The implementation finished that in-progress state and verified the requested contract.

## Current status

Task 1 file work is in place and the focused verification completed successfully. Work stopped before any git staging or commit command was run.

## Commit status

No commit attempted before the user stopped further work. No git permission blocker was encountered because no git write command was executed in this stop-state.

## Concerns

- `vw_corporate_transmission_summary` aggregates from `sec_corporate_signals` and `sec_filing_evidence` directly, so counts represent all stored observations and evidence rows, not only the latest observation per issuer and signal. That matches the current migration, though downstream consumers should confirm whether summary cards are intended to reflect total history or latest-state snapshots.

## Fix round 1

Reviewer findings addressed on 2026-08-30.

### Changes made

- `vw_latest_corporate_signals` now joins each latest signal row to `sec_filing_evidence` through `unnest(ls.evidence_ids) WITH ORDINALITY`, preserving deterministic evidence order from the signal payload.
- The latest-signals view now exposes:
  - `freshness_status`
  - `accession_number`
  - `form_type`
  - `filing_date`
  - `acceptance_timestamp`
  - `document_url`
  - `section_name`
  - `evidence_kind`
  - `evidence_text`
  - ordered evidence-chain arrays for those same fields
  - `evidence_count`
- `vw_corporate_transmission_summary` now computes counts from a `latest_signals` CTE built with `DISTINCT ON (issuer_id, signal_id)` so repeated historical observations do not inflate landing counts.
- The schema contract test now asserts:
  - exact Task 1 table columns
  - required unique constraints
  - required indexes
  - RLS enablement and read policies
  - grants and public read behavior
  - deterministic evidence-chain fields in `vw_latest_corporate_signals`
  - latest-state summary behavior in `vw_corporate_transmission_summary`
- `src/types/database.types.ts` was expanded to match the latest-signals view fields added in this fix round.

### Verification evidence

Command:

```bash
npx vitest run supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts
```

Output:

```text
RUN  v4.1.8 /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard
Test Files  1 passed (1)
Tests  5 passed (5)
Duration  835ms
```

Command:

```bash
npx tsc --noEmit
```

Output:

```text
exit code 0
```

### Updated concerns

- `vw_latest_corporate_signals` now carries a deterministic evidence chain aligned to `evidence_ids`, including null entries if a referenced evidence row is missing. That preserves positional integrity for downstream consumers, and those consumers should treat nullable evidence-chain entries as an unavailable evidence condition rather than as a parsing error.
