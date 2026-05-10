# Spec: Export Scout Playbook Redesign (McKinsey-Grade)

## Status: Draft
## Date: 2026-05-10
## Author: Antigravity

---

## 1. Overview
Transform the "Export Scout" feature into a premium, executive-grade strategic document generator. The system will shift from generating basic HTML to producing a structured, 3-page "McKinsey-style" strategic report delivered via a JSON API and rendered by a dedicated React frontend.

## 2. Goals
- **Executive Quality**: Every section must feel written by a principal-level strategy consultant.
- **Dynamic Insight**: Use LLM synthesis to provide product-specific strategic logic for any HS code.
- **Visual Excellence**: Implement a 3-page document layout with premium typography (`Syne`, `Inter`).
- **Actionability**: Focus on "What to do now" rather than just "What the data says."

---

## 3. Architecture

### 3.1 Edge Function (`generate-export-scout`)
- **Type**: JSON API
- **Data Source**: Supabase (`trade_demand_cache`, `trade_supplier_breakdown`).
- **Intelligence Layer**: OpenAI (GPT-4o/Gemini) integration.
- **Responsibilities**:
  1. Fetch raw trade data for the requested HS code.
  2. Compute quantitative metrics (TAM, India Share, YoY Growth, Opportunity Score).
  3. Construct a detailed prompt with the raw data and product description.
  4. Invoke OpenAI to generate strategic sections (Headline, Summary, "Path of Least Resistance", "Why Now", Outreach Templates).
  5. Return a strict JSON object matching the requested schema.

### 3.2 Frontend (`src/pages/ExportScoutPlaybookPage.tsx`)
- **Route**: `/trade/playbook/:code`
- **Responsibilities**:
  1. Fetch the JSON from the Edge Function.
  2. Render a 3-page "Document" layout.
  3. Implement premium styling (Dark institutional headers, high-contrast metric cards, ranked beachhead tables).
  4. Support `@media print` for professional PDF export.

---

## 4. Detailed Sections (The "3-Page" Document)

### Page 1: Executive Summary & Priority Beachheads
- **Header**: Dark institutional bar with GraphiQuestor branding.
- **Metric Cards**: Total Market, India Share, Opportunity Score, Growth Driver.
- **Summary**: 3–5 lines of high-level strategic context.
- **Beachhead Table**: Top 8 countries ranked by Opportunity Score with progress bars for India Share.

### Page 2: Market Intelligence & Strategy
- **Trends & Drivers**: AI-generated analysis of industry-specific demand factors.
- **Strategic Insight**: "Path of Least Resistance" box highlighting the core export logic.
- **Phase-wise Strategy**: Tiered GTM roadmap (Phase 1/2/3).
- **Compliance**: Country-specific certification notes.

### Page 3: 90-Day Execution Playbook
- **Timeline**: Week 1–12 visual roadmap with specific milestones.
- **Outreach Templates**: Customized B2B scripts for Email, LinkedIn, and WhatsApp.
- **Pipeline Setup**: Simple CRM-style starter view for tracking leads.

---

## 5. Success Criteria
1. **Dynamic Content**: Playbooks for "Centrifugal Pumps" (8413) look fundamentally different from "Smartphones" (8517).
2. **Visual Bar**: The document passes the "McKinsey Test" (generous whitespace, clear hierarchy, institutional feel).
3. **Performance**: Document generates within < 10 seconds (including LLM latency).
4. **Reliability**: Schema validation ensures the frontend never breaks on empty or partial data.

---

## 6. Implementation Plan
1. **Refactor Edge Function**: Transition to JSON output and integrate OpenAI.
2. **Create Frontend Page**: Build the `ExportScoutPlaybookPage` and its sub-components.
3. **Add Routing**: Register the new route in `App.tsx`.
4. **Polish UI**: Implement the `Syne` typography and dark theme.
5. **Verify**: Test with 3 different HS code categories (Machinery, Chemicals, Apparel).
