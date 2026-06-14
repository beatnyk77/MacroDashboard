# Monthly Regime Digest Implementation Plan

## Goal
Transform the existing monthly regime digest into an elite, holistic, automated institutional report that serves as the definitive macro view for sovereign CIOs and central bankers. The report will synthesize US, China, India, Africa Macro Pulses, Energy/Commodities, and Sovereign Stress metrics into a single cohesive narrative.

## Diagnosis of Current Limitations
1. **Lack of Automated Narrative Synthesis**: Currently, the platform relies on static or heuristically derived weekly digests (e.g., `generate-weekly-regime-digest`). True holistic cross-pillar synthesis requires an LLM to weave complex interconnections (like US fiscal dominance → de-dollarization → commodity capital flows).
2. **Siloed Data**: Existing monthly snapshots (India, Africa, China, etc.) sit in separate tables and are not effectively bridged into a single unified summary.
3. **No Native `pg_cron` Automation**: The monthly digest lacks a dedicated `pg_cron` schedule to execute at exactly 00:30 UTC on the 1st of the month.
4. **Tone Caliber**: The current frontend and heuristic outputs lack the distinct, authoritative "Luke Gromen / Bridgewater" tone required for elite institutional consumers.

## User Review Required
> [!IMPORTANT]
> **LLM Provider & Key**: The new Edge Function relies on calling an LLM (OpenAI `gpt-4-turbo` or `gpt-4o`) to generate the elite institutional narrative. 
> I will implement the Deno fetch call using `OPENAI_API_KEY`. **Please confirm that you have an `OPENAI_API_KEY` configured in your Supabase project's secrets.**

> [!WARNING]
> **Overwriting Existing Frontend Routes**: The plan is to retain the `/regime-digest` routes but heavily polish `RegimeDigestPage.tsx` and `RegimeDigestArchivePage.tsx` to elevate the UI to an institutional standard. Please review if you have any strict layout constraints to maintain.

## Open Questions
1. Do you want to use a specific LLM model (e.g., `gpt-4o` vs `claude-3-opus`) for the generation? (I will default to `gpt-4o` via OpenAI if unspecified).
2. Are there any strict word count limits for the Executive Summary or Forward Outlook sections?

## Proposed Changes

### Supabase Database & Migrations
#### [NEW] `supabase/migrations/[timestamp]_add_monthly_digest_cron.sql`
- Enable the `pg_net` and `pg_cron` extensions if not already enabled.
- Create a cron job named `monthly_regime_digest_job` running `30 0 1 * *` (1st of every month at 00:30 UTC).
- Configure the cron job to use `net.http_post` to trigger the `generate-monthly-regime-digest` Edge Function.

---

### Supabase Edge Functions
#### [NEW] `supabase/functions/generate-monthly-regime-digest/index.ts`
- **Data Ingestion Step**: Sequentially queries `us_macro`, `china_macro_pulse`, `india_macro_snapshots`, `africa_macro_snapshots`, `commodity_prices`, `energy`, `cb_gold_net`, and `us_fiscal_stress` (picking the latest 1-2 records).
- **Prompt Engineering**: Compiles these JSON payloads into an extensive context string. The system prompt will enforce an elite institutional tone (Bridgewater/Luke Gromen style) and dictate the output format:
  1. Executive Summary
  2. Key Regime Shifts
  3. What Changed vs Last Month + Historical Context
  4. Forward Outlook (Next 30–60 Days)
- **OpenAI Integration**: Calls the `api.openai.com/v1/chat/completions` endpoint with `response_format` explicitly demanding the content be returned as clean, self-contained HTML (using semantic tags and specific styling classes) and plain text.
- **Database Upsert**: Inserts the resulting `html_content`, `plain_text`, `subject_line`, and `year_month` (e.g., "2026-04") into the `monthly_regime_digests` table.

---

### Frontend Components
#### [MODIFY] `src/pages/RegimeDigestPage.tsx`
- Refine the layout and typography to match a highly premium, institutional reading experience.
- Enhance the HTML rendering container (e.g., `dangerouslySetInnerHTML` wrapper) to ensure the LLM-generated HTML looks native and stunning (using `prose` modifiers).
- Implement robust SEO meta tags based on the generated subject line and summary.

#### [MODIFY] `src/pages/RegimeDigestArchivePage.tsx`
- Elevate the UI of the archive listing to feel like a high-tier research portal.

#### [MODIFY] `src/features/dashboard/components/sections/RegimeDigestSection.tsx`
- Ensure the monthly digest section on the main dashboard highlights the latest narrative effectively.

## Verification Plan

### Automated Tests
- Run `npm run lint` and `npm run build` locally to verify TypeScript types and build stability.

### Manual Verification
- After deployment, invoke the new Edge Function manually (via curl or Supabase dashboard) to simulate a 1st-of-month run.
- Inspect the generated record in `monthly_regime_digests` for tone, structure, and HTML quality.
- Load the frontend at `/regime-digest` and `/regime-digest/YYYY/MM` to confirm visual aesthetics, SEO tags, and responsive design.
