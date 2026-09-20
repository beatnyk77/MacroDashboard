# Infinite FAQ Component Design Specification

- **Date**: 2026-09-20
- **Status**: Approved
- **Topic**: Modern Infinite FAQ Component with Static Accordion and Streaming RAG AI Assistant
- **Design System**: GraphiQuestor Institutional Terminal (`DESIGN.md`)

---

## 1. Overview & Objectives

The **Infinite FAQ** is an institutional intelligence module designed to be dropped onto any desk, methodology article, or documentation page in GraphiQuestor. It combines:
1. **Curated Common Intelligence**: Instant answers to the most frequent domain-specific questions via expandable micro-accordions on the left (or top on mobile).
2. **Infinite AI RAG Terminal**: A dedicated, live command console on the right (or bottom on mobile) that allows capital allocators to ask any free-form question, streaming an institutional markdown answer grounded directly in GraphiQuestor's documentation corpus with verified internal links.

### Guiding Principles
- **No Marketing Fluff**: Straight-to-the-point macro answers, formulas, data refresh cadences, and source provenance.
- **Dual-Pane Information Density**: Side-by-side desktop layout (`5 cols / 7 cols`) ensuring zero loss of context while exploring dynamic queries.
- **Institutional Styling**: `#050810` canvas void, `#0b0f19` dark glass panel, `#1e293b` hairline border, `#38bdf8` electric blue and `#10b981` emerald accents, monospaced tabular numerals in `JetBrains Mono`.
- **Resilient Fallback**: Gracefully operates even if edge AI service is temporarily degraded or offline by falling back to local search matching and simulated streaming.

---

## 2. Architecture & Data Contracts

### 2.1 Component Hierarchy

```
src/
  types/
    faq.ts                         # Type definitions (FAQItem, FAQCatalogEntry, SessionQuery, etc.)
  data/
    faqCatalog.ts                  # Desk-specific curated questions, suggestions & doc scopes
  hooks/
    useRAGFAQ.ts                   # Streaming client, SSE parser, session history, rate-limiting & fallback
  components/faq/
    InfiniteFAQ.tsx                # Main drop-in container (dual-pane responsive layout)
    CuratedFAQList.tsx             # Curated accordion list with search filter & category badges
    FAQAccordionItem.tsx           # Individual expandable item with Framer Motion transitions
    AIRAGTerminal.tsx              # RAG console: auto-focus input, session history, telemetry badges
    StreamedMarkdownAnswer.tsx     # Markdown renderer with code highlighting & internal doc links
supabase/
  functions/
    rag-faq/
      index.ts                     # Deno Edge Function: semantic retrieval & SSE streaming
      knowledgeCorpus.ts           # Structured documentation & methodology knowledge base
```

### 2.2 Data Interfaces (`src/types/faq.ts`)

```typescript
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  citationUrl?: string;
  tags?: string[];
}

export interface FAQCatalogEntry {
  pageId: string;
  deskTitle?: string;
  subtitle?: string;
  docScope: 'global' | 'energy' | 'liquidity' | 'china' | 'india' | 'sovereign' | 'corporate' | 'api';
  items: FAQItem[];
  suggestedPrompts?: string[];
}

export interface SessionQuery {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  citations: Array<{ title: string; url: string }>;
  status: 'streaming' | 'completed' | 'error';
}

export interface RAGStreamPayload {
  question: string;
  pageId?: string;
  docScope?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
```

---

## 3. UI/UX Specifications

### 3.1 Left Column: Curated FAQ Accordion
- Expandable items with Framer Motion `layout` and smooth height transitions.
- Category micro-badge in `JetBrains Mono` (`[METHODOLOGY]`, `[INGESTION]`, `[DATA HEALTH]`).
- Clean chevron animation on expand/collapse.
- Optional copy-link icon allowing direct sharing of a question anchor.
- Optional search filter bar to quickly locate items if a desk has 5+ curated questions.

### 3.2 Right Column: Active AI RAG Terminal
- Prominent command prompt input with prompt prefix `query > ` and blinking caret.
- Helper micro-copy: *"The short ones are here. For anything else, just ask."*
- Auto-focused on initial page load (configurable via `autoFocus` prop).
- Suggested query chips (`[What is the M2/Gold formula?]`, `[How is TGA accounted for?]`).
- Status telemetry chip:
  - `IDLE`: Monospaced waiting prompt `READY`.
  - `READING_DOCS`: Amber/Cyan pulse `SCANNING DOCUMENTATION CORPUS...`.
  - `STREAMING`: Emerald pulse `STREAMING INTELLIGENCE [SSE]`.
  - `ERROR`: Crimson alert with `RETRY` trigger.
- Streamed response viewport:
  - Supports Markdown headings, bullet points, blockquotes, math syntax, and tables.
  - Formatted code blocks with copy action.
  - Interactive internal citation chips (`[Doc: Fiscal Dominance Meter](/methods/fiscal-dominance)`).
- Session question history tabs: allocators can toggle back to previous questions asked in the current session without re-querying.

---

## 4. Backend RAG & Edge Function

### 4.1 Supabase Edge Function (`supabase/functions/rag-faq/`)
- Accepts `POST` with JSON payload `{ question, pageId, docScope, history }`.
- Ingests and scores queries against `knowledgeCorpus.ts` containing GraphiQuestor's complete documentation:
  - Net Liquidity Z-Score, Fed Monetization, TGA, RRP.
  - Fiscal Dominance Meter, Debt-to-Gold Z-Score, Sovereign Spreads.
  - Energy Dependency Ratio, Strategic Petroleum Reserves.
  - India Credit Cycle, Sector Positioning, Loan-to-Job Efficiency.
  - China Debt Iceberg, LGFV exposure, Deflationary drag.
  - API endpoints, data ingestion cadences, staleness criteria.
- Returns a Server-Sent Events (`text/event-stream`) response that streams chunked text and citation payloads.
- Includes CORS headers and error handling.

### 4.2 Frontend Hook (`useRAGFAQ.ts`)
- Calls `supabase.functions.invoke('rag-faq')` or directly fetches `/functions/v1/rag-faq` with streaming reader.
- Employs fallback local matcher if edge function or API keys are unavailable, ensuring zero downtime in dev or disconnected mode.
- Includes rate-limit guard (1 query per 3s cooldown).

---

## 5. Verification & Testing

1. **Unit Tests**:
   - `InfiniteFAQ.test.tsx`: Tests rendering of curated static questions, accordion expand/collapse, pageId matching, prop overrides.
   - `AIRAGTerminal.test.tsx`: Tests auto-focus, submission handling, suggested prompt clicks, session history navigation.
   - `useRAGFAQ.test.ts`: Tests stream parsing, fallback execution, and abort functionality.
2. **Build and Quality Checks**:
   - `npm run lint` must pass with 0 warnings (`--max-warnings 0`).
   - `npm run test` must pass all tests cleanly.
   - Component demo integrated on a documentation / support route (e.g. `src/pages/APIDocsPage.tsx` or new `/support` / `/faq` preview).
