# Design: Command Palette — Jump to Terminal Section

**Date:** 2026-05-31  
**Status:** Approved  
**Scope:** Orient-and-find UX for the macro terminal

---

## Problem

The macro terminal (`/`) is a single long page with 12 distinct sections. New users in "orient-and-find" mode have no fast path to a specific section — they must scroll manually. The `⌘K` command palette exists but only navigates between pages, not sections within the terminal.

## Solution

Extend the existing command palette with a "Terminal Sections" group containing one entry per section. Selecting an entry scrolls the user to that section, regardless of which page they're currently on.

---

## Files Changed

### 1. `src/pages/Terminal.tsx`
Add stable `id` attributes to all unnamed `<section>` elements. Two sections already have IDs; the rest need them added.

| Element | ID to add |
|---|---|
| `<section>` wrapping DailyMacroPanel | `daily-macro-layer` *(already exists)* |
| `<section>` wrapping Sovereign Compass card | `sovereign-compass` |
| `<section>` wrapping WeeklyRegimeDigest | `weekly-regime-digest` |
| `<section>` wrapping Monthly Strategy | `monthly-strategy` |
| `<section>` wrapping Liquidity Plumbline | `liquidity-plumbline` |
| `<section>` wrapping Sovereign Stress | `sovereign-stress` |
| `<section>` wrapping Trade Intelligence | `trade-intelligence` |
| `<section>` wrapping Regional Intelligence | `regional-intelligence` |
| `<section>` wrapping Energy & Commodities | `energy-commodities` |
| `<section>` wrapping Institutional Strategy | `institutional-strategy` |
| `<Card id="geopolitical-matrix">` | *(already exists)* |
| `<section>` wrapping DeflationDebasementMonitor | `deflation-debasement` |

### 2. `src/components/CommandPalette/CommandPalette.tsx`
- Import additional icons: `MapPin`, `Calendar`, `AlertTriangle`, `TrendingUp` (already present), `ShieldAlert` (already present).
- Add a `TERMINAL_SECTIONS` constant array (defined outside the component) mapping each section to `{ id, label, icon }`.
- Replace the lone orphaned "Jump to Geopolitical Risk" item with a full `Command.Group heading="Terminal Sections"` that iterates `TERMINAL_SECTIONS`.
- Each item's `onSelect` handler:
  1. Closes the palette via `runCommand`.
  2. If already on `/`: calls `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })` immediately.
  3. If on another route: calls `navigate('/')` then schedules the scroll in a `setTimeout(..., 100)` (matches the existing pattern for the geopolitical-matrix entry).

---

## Section Registry

```ts
const TERMINAL_SECTIONS = [
  { id: 'daily-macro-layer',    label: 'Daily Macro Brief',           icon: Activity,      color: 'text-blue-400' },
  { id: 'sovereign-compass',    label: 'Sovereign Compass',           icon: Globe,         color: 'text-blue-400' },
  { id: 'weekly-regime-digest', label: 'Weekly Regime Digest',        icon: FileText,      color: 'text-slate-400' },
  { id: 'monthly-strategy',     label: 'Monthly Strategy',            icon: Calendar,      color: 'text-slate-400' },
  { id: 'liquidity-plumbline',  label: 'Liquidity Plumbline',         icon: TrendingUp,    color: 'text-emerald-400' },
  { id: 'sovereign-stress',     label: 'Sovereign Stress',            icon: ShieldAlert,   color: 'text-rose-400' },
  { id: 'trade-intelligence',   label: 'Trade Intelligence',          icon: Globe,         color: 'text-emerald-400' },
  { id: 'regional-intelligence',label: 'Regional Intelligence',       icon: MapPin,        color: 'text-amber-400' },
  { id: 'energy-commodities',   label: 'Energy & Commodities',        icon: Zap,           color: 'text-orange-400' },
  { id: 'institutional-strategy',label: 'Institutional Strategy',     icon: BarChart3,     color: 'text-cyan-400' },
  { id: 'geopolitical-matrix',  label: 'Geopolitical Risk Matrix',    icon: AlertTriangle, color: 'text-rose-400' },
  { id: 'deflation-debasement', label: 'Deflation / Debasement Monitor', icon: Activity,  color: 'text-purple-400' },
];
```

---

## Navigation Logic

```
User selects a section entry
  └─ runCommand fires (closes palette)
       ├─ location.pathname === '/'  →  scrollIntoView immediately
       └─ otherwise                 →  navigate('/') + setTimeout(scrollIntoView, 100)
```

The 100ms delay matches the existing codebase pattern and gives React Router time to mount the Terminal page before the scroll fires.

---

## Testing

**File:** `src/components/__tests__/CommandPaletteSections.test.tsx`

- Render `<CommandPalette open={true} setOpen={vi.fn()} />` inside a `MemoryRouter`.
- Assert all 12 section labels appear in the rendered output.
- No scroll assertions (jsdom has no layout engine).
- No navigation assertions (covered by the existing pattern; new code adds no novel routing logic).

---

## Out of Scope

- Metric-level search (Option B from brainstorming) — future enhancement.
- Keyboard shortcut to open the palette — already exists (`⌘K` / `Ctrl+K`).
- Persisting last-used section — not needed for orient-and-find.
