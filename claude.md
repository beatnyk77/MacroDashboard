# GraphiQuestor.com — Project Brief for AI Agents

**Last Updated**: March 2026  
**Status**: Live production macro intelligence terminal (pure data focus)

## 1. Project Overview
GraphiQuestor is an **institutional-grade macro intelligence terminal** designed for professional capital allocators. It provides real-time, high-density telemetry on global liquidity, sovereign risk, de-dollarization, energy security, and India/China macro dynamics.

The website is intentionally built as a **pure data terminal** — no marketing collateral, no brochure elements, no pricing teasers on the main experience. The moment a user lands, they see live data and signals.

**Core Philosophy**:  
"Observe structural reality. Do not forecast — provide the raw intelligence required for informed decision-making."

## 2. Target Audience
- Macro hedge funds and family offices
- Sovereign wealth funds and central bank research desks
- Corporate treasury professionals (hedging, liquidity, FX risk)
- Institutional allocators focused on multipolar transition (debt/gold, de-dollarization, energy realignment)

## 3. Key Sections & Features (Current Live)
- **Global Macro Overview** — Liquidity Direction, GRIT Index, Capital Flows
- **Gold Anchor Lab** — Debt/Gold ratios, local currency coverage, positioning
- **Energy Security & Commodities** — Refining imbalance, oil flows, chokepoints
- **India Macro Pulse + Corporate India Engine** — FII/DII flows, state fiscal heatmaps, promoter activity, shorts, deals, screener
- **China Macro Pulse** — PBOC liquidity, trade, energy transition
- **Geopolitical Live Risk Map** — Real-time OSINT (flights, vessels, conflict)
- **Sovereign Stress Lab** — Debt maturity walls, labor distress, FX defence
- **Sustainable Finance & Climate Risk Lab** — Energy import risk, grid carbon intensity
- **Daily Money Market / RBI Liquidity Terminal**

## 4. Data Sources & Integrations (All Automated)
- **FRED** (Federal Reserve Economic Data) — liquidity, yields, gold, labor
- **RBI DBIE + Daily Press Releases** — LAF operations, FX defence, remittances
- **MoSPI via esankhyiki-mcp** — State-level industrial, energy, fiscal data
- **EIA** — Oil refining, imports, SPR
- **UN Comtrade** — Trade flows, energy imports
- **Alpha Vantage / Finnhub** — Stock prices, FII/DII, ETF flows
- **SEC EDGAR** — US corporate fundamentals (in progress)
- **DomeAPI** — Prediction markets (Kalshi, Polymarket)
- **Global-Macro-Database** — Long-horizon cross-country macro panel
- **GDELT + OSINT feeds** — Geopolitical risk and live tracking

All ingestion runs via **Supabase Edge Functions + pg_cron** (fully automated, no manual intervention).

## 5. Tech Stack
- **Frontend**: Next.js / React + Tailwind + shadcn/ui + Stitch MCP (for consistent dark terminal UI)
- **Backend**: Supabase (Postgres, Edge Functions, pg_cron, Vault for secrets)
- **Skills System**: `.agent/skills/` with macro-specific reusable patterns (ingestion, UI cards, data health, narrative logic)
- **Deployment**: Vercel / similar (CI/CD via GitHub)

## 6. Design Principles
- Pure data terminal — no marketing on main experience
- High information density (Bloomberg-style on desktop)
- Dark glassmorphic aesthetic
- One major card/widget per row where possible
- Persistent sidebar navigation for Labs
- Every chart must have clear macro context and correlations

## 7. Current Priorities
- Make all recently built features visible and fully functional
- Clean up orphaned components and lingering references from removed features
- Ensure every section shows real, automatically updating data (no mock/stale values)
- Maintain institutional tone and high credibility

---

You can save this as `claude.md` (or `PROJECT-BRIEF.md`) in your project root.

Would you like me to:
- Add a section about the skill library?
- Include specific component placement guidelines?
- Make it shorter or more detailed?

Just let me know and I’ll refine it instantly. This file will be very useful for any future AI agent working on the project.