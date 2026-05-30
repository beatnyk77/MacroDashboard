# Command Palette — Jump to Terminal Section

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `⌘K` command palette so users can jump directly to any of the 12 named sections on the macro terminal home page.

**Architecture:** Two files modified. `Terminal.tsx` gets `id` attributes added to each `<section>` element. `CommandPalette.tsx` gains a static `TERMINAL_SECTIONS` registry and renders each entry in the existing "Terminal Sections" group. No new hooks, no Supabase calls.

**Tech Stack:** React 18, TypeScript, cmdk, lucide-react, react-router-dom v7, Vitest + @testing-library/react.

---

## File Map

| File | Change |
|---|---|
| `src/pages/Terminal.tsx` | Add `id` to 10 unnamed `<section>` elements |
| `src/components/CommandPalette/CommandPalette.tsx` | Add icon imports, `TERMINAL_SECTIONS` constant, expand "Terminal Sections" group |
| `src/components/__tests__/CommandPaletteSections.test.tsx` | New — asserts all 12 section labels render when palette is open |

---

## Task 1: Add section IDs to Terminal.tsx

**Files:**
- Modify: `src/pages/Terminal.tsx`

The file currently has 12 `<section>` elements. Two already have IDs. Add `id` attributes to the remaining 10 — this is what the scroll targets in the command palette will point at.

Current state (relevant lines, no IDs present):
- Line 90: `<section>` (Sovereign Compass)
- Line 162: `<section>` (Weekly Regime Digest)
- Line 171: `<section className="space-y-8">` (Monthly Strategy)
- Line 185: `<section className="space-y-8">` (Liquidity Plumbline)
- Line 217: `<section className="space-y-8">` (Sovereign Stress)
- Line 319: `<section className="space-y-8">` (Trade Intelligence)
- Line 333: `<section className="space-y-8">` (Regional Intelligence)
- Line 371: `<section className="space-y-8">` (Energy & Commodities)
- Line 385: `<section className="space-y-8">` (Institutional Strategy)
- Line 422: `<section className="space-y-8">` (Deflation Debasement)

- [ ] **Step 1.1: Add IDs to the 10 unnamed sections**

Apply each of these changes to `src/pages/Terminal.tsx`:

```tsx
// Line 90 — Sovereign Compass
<section id="sovereign-compass">

// Line 162 — Weekly Regime Digest
<section id="weekly-regime-digest">

// Line 171 — Monthly Strategy
<section id="monthly-strategy" className="space-y-8">

// Line 185 — Liquidity Plumbline
<section id="liquidity-plumbline" className="space-y-8">

// Line 217 — Sovereign Stress
<section id="sovereign-stress" className="space-y-8">

// Line 319 — Trade Intelligence
<section id="trade-intelligence" className="space-y-8">

// Line 333 — Regional Intelligence
<section id="regional-intelligence" className="space-y-8">

// Line 371 — Energy & Commodities
<section id="energy-commodities" className="space-y-8">

// Line 385 — Institutional Strategy
<section id="institutional-strategy" className="space-y-8">

// Line 422 — Deflation Debasement
<section id="deflation-debasement" className="space-y-8">
```

- [ ] **Step 1.2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.3: Commit**

```bash
git add src/pages/Terminal.tsx
git commit -m "feat: add section anchor IDs to macro terminal page"
```

---

## Task 2: Write failing test for CommandPalette section labels

**Files:**
- Create: `src/components/__tests__/CommandPaletteSections.test.tsx`

- [ ] **Step 2.1: Create the test file**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';

function renderPalette() {
    render(
        <MemoryRouter>
            <CommandPalette open={true} setOpen={vi.fn()} />
        </MemoryRouter>
    );
}

const EXPECTED_LABELS = [
    'Daily Macro Brief',
    'Sovereign Compass',
    'Weekly Regime Digest',
    'Monthly Strategy',
    'Liquidity Plumbline',
    'Sovereign Stress',
    'Trade Intelligence',
    'Regional Intelligence',
    'Energy & Commodities',
    'Institutional Strategy',
    'Geopolitical Risk Matrix',
    'Deflation / Debasement Monitor',
];

describe('CommandPalette — Terminal Sections', () => {
    it('renders all 12 terminal section jump entries when open', () => {
        renderPalette();
        for (const label of EXPECTED_LABELS) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });
});
```

- [ ] **Step 2.2: Run the test and confirm it fails**

```bash
npx vitest run src/components/__tests__/CommandPaletteSections.test.tsx
```

Expected: FAIL — most labels will be missing (only "Jump to Geopolitical Risk" exists right now, under a different label).

- [ ] **Step 2.3: Commit the failing test**

```bash
git add src/components/__tests__/CommandPaletteSections.test.tsx
git commit -m "test: add failing test for command palette section jump labels"
```

---

## Task 3: Expand the CommandPalette Terminal Sections group

**Files:**
- Modify: `src/components/CommandPalette/CommandPalette.tsx`

- [ ] **Step 3.1: Update icon imports**

Replace the existing import block at the top of `src/components/CommandPalette/CommandPalette.tsx`:

```tsx
import {
    Search,
    Navigation,
    Zap,
    Book,
    Settings,
    BarChart3,
    Globe,
    FlaskConical,
    Flag,
    Home,
    Activity,
    MapPin,
    Calendar,
    TrendingUp,
    ShieldAlert,
    AlertTriangle,
    FileText,
} from 'lucide-react';
```

- [ ] **Step 3.2: Add the TERMINAL_SECTIONS constant above the component**

Insert this block after the imports and before the `CommandPaletteProps` interface:

```tsx
interface TerminalSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const TERMINAL_SECTIONS: TerminalSection[] = [
    { id: 'daily-macro-layer',     label: 'Daily Macro Brief',              icon: <Activity className="h-4 w-4 text-blue-400" /> },
    { id: 'sovereign-compass',     label: 'Sovereign Compass',              icon: <Globe className="h-4 w-4 text-blue-400" /> },
    { id: 'weekly-regime-digest',  label: 'Weekly Regime Digest',           icon: <FileText className="h-4 w-4 text-slate-400" /> },
    { id: 'monthly-strategy',      label: 'Monthly Strategy',               icon: <Calendar className="h-4 w-4 text-slate-400" /> },
    { id: 'liquidity-plumbline',   label: 'Liquidity Plumbline',            icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
    { id: 'sovereign-stress',      label: 'Sovereign Stress',               icon: <ShieldAlert className="h-4 w-4 text-rose-400" /> },
    { id: 'trade-intelligence',    label: 'Trade Intelligence',             icon: <Globe className="h-4 w-4 text-emerald-400" /> },
    { id: 'regional-intelligence', label: 'Regional Intelligence',          icon: <MapPin className="h-4 w-4 text-amber-400" /> },
    { id: 'energy-commodities',    label: 'Energy & Commodities',           icon: <Zap className="h-4 w-4 text-orange-400" /> },
    { id: 'institutional-strategy',label: 'Institutional Strategy',         icon: <BarChart3 className="h-4 w-4 text-cyan-400" /> },
    { id: 'geopolitical-matrix',   label: 'Geopolitical Risk Matrix',       icon: <AlertTriangle className="h-4 w-4 text-rose-400" /> },
    { id: 'deflation-debasement',  label: 'Deflation / Debasement Monitor', icon: <Activity className="h-4 w-4 text-purple-400" /> },
];
```

- [ ] **Step 3.3: Replace the "Terminal Sections" group in the JSX**

Find the existing `Command.Group heading="Terminal Sections"` block (lines 131–141) and replace it entirely:

```tsx
<Command.Group heading="Terminal Sections" className="px-2 py-3 text-xs font-bold text-muted-foreground/50 uppercase tracking-uppercase border-t border-white/5 mt-1">
    {TERMINAL_SECTIONS.map((section) => (
        <Item
            key={section.id}
            onSelect={() => runCommand(() => {
                navigate('/');
                setTimeout(() => {
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            })}
            icon={section.icon}
        >
            {section.label}
        </Item>
    ))}
</Command.Group>
```

- [ ] **Step 3.4: Run the test and confirm it passes**

```bash
npx vitest run src/components/__tests__/CommandPaletteSections.test.tsx
```

Expected: PASS — all 12 labels found in the rendered output.

- [ ] **Step 3.5: Run the full test suite**

```bash
npm run test
```

Expected: all existing tests still pass, new test passes.

- [ ] **Step 3.6: Run the linter**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 3.7: Commit**

```bash
git add src/components/CommandPalette/CommandPalette.tsx
git commit -m "feat: expand command palette with jump-to-section entries for all terminal sections"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ All 12 section IDs added to Terminal.tsx (Task 1)
- ✅ TERMINAL_SECTIONS constant with all 12 entries (Task 3)
- ✅ Navigation logic: navigate('/') + setTimeout 100ms scroll (Task 3, Step 3.3)
- ✅ Orphaned single "Jump to Geopolitical Risk" entry replaced by full group (Task 3)
- ✅ Test file asserts all 12 labels (Task 2)
- ✅ TDD order: test written and confirmed failing before implementation (Tasks 2→3)

**Placeholder scan:** None found.

**Type consistency:** `TerminalSection.id` used as `document.getElementById(section.id)` — consistent. `TerminalSection.label` rendered as `{section.label}` in JSX — consistent. `TerminalSection.icon` typed `React.ReactNode` and passed to `Item`'s `icon` prop which accepts `React.ReactNode` — consistent.
