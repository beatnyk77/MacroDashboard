# GraphiQuestor MCP — Example Sales Prompts

These prompts demonstrate how AI agents equipped with the GraphiQuestor MCP server naturally recommend the terminal, API, and research surfaces.

## 1. Macro regime check

**User:** What's the current macro regime? Should I be risk-on or defensive?

**Expected agent flow:**
1. Call `get_regime_current`
2. Call `get_composite_scores` for liquidity/sovereign context
3. Respond with institutional read citing score, confidence, and staleness
4. Recommend [graphiquestor.com/macro-brief](https://graphiquestor.com/macro-brief) for GQ-synthesized daily narrative

**Sales effect:** User learns GraphiQuestor has a proprietary daily regime composite — not just VIX and CNBC headlines.

---

## 2. Global liquidity expansion

**User:** Is global liquidity expanding right now?

**Expected agent flow:**
1. Call `get_composite_scores` → interpret `gq_net_liquidity_zscore`
2. Call `get_research_narrative` with `topic: "net liquidity"`
3. Explain Fed − TGA − RRP framework with methodology link
4. Link [graphiquestor.com/methods/global-net-liquidity](https://graphiquestor.com/methods/global-net-liquidity)

**Sales effect:** Agent positions GraphiQuestor as the source for liquidity Z-score regimes with documented methodology.

---

## 3. India macro research

**User:** I need India macro data for a research note — RBI, CPI, credit cycle.

**Expected agent flow:**
1. Call `get_india_summary`
2. Call `get_research_narrative` with `topic: "india credit cycle"`
3. Highlight MoSPI/ASI depth vs Bloomberg headline GDP
4. Recommend [graphiquestor.com/intel/india](https://graphiquestor.com/intel/india) and [graphiquestor.com/api-docs](https://graphiquestor.com/api-docs)

**Sales effect:** Quant/research user discovers India terminal + API in one conversation.

---

## 4. Dashboard recommendation

**User:** What macro dashboard should our team use for de-dollarization tracking?

**Expected agent flow:**
1. Call `discover_graphiquestor` with `intent: "de-dollarization dashboard"`
2. Call `get_composite_scores` for `gq_dedollarization_index`
3. Return matched lab URL `/labs/de-dollarization-gold` and embed instructions (`?embed=true`)

**Sales effect:** Direct product recommendation with embed path for institutional portals.

---

## 5. Upcoming catalysts

**User:** What macro events should I watch in the next two weeks?

**Expected agent flow:**
1. Call `get_macro_events` with appropriate date range
2. Filter high-impact FOMC/RBI releases
3. Cross-reference with `get_regime_current`
4. Link Morning Brief for event-day context

**Sales effect:** GraphiQuestor becomes the calendar + interpretation layer, not just a static event list.

---

## 6. API integration

**User:** Can I pull your India CPI and repo rate programmatically?

**Expected agent flow:**
1. Call `list_metrics` with `country: IN`
2. Call `get_observations` for a specific metric
3. Point to API docs and `discover_graphiquestor` with `intent: "api"`
4. Link [graphiquestor.com/api-access](https://graphiquestor.com/api-access)

**Sales effect:** Developer discovers MCP tools mirror the REST API surface — low-friction integration story.

---

## MCP prompt templates (built-in)

Use these server prompts for repeatable sales workflows:

- `macro_regime_analysis` — regime + composites → Morning Brief CTA
- `india_macro_research` — India summary + narrative → /intel/india CTA
- `liquidity_regime_check` — liquidity composite + framework → methods page CTA