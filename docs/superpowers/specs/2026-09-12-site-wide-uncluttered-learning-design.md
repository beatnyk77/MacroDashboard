# Site-Wide Uncluttered Educational Architecture Design Spec

- **Author**: Antigravity & Kartikay Sharma
- **Date**: 2026-09-12
- **Status**: Approved
- **Repository**: `beatnyk77/MacroDashboard`
- **Design System Reference**: `DESIGN.md` (Grounded in Stitch Project `projects/3303994937711585097`)

---

## 1. Problem Statement

GraphiQuestor surfaces sophisticated macro telemetry (e.g., *Primary Dealer Net Inventory*, *Standing Repo Facility*, *Basis Trade Arbitrage*, *Global Net Liquidity*). While seasoned quantitative traders and reserve managers understand these concepts, many allocators and analysts benefit from plain-English explanations.

Previous attempts introduced large top-of-page briefing banners and an invasive header toggle (`[ 🎓 PRO MODE | 💡 PLAIN ENGLISH ]`). This polluted the high-density terminal aesthetic, pushed critical charts below the fold, and forced users into an artificial binary mode.

---

## 2. Goals & Non-Goals

### Goals
- **Standardized Learning**: Make concept education and Main Street economic impact a standard, universal feature accessible across every metric and desk.
- **Zero Canvas Clutter**: Retain the dark glassmorphic, high-density terminal feel. No bulky permanently visible banners.
- **Unified Micro-Interaction**: Consolidate Technical Telemetry/Diagnostics and Plain-English Concepts into a single, cohesive disclosure drawer per `MetricCard`.
- **At-a-Glance Clarity**: Add a subtle, 1-line plain-English takeaway underneath primary numerical readouts.
- **Micro-Definitions**: Provide lightweight hover popovers for recurring financial terms via `<JargonTooltip />`.
- **Formal Design Tokens**: Establish and lint `DESIGN.md` using the `@google/design.md` toolchain.

### Non-Goals
- Changing the institutional voice or dumbing down the primary analysis.
- Adding intrusive modals, onboarding wizards, or gamification.

---

## 3. Architecture & Components

### 3.1 Design System Specification (`DESIGN.md`)
Created at the workspace root, following the `@google/design.md` standard and synchronized with the Stitch `GraphiQuestor - Institutional Macro Terminal` project theme:
- Tokens for surface, typography (`Space Grotesk`, `Inter`, `JetBrains Mono`), and semantic states.
- Dedicated educational tokens:
  - `colors.education-accent`: `#38bdf8` (Sky Blue)
  - `colors.education-bg`: `rgba(56, 189, 248, 0.08)`
  - `colors.education-border`: `rgba(56, 189, 248, 0.25)`
  - `typography.concept-takeaway`: `11px`, `Inter`, muted slate `#94a3b8`.

### 3.2 Enhanced `MetricCard`
- **Takeaway Subtitle**: A 1-sentence plain-English takeaway displayed directly below the primary tabular number in `text-[11px] text-slate-400 font-normal`.
- **Integrated Bottom Disclosure Bar**:
  ```
  [ 💡 Concept & Impact  |  🛠 Telemetry & Diagnostics ▾ ]
  ```
- **Dual-Tab Drawer**:
  - **Tab 1 (`💡 Concept`)**:
    - *Mental Model*: Plain-English analogy (e.g., *"Think of this as an overnight pawnshop for banks"*).
    - *Why It Matters*: Impact on borrowing costs, inflation, and market liquidity.
    - *Threshold Indicator*: Normal vs. Elevated vs. Squeeze levels.
  - **Tab 2 (`🛠 Telemetry`)**:
    - Data Provenance (`api_live`, `fallback_snapshot`).
    - Source Institution (Fed, Treasury, RBI, BIS, etc.).
    - Series ID (`FRED:WORAL`, `FRED:PDINTT`, etc.).
    - Observed Date & Frequency.

### 3.3 `<DeskConceptPill />`
Replaces the sprawling `<LaymanBrief />` banner:
- Rendered below desk headers as a sleek, compact single-line pill:
  `[ 💡 What this desk tracks (30-sec brief) ▾ ]`
- Toggling reveals a concise 3-part grid (The Core Mechanism, Portfolio & Economic Impact, Key Signals to Watch) styled with crisp 1px borders and translucent background.

### 3.4 `<JargonTooltip />`
- Minimal inline wrapper for institutional terms (e.g., *SOFR*, *Repo*, *TGA*, *Reverse Repo*, *Absorption*).
- Underlined with a delicate `border-b border-dotted border-white/20`.
- On hover, displays an instant 1-2 sentence definition without obscuring the canvas.

### 3.5 `GlobalLayout` Cleanup
- Remove the `[ 🎓 PRO MODE | 💡 PLAIN ENGLISH ]` header button.
- Clean up unused mode-switching state from `ViewContext`.

---

## 4. Verification Plan

1. **Design System Linting**: Run `npx -y @google/design.md lint DESIGN.md` to guarantee 0 errors.
2. **TypeScript & Static Analysis**: Run `npx tsc --noEmit` and `npm run lint`.
3. **CI Guardrail Check**: Run `node scripts/ci-guards.mjs`.
4. **Visual & Interaction Verification**:
   - Verify that all cards render without layout shifts.
   - Verify that clicking the disclosure toggle displays both Concept and Telemetry tabs cleanly.
   - Verify that hovering on jargon terms displays the tooltip properly.
