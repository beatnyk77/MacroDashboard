# MUI Migration & Balance Implementation Plan

**Phase**: Month 2 - Component Architecture Transformation  
**Objective**: Remove Material-UI (MUI) dependency, reduce bundle by 400KB, adopt Radix UI + Tailwind CSS  
**Architect**: Senior Frontend + Design System Specialist  
**Timeline**: 4 weeks (20 working days)  
**Risk Level**: High (breaking changes, requires systematic approach)

---

## 📊 CURRENT STATE ANALYSIS

### MUI Usage Statistics
- **Total MUI imports**: 64 files using `@mui/material`
- **sx prop occurrences**: ~798 (massive styling debt)
- **Most used components**:
  - `Box` (51) → Tailwind div utilities
  - `Typography` (42) → semantic HTML + Tailwind
  - `Grid` (21) → CSS Grid
  - `Container` (17) → Tailwind container
  - `Button` (15) → shadcn Button
  - `Skeleton` (13) → our enhanced Skeleton
  - `Paper` (13) → Card or div
  - `Chip` (12) → Badge
  - `Stack` (9) → Flex/Grid utilities

### Existing Radix & Shadcn
**Radix UI installed**: hover-card, scroll-area, separator, slot, tabs, tooltip  
**Shadcn components**: alert, badge, button, card, hover-card, separator, skeleton, table, tabs, tooltip

**Missing but needed**: Dialog, DropdownMenu, Select, Textarea, Switch, Checkbox, RadioGroup

### Testing State
- Unit tests: minimal (only smoke.test.ts)
- Accessibility tests: none
- Performance tests: none
- **Risk**: High - migration needs robust safety net

---

## 🎯 MIGRATION STRATEGY

### **Guiding Principles**

1. **Strangler Fig Pattern**: Gradually replace MUI, don't break existing functionality
2. **Component-by-Component**: Migrate one component at a time, test thoroughly
3. **Backward Compatibility**: Keep prop APIs stable during transition
4. **Zero Downtime**: Every day ends with a working build
5. **Test-First Approach**: Add tests before migrating each component

---

## 📅 WEEKLY BREAKDOWN

### **Week 1: Preparation & Foundation** (Days 1-5)

#### Day 1: Shadcn Expansion & Radix Setup

**Install missing shadcn components** (run shadcn CLI):
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add switch
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add slider
npx shadcn@latest add toast
```

**Add Radix UI primitives**:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-radio-group
```

**Verify**: All new components follow terminal aesthetic (dark mode, proper colors).

#### Day 2: Create Migration Utilities

**Create `src/lib/migration-utils.ts`**:
```typescript
// MUI → Tailwind conversion helpers
export const muiGridToTailwind = (xs?: number | 'auto', sm?: number, md?: number, lg?: number, xl?: number): string => {
  const map = (size: number | 'auto') => {
    if (size === 'auto') return 'auto';
    return `grid-cols-${size}`;
  };
  return `grid grid-cols-1 ${md ? `md:grid-cols-${md}` : ''} ${lg ? `lg:grid-cols-${lg}` : ''} gap-4`;
};

// Convert sx padding to Tailwind
export const sxToPadding = (sx: any): string => {
  const p = sx.p || sx.padding || sx.pt || 0;
  const px = sx.px || sx.paddingX || 0;
  const py = sx.py || sx.paddingY || 0;
  // Convert numeric (MUI uses 8px unit) to Tailwind scale
  const toTailwind = (val: number) => {
    const rem = val / 8; // MUI theme spacing = 8px
    return `p-${Math.round(rem)}`;
  };
  // ... implement
};

// Convert sx margin to Tailwind
// Convert sx display/flex to Tailwind
// Convert sx color/background to Tailwind
```

**Create `src/lib/validate-migration.tsx`**:
```typescript
import { axe } from 'axe-core';

export const runAccessibilityAudit = async (container: HTMLElement): Promise<any> => {
  return await axe(container);
};

export const checkColorContrast = (element: HTMLElement): boolean => {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  // Use canvas-based contrast checking
  // Return true if meets WCAG AA
  return true;
};
```

#### Day 3: Testing Infrastructure

**Set up bundle analyzer**:
```bash
npm install -D vite-bundle-analyzer
```

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import bundleAnalyzer from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    bundleAnalyzer({
      openAnalyzer: false,
      enabled: process.env.ANALYZE === 'true'
    })
  ]
});
```

**Create accessibility test suite** `src/accessibility.test.tsx`:
```typescript
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('terminal page accessible', async () => {
  const { container } = render(<Terminal />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### Day 4-5: Start with Easy Components

**Priority 1: Remove MUI from non-critical components first**:

Targets:
1. `src/components/FreshnessChip.tsx` - uses MUI Chip
2. `src/components/AlertBadge.tsx` - uses MUI Alert
3. `src/components/DataQualityBadge.tsx` - likely uses Chip/Badge
4. `src/components/DataProvenanceBadge.tsx` - likely Badge

**Process per component**:
1. Replace `import { Chip } from '@mui/material'` → `import { Badge } from '@/components/ui/badge'`
2. Convert `sx={{ bgcolor: '...', color: '...' }}` → Tailwind classes: `bg-emerald-500/10 text-emerald-500`
3. Ensure terminal color palette usage (terminal.gold, terminal.emerald, etc.)
4. Run build, lint, and smoke test
5. Commit with message: `feat(ui): migrate [Component] from MUI to Tailwind`

**Example migration - FreshnessChip**:
```tsx
// BEFORE (MUI Chip):
import { Chip } from '@mui/material';
export const FreshnessChip = ({ status }) => (
  <Chip
    size="small"
    label={status === 'fresh' ? 'FRESH' : 'STALE'}
    color={status === 'fresh' ? 'success' : 'warning'}
    sx={{ fontWeight: 700, fontSize: '0.625rem' }}
  />
);

// AFTER (shadcn Badge):
import { Badge } from '@/components/ui/badge';
export const FreshnessChip = ({ status }) => (
  <Badge
    variant="outline"
    className={cn(
      "text-[0.625rem] font-bold uppercase tracking-wider",
      status === 'fresh'
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
        : "bg-amber-500/10 text-amber-500 border-amber-500/30"
    )}
  >
    {status === 'fresh' ? 'FRESH' : 'STALE'}
  </Badge>
);
```

---

### **Week 2: Grid & Typography Replacements** (Days 6-10)

#### Day 6-7: Replace MUI Grid with Tailwind CSS Grid

**Global find/replace patterns**:

```tsx
// Pattern 1: Simple Grid container
// BEFORE:
<Grid container spacing={3}>
  <Grid item xs={12} lg={4}>...</Grid>
</Grid>

// AFTER:
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
  <div className="lg:col-span-1">...</div>
</div>
```

```tsx
// Pattern 2: Nested Grids
// BEFORE:
<Grid container spacing={3}>
  <Grid item xs={12} md={6} lg={4}>...</Grid>
  <Grid item xs={12} md={6} lg={8}>...</Grid>
</Grid>

// AFTER:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="md:col-span-1 lg:col-span-1">...</div>
  <div className="md:col-span-1 lg:col-span-3">...</div>
</div>
```

**Files to migrate** (order by complexity):
1. `src/features/dashboard/components/sections/GlobalLiquiditySection.tsx` (template for others)
2. `src/features/dashboard/components/sections/BoJBalanceSheetCard.tsx`
3. `src/features/dashboard/components/sections/ECBBalanceSheetCard.tsx`
4. `src/features/dashboard/components/sections/TreasurySnapshotSection.tsx`
5. `src/features/dashboard/components/cards/CompactIndiaCard.tsx`
6. `src/features/dashboard/components/cards/CompactChinaCard.tsx`

**Helper function** (add to `migration-utils.ts`):
```typescript
export const gridClasses = (spacing = 4): string => {
  const gapMap = { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 5: 'gap-5' };
  return `grid grid-cols-1 gap-${spacing}`;
};
```

#### Day 8-9: Replace MUI Typography with Semantic HTML

**Standard mappings**:
```tsx
// BEFORE:
<Typography variant="h1" className="text-3xl">Title</Typography>
<Typography variant="h2">Subtitle</Typography>
<Typography variant="body1">Paragraph</Typography>
<Typography variant="caption">Small text</Typography>
<Typography variant="button">Button text</Typography>

// AFTER:
<h1 className="text-3xl font-bold tracking-heading text-foreground">Title</h1>
<h2 className="text-2xl font-bold tracking-heading text-foreground">Subtitle</h2>
<p className="text-base text-foreground/90 leading-relaxed">Paragraph</p>
<span className="text-xs font-medium text-muted-foreground">Small text</span>
<span className="text-sm font-semibold text-foreground">Button text</span>
```

**Typography scale to use** (from tailwind.config.js):
- `text-xs` (11px) - captions, metadata
- `text-sm` (13px) - secondary text, labels
- `text-base` (15px) - body text
- `text-lg` (18px) - subheadings
- `text-xl` (22px) - card headers
- `text-2xl` (27.5px) - section headings
- `text-3xl` (34.4px) - page titles
- `text-4xl` (43px) - hero text

**Files to migrate** (all files with MUI Typography):
Use grep to find: `grep -l "Typography" src/features/`

#### Day 10: Replace MUI Container

```tsx
// BEFORE:
<Container maxWidth="xl" sx={{ py: 4 }}>
  <Box sx={{ px: 3 }}>

// AFTER:
<div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
  {/* Content */}
</div>
```

---

### **Week 3: Complex Components** (Days 11-15)

#### Day 11-12: Dialogs & Modals (Radix Dialog)

**Install**: Already added via Day 1 (`npx shadcn@latest add dialog`)

**Migration pattern**:
```tsx
// BEFORE (MUI Dialog):
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>...</DialogContent>
  <DialogActions>...</DialogActions>
</Dialog>

// AFTER (Radix Dialog via shadcn):
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div className="py-4">...</div>
    <DialogFooter>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Files to migrate**:
- `src/components/QuickTourModal.tsx` (already partially fixed)
- `src/components/MobileNav.tsx` (likely uses Drawer)
- Any other modal dialogs

#### Day 13: MUI Drawer → Radix Dialog or Custom

**GlobalLayout.tsx** uses `Drawer` for mobile nav:
```tsx
// Replace MUI Drawer with Radix Dialog or custom sidebar
// Option A: Radix Dialog for mobile overlay
// Option B: Custom CSS transform sidebar (already exists: TerminalSidebar)

// Temporarily keep Drawer if complex, but remove after sidebar refactor
```

#### Day 14-15: Lists, Tooltips, Other Components

**List/ListItem** → `<ul>/<li>` with Tailwind:
```tsx
// BEFORE:
<List>
  <ListItem button>Item</ListItem>
</List>

// AFTER:
<ul className="space-y-2">
  <li className="...">Item</li>
</ul>
```

**Tooltip**: Already have shadcn Tooltip (Radix-based) - switch MUI Tooltip to it.

**Breadcrumbs**: Replace with custom component using `nav` and `ol`.

---

### **Week 4: Cleanup & Polish** (Days 16-20)

#### Day 16: Remove MUI Box Completely

**Task**: Find all `Box` imports and replace:
```tsx
// Box with sx → div with className
<Box sx={{ p: 3, display: 'flex', gap: 2, bgcolor: 'background.paper' }}>
  → <div className="p-3 flex gap-2 bg-card">
```

**Use border utilities**:
- `border` instead of `border: 1`
- `border-t`, `border-b`, `border-l`, `border-r`
- `border-white/10` for transparent borders

**Use shadcn Card** instead of Paper:
```tsx
// BEFORE: <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
// AFTER: <Card className="p-6 bg-card/40">
```

#### Day 17-18: Replace MUI Skeleton with Enhanced Version

**Already done**: Our `src/components/ui/skeleton.tsx` has variants. Now:
- Replace all `<Skeleton variant="text" />` → `<Skeleton className="h-4" />`
- Replace `<Skeleton variant="rectangular" height={120} />` → stays same (Tailwind `h-32` etc.)
- Update imports in ~13 files from `@mui/material/Skeleton` to `@/components/ui/skeleton`

#### Day 19: Update Remaining `sx` Props

**Task**: Systematically find and eliminate all `sx=` occurrences:

```bash
grep -r "sx=" src/ | grep -v node_modules > sx-usage.txt
```

Process each file:
- Convert sx padding/margin: `sx={{ p: 2 }}` → `className="p-2"`
- Convert sx color: `sx={{ bgcolor: 'primary.main', color: 'text.secondary' }}` → `className="bg-primary text-secondary"`
- Convert sx flex: `sx={{ display: 'flex', alignItems: 'center' }}` → `className="flex items-center"`
- Convert sx border: `sx={{ borderBottom: 1, borderColor: 'divider' }}` → `className="border-b border-border"`

**Note**: 798 occurrences - this will take most of Week 4.

#### Day 20: Final Cleanup

1. **Remove MUI dependencies** from package.json:
```json
// REMOVE:
"@mui/material": "^5.15.0",
"@mui/icons-material": "^5.15.0",
"@emotion/react": "^11.11.0",
"@emotion/styled": "^11.11.0",
```

2. **Update imports** - ensure no file still imports from `@mui/material`

3. **Run final build**:
```bash
npm run lint    # 0 errors
npm run build   # Verify bundle size
```

4. **Bundle analysis**:
```bash
ANALYZE=true npm run build
# Check dist/index.html in analyzer
# Target: Main bundle < 200KB (down from ~500KB)
```

---

## 🧪 TESTING & VERIFICATION

### Pre-Migration Baseline
1. Record current Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
2. Record bundle size: `du -sh dist/*`
3. Record Chrome DevTools Performance trace (LCP, CLS)

### Daily Validation Checklist
- [ ] TypeScript: `npm run lint` passes (0 errors)
- [ ] Build succeeds: `npm run build`
- [ ] Smoke test passes
- [ ] Manual smoke test: Terminal loads, data visible
- [ ] No console errors in browser
- [ ] Accessibility spot check with axe DevTools

### Post-Migration Validation
1. **Bundle size**: Should be ~400KB total (vs ~850KB before)
2. **Lighthouse**: Accessibility score 100, Performance >90
3. **Vital signs**: LCP < 1.5s, CLS < 0.1
4. **Visual regression**: Compare screenshots with Percy/Chromatic
5. **Keyboard navigation**: Tab through entire UI, ensure focus visible
6. **Screen reader**: Test with VoiceOver/NVDA on 3 key pages

---

## 🛠️ MIGRATION PATTERNS CHEATSHEET

### Layout
| MUI | Tailwind |
|-----|----------|
| `<Container maxWidth="xl">` | `<div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8">` |
| `<Grid container spacing={3}>` | `<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">` |
| `<Grid item xs={12} md={6}>` | `<div className="md:col-span-1">` (use grid-cols count) |
| `<Box>` | `<div>` |
| `<Stack spacing={2}>` | `<div className="flex flex-col gap-2">` |
| `<Divider />` | `<hr className="border-b border-border" />` |

### Typography
| MUI | Tailwind |
|-----|----------|
| `<Typography variant="h1">` | `<h1 className="text-4xl font-black tracking-heading">` |
| `<Typography variant="h2">` | `<h2 className="text-3xl font-bold tracking-heading">` |
| `<Typography variant="body1">` | `<p className="text-base text-foreground/90">` |
| `<Typography variant="caption">` | `<span className="text-xs text-muted-foreground">` |
| `<Typography variant="button">` | `<span className="text-sm font-semibold">` |

### Components
| MUI | Replacement |
|-----|-------------|
| `Card` | shadcn Card (already) |
| `Button` | shadcn Button (already) |
| `Chip` | shadcn Badge |
| `Skeleton` | enhanced Skeleton (done) |
| `Tooltip` | shadcn Tooltip (Radix) |
| `Dialog` | shadcn Dialog (Radix) |
| `Drawer` | custom sidebar + Dialog |
| `Paper` | shadcn Card or div |
| `List` | `<ul>` with `<li>` |
| `Breadcrumbs` | custom `<nav><ol>` |
| `CircularProgress` | `<div className="animate-spin">` with SVG |
| `LinearProgress` | `<div>` with bg-gradient or Skeleton |
| `Alert` | shadcn Alert |
| `Avatar` | `<img>` or div with `rounded-full bg-muted` |
| `Link` | `<a>` or `NavLink` with Tailwind |
| `TextField` | shadcn Input + Label |
| `Select` | shadcn Select (to install) |
| `Checkbox` | shadcn Checkbox (to install) |
| `Switch` | shadcn Switch (to install) |
| `Slider` | shadcn Slider (to install) |
| `Tabs` | shadcn Tabs (Radix - already installed) |
| `Accordion` | shadcn Accordion (install) |

---

## ⚠️ RISK MITIGATION

### Risk: Breaking Production During Migration
**Mitigation**:
- Create feature branch: `feature/mui-migration-phase-2`
- Test locally with `npm run dev` after each component migration
- Deploy to staging environment daily for QA
- Keep rollback plan: git revert if critical bug

### Risk: Bundle Size Not Decreasing Enough
**Mitigation**:
- Run bundle analyzer after each major component migration
- Ensure we're dropping MUI CSS as well as JS
- If not decreasing, check for duplicate styles (Tailwind + leftover MUI)

### Risk: Styling Inconsistencies
**Mitigation**:
- Use centralized color palette from `theme.ts` and `tailwind.config.js`
- Enforce terminal colors: `terminal.gold`, `terminal.emerald`, `terminal.rose`, etc.
- Use consistent spacing (4px base: `p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`)
- Document pattern in `DESIGN_SYSTEM.md`

### Risk: Accessibility Regression
**Mitigation**:
- Add `jest-axe` tests before migration for each component
- Run full accessibility audit post-migration
- Test with screen readers (VoiceOver, NVDA)
- Ensure all interactive elements have `aria-label` if icon-only

---

## 📊 SUCCESS METRICS

### Quantitative
- **Bundle size**: < 400KB gzipped (from ~850KB)
- **MUI removal**: 0 imports from `@mui/material`
- **sx prop usage**: 0 (eliminated)
- **Performance**: LCP < 1.5s, CLS < 0.1
- **Accessibility**: 0 axe violations

### Qualitative
- **Design consistency**: All components follow terminal aesthetic
- **Developer experience**: Easier to style components (Tailwind vs sx)
- **Maintainability**: Single source of truth (Tailwind config)
- **Type safety**: Full TypeScript support with Tailwind types

---

## 🔄 ROLLBACK PLAN

If critical issues arise:

1. **Day-level rollback**: Revert commit for that day's work
   ```bash
   git revert <commit-hash>
   ```

2. **Branch strategy**: Keep branch clean, squash commits at end
   - Work on `feature/mui-migration-phase-2`
   - If necessary, abandon branch and restart

3. **Emergency hotfix**: If production broken, immediately revert last deploy and restore from backup.

---

## 📚 REFERENCE FILES

- `UI_UX_AUDIT_REPORT.md` - Original audit
- `tailwind.config.js` - Design tokens
- `src/theme.ts` - MUI theme (will become deprecated)
- `src/components/ui/` - shadcn component library
- `.claude/plans/merry-bubbling-sparkle.md` - Phase 1 completed

**Next action after this plan**: Begin Week 1 Day 1 - install missing shadcn components.
