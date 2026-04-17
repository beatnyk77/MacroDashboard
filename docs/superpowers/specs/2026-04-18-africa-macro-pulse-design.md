# Africa Macro Pulse Lab - Design & Implementation Plan

This document outlines the architecture, data model, and UI/UX approach for the new "Africa Macro Pulse" lab, an institutional-grade sovereign intelligence terminal for the African continent.

## 1. Goal Description

The Africa Macro Pulse Lab provides a surgical, high-signal lens on 8-10 macro-relevant African economies. It focuses on three core pillars: Sovereign Debt & Fiscal Stress, Commodity & Energy Exposure, and BRICS Trade Gravity. 

**Target Economies:** South Africa, Nigeria, Egypt, Kenya, Angola, Ghana, Ethiopia, Morocco, Algeria, Zambia.

## 2. Architecture & Data Sources

We will use standard automated data ingestion via Supabase Edge Functions.

### A. Data Pillars
1. **Sovereign Debt & Fiscal Stress**
   - **Metrics:** Debt-to-GDP, Debt Service Ratio, FX Reserves.
   - **Sources:** IMF (World Economic Outlook), World Bank (WDI).
2. **Commodity & Energy Exposure**
   - **Metrics:** Top Export reliance, Oil Production, Critical Minerals.
   - **Sources:** World Bank Commodity Markets, EIA/OPEC.
3. **Trade Gravity (BRICS Influence)**
   - **Metrics:** Import/Export volume (% to China vs US/EU).
   - **Sources:** UN Comtrade / World Bank.

### B. Backend Automation (Supabase)
- **Supabase Tables:**
  - `africa_macro_countries`: Metadata for the target 10 economies.
  - `africa_macro_metrics`: Time-series data storing the values for debt, energy, and trade.
- **Edge Functions:**
  - `ingest-africa-macro-data`: A scheduled CRON function to pull from IMF/WB APIs and update the `africa_macro_metrics` table monthly/quarterly.

## 3. UI/UX & Design Architecture

Following the `@ui-ux-pro-max` guidelines for high-signal, calm visual hierarchy:

- **Routing:** A new dedicated page at `/src/pages/labs/AfricaMacroPulse.tsx`.
- **Top Section - Monthly Snapshot:**
  - A summary card (similar to India Macro Dashboard) highlighting critical shifts (e.g., "Ghana restructuring", "Angola oil revenues").
- **Middle Section - Comparison Heatmap:**
  - Full-width data tables.
  - Color-coded cells (red/green) for Sovereign Stress Scores, FX coverage, and Trade Gravity.
  - Strict data-ink ratio (minimal borders, muted grid lines).
- **Bottom Section - Country Deep-Dives:**
  - Responsive grid of cards for each of the 10 countries.
  - Expandable to reveal specific line charts (e.g., Debt trajectory, Export basket breakdown).

## 4. AI SEO & Discoverability

Following the `@ai-seo` guidelines to ensure content is highly citable by AI engines:
- **Structure:** Clear definition blocks ("What is Africa Macro Pulse?") and standalone summary statistics.
- **Schema Markup:** Implement `Dataset` and `Article` schema for the macro data.
- **Extractability:** Use descriptive `<h2>` and `<h3>` tags (e.g., "Sovereign Debt Stress in Sub-Saharan Africa").

## 5. Proposed File Changes

### [NEW] `src/pages/labs/AfricaMacroPulse.tsx`
The main page component. Integrates the layout, SEO metadata (via Helmet), and fetches data from Supabase.

### [NEW] `src/features/dashboard/components/sections/africa/`
- `AfricaMacroSnapshot.tsx` (Top summary card)
- `AfricaComparisonHeatmap.tsx` (Middle cross-sectional table)
- `CountryDeepDiveCard.tsx` (Bottom expandable cards)

### [NEW] `supabase/functions/ingest-africa-macro/index.ts`
The Edge Function to orchestrate data ingestion from WB/IMF.

### [MODIFY] `src/App.tsx` & `src/components/Sidebar.tsx`
Add routing and navigation links for the new Africa Macro Pulse lab.
