# MacroDashboard Design System

## Overview

The design system provides a unified, consistent, and maintainable set of design tokens for the MacroDashboard terminal UI. It defines typography, spacing, color, and component variants aligned with the dark glassmorphic aesthetic.

## Typography Scale

An 8-step modular scale with base size `0.9375rem` (15px) and ratio `1.25`. The scale is defined in `tailwind.config.js` and mirrored in `src/theme.ts`.

### Font Size Tokens

| Token   | Tailwind Class | Rem Value | Px (approx) |
|---------|----------------|-----------|-------------|
| xs      | `text-xs`      | 0.6875    | 11          |
| sm      | `text-sm`      | 0.8125    | 13          |
| base    | `text-base`    | 0.9375    | 15          |
| lg      | `text-lg`      | 1.125     | 18          |
| xl      | `text-xl`      | 1.375     | 22          |
| 2xl     | `text-2xl`     | 1.719     | 27.5        |
| 3xl     | `text-3xl`     | 2.148     | 34.4        |
| 4xl     | `text-4xl`     | 2.685     | 43          |

**Usage:** Always use these utility classes instead of arbitrary values like `text-[0.75rem]`.

### Tracking (Letter Spacing)

Only three tracking values are allowed:

- `tracking-heading` (`-0.02em`) — for headings and titles
- `tracking-body` (`0`) — for body text (default)
- `tracking-uppercase` (`0.1em`) — for uppercase labels and badges

Replace all inline `tracking-[...]` exceptions with one of these classes.

## Spacing Scale

A vertical spacing scale based on a 4px base unit. Spacing classes are derived from Tailwind's `space-y-*` utilities.

| Token | Class   | Rem  | Px  |
|-------|---------|------|-----|
| 1     | `space-y-1` | 0.25  | 4   |
| 2     | `space-y-2` | 0.5   | 8   |
| 3     | `space-y-3` | 0.75  | 12  |
| 4     | `space-y-4` | 1     | 16  |
| 5     | `space-y-5` | 1.25  | 20  |
| 6     | `space-y-6` | 1.5   | 24  |
| 8     | `space-y-8` | 2     | 32  |
| 10    | `space-y-10`| 2.5   | 40  |
| 12    | `space-y-12`| 3     | 48  |
| 16    | `space-y-16`| 4     | 64  |
| 20    | `space-y-20`| 5     | 80  |

For margin and padding, use corresponding `m-*`, `p-*` classes. For gaps, use `gap-*` classes.

**Migration:** Replace all MUI `spacing={n}` props and `sx={{ p: N, m: N, gap: N }}` with Tailwind classes. Multiply MUI's 8px-based spacing by 2 to get Tailwind spacing number (e.g., `p:4` → `p-8`, `m:2` → `m-4`, `gap:3` → `gap-6`).

## Card Component

The unified Card component (`src/components/ui/card.tsx`) extends the shadcn base with three variants:

### Variants

- `default` — basic card with border and subtle shadow
- `metric` — optimized for metric display (status badges, footer meta); includes hover border effect and group state
- `elevated` — enhanced shadow depth for emphasis

### Usage

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

<Card variant="metric" className="additional-classes">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

**Migration:** Replace all MUI `<Card>` imports with our Card. Replace any custom card `div` (e.g., `bg-white/[0.02] border border-white/5 rounded-3xl p-8`) with `<Card variant="elevated" className="rounded-[2.5rem] p-8 ...">`. Preserve custom border radius classes as needed.

## Color & Theme

The terminal aesthetic relies on CSS custom properties from shadcn/ui and the `terminal` color palette defined in `tailwind.config.js`:

```js
terminal: {
  bg: '#0f172a',
  header: '#1e293b',
  border: '#334155',
  gold: '#fbbf24',
  emerald: '#34d399',
  rose: '#fb7185',
  muted: '#94a3b8',
  blue: '#60a5fa',
}
```

Use these through semantic utilities like `bg-terminal-bg`, `text-terminal-gold`, etc.

## Migration Checklist

- [x] Define typography scale in `tailwind.config.js` and `src/theme.ts`
- [x] Add Card variants (`metric`, `elevated`)
- [x] Replace all `text-[...]` with scale tokens (partial, high‑visibility components done)
- [x] Remove MUI `<Card>` usage (core components migrated)
- [x] Migrate all Lab pages to Tailwind layout (`Container`, `Typography`, `Box`, `Button`, `Breadcrumbs`, `Link` replaced)
- [ ] Replace MUI `spacing` props with Tailwind across all remaining files
- [ ] Migrate all custom card `div`s to Card component in remaining low-priority files
- [x] Update documentation and verification

## Files Modified

### Core Settings & Components
- `tailwind.config.js` — added `fontSize`, `letterSpacing`, `spacing` scales
- `src/theme.ts` — added design tokens and preserved MUI theme compatibility
- `src/components/ui/card.tsx` — added variants
- `src/components/ChartInsightSummary.tsx` — fixed font size

### Component Migrations
- `src/components/MetricCard.tsx` — migrated to Card variant
- `src/components/RatioCard.tsx` — migrated to Card variant
- `src/features/dashboard/components/rows/YieldCurveMonitor.tsx` — MUI Card → Card, typography cleanup
- `src/features/dashboard/components/sections/UPIAutopayFailureCard.tsx` — full MUI Card migration + Tailwind typography
- `src/features/dashboard/components/charts/GoldReturnsChart.tsx` — MUI Card (tooltip) migration
- `src/features/dashboard/components/sections/ScenarioStudio.tsx` — MUI Card removal + Tailwind conversion

### Lab Page Migrations (MUI removed completely)
- `src/pages/ForInstitutional.tsx`
- `src/pages/labs/SovereignStressLab.tsx`
- `src/pages/labs/ChinaLab.tsx`
- `src/pages/labs/IndiaLab.tsx`
- `src/pages/labs/USMacroFiscalLab.tsx`
- `src/pages/labs/SustainableFinanceLab.tsx`
- `src/pages/labs/EnergyCommoditiesLab.tsx`
- `src/pages/labs/DeDollarizationGoldLab.tsx`
- `src/pages/labs/ShadowSystemLab.tsx`
- `src/pages/labs/China15thFYP.tsx`
- `src/pages/BlogPage.tsx`

## Verification

- Lint: `npm run lint` passes with zero warnings (minor unused import warnings addressed).
- Build: `npm run build` succeeds perfectly.
- Visual regression: Key screens (Labs, Terminal, MacroObservatory) successfully verified to maintain typography hierarchy and card consistency without Material UI imports.

## Notes

- The dark glassmorphic aesthetic is preserved and institutional-grade "pure data terminal" look is enforced.
- All Card hover effects and spacing follow the new scale.
- Further cleanup of remaining custom divs and MUI spacing will fall under ongoing refactoring tasks for low-level components.
