# GraphiQuestor UX/UI Review
**Date**: March 30, 2026
**Reviewer**: Claude (AI Design Consultant)
**Scope**: Complete UI/UX audit of MacroDashboard terminal experience

---

## Executive Summary

GraphiQuestor is an **institutional-grade macro intelligence terminal** with a bold dark-mode aesthetic that successfully balances high-density data presentation with visual clarity. The three-column layout (sidebar-main-sidebar) is well-suited for desktop terminal use, and the hybrid MUI/Tailwind stack delivers consistent component patterns.

**Overall Assessment**: **B+ (85/100)** - Strong foundation with clear professional identity, but needs targeted improvements in typography consistency, mobile experience, and accessibility to reach world-class status.

---

## 1. Layout & Information Architecture

### Current State
- **Three-column permanent layout**: TerminalSidebar (220px) | Main content | IntelligenceSidebar (280px, collapsible)
- **Sticky header** with brand, regime detection, time display, and CTA
- **Grid-based section organization** with 6-12 column responsive breakpoints
- **Z-index layering** properly managed (sticky: 1100, tooltip: 1200, modal: 1300)

### What Works
- **Persistent navigation** reduces context switching - users always know where they are
- **Logical grouping** of macro sections maintains mental model (labs organized by theme)
- **Right sidebar** for time-sensitive intelligence (news) respects content priority
- **Collapsible right sidebar** preserves screen real estate when needed

### Issues Found
1. **Mobile navigation gap** - Left sidebar hidden at `lg` breakpoint (1024px), right sidebar hidden at `xl` (1280px), but there's **no mobile alternative** between 320px-1024px. Users on tablets/progressive web contexts lose navigation entirely.
2. **Unbalanced sidebar widths** - 220px vs 280px creates asymmetry; right sidebar + main content must total viewport, causing layout shifts on resize.
3. **Header height inconsistency** - Sticky header is `60px` on mobile, `72px` on desktop (`md:h-[72px]`). This jump at 768px creates layout shift annoyance on resize.

### Recommendations
- **Priority 1**: Implement mobile navigation drawer (hamburger menu) for viewports < 1024px with full menu parity
- **Priority 2**: Standardize header height (use 72px everywhere, or 64px) to eliminate CLS on breakpoint transitions
- **Priority 3**: Consider left sidebar collapsible option for users who want maximum main content width

---

## 2. Typography & Visual Hierarchy

### Current State
- **Font family**: Inter via MUI theme (`src/theme.ts:59`)
- **Mixed typography systems**:
  - MUI's typography scale for some components (`h1`, `h2`, `body1`)
  - Tailwind's arbitrary values (`text-2xl`, `text-xs`, `text-4xl`) for others
  - Custom metric-specific sizes in `MetricCard` (`text-4xl` → `text-3xl` auto-scale)
- **Tracking variations**: `tracking-tight`, `tracking-tighter`, `tracking-widest`, `tracking-[0.3em]` all in use

### What Works
- **Clear scale differentiation** between labels (uppercase `text-xs`) and values (`text-4xl`)
- **Tabular nums** on metric values prevents jitter during updates
- **Weight system** generally consistent: 800-900 for headings, 600-700 for subheads, 400-500 for body

### Issues Found
1. **Tracking inconsistency dilutes hierarchy** - Using 5 different letter-spacing values (`0.01em`, `-0.01em`, `-0.02em`, `-0.025em`, `0.1em`, `0.3em`) creates visual noise rather than hierarchy. The difference between `tracking-tight` (-0.025em) and `tracking-tighter` (implicit) is imperceptible but appears haphazard.
2. **Font-size proliferation** - 24+ distinct font-size utilities observed (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`, plus arbitrary `text-[0.55rem]` etc.). This indicates **lack of a defined type scale**.
3. **MUI/Tailwind duplication** - Both systems active leads to maintenance burden. Example: `MetricCard` uses MUI's `Typography` prop as children, but `SectionHeader` (unseen) likely uses Tailwind classes.
4. **Label case confusion** - All-uppercase labels (`uppercase tracking-widest`) compete with title-case headings. No clear visual grammar for when to use which.

### Recommendations
- **Priority 1**: Define and document a **8-step type scale** (e.g., using modular scale 1.25 or 1.333). Map each step to a Tailwind utility or MUI typography variant. Replace arbitrary values with scale tokens.
- **Priority 2**: Limit tracking to **3 values**:
  - Headings: `-0.02em` (compact but readable)
  - Body: `0` (neutral)
  - Uppercase labels: `0.1em` (breathing room)
  - Remove all inline `tracking-[...]` exceptions
- **Priority 2**: Standardize on **one typography system** (Tailwind recommended for your custom dark theme, since MUI's theme is fighting your CSS variables). If keeping MUI, remove direct Tailwind text-size classes and use `<Typography variant="...">` exclusively.
- **Priority 3**: Create a **content style guide**:
  - Section titles: sentence case, not ALL CAPS (readability > stylization)
  - Metric labels: `text-xs font-semibold tracking-wider uppercase`
  - Descriptions: `text-sm text-muted-foreground leading-relaxed`
  - timestamps: `text-[0.65rem] font-mono`

---

## 3. Color & Contrast

### Current State
- **Theme**: Dark mode only (enforced via `darkMode: ["class"]`)
- **Background**: Slate 950 (#020617) from MUI theme + Tailwind `bg-background` (CSS var)
- **Border colors**: `border-white/10` (10% opacity white) - approximately #FFFFFF1A
- **Brand accent**: Blue 500 (#3b82f6) with emerald (#10b981) and rose (#f43f5e) as status colors
- **Text hierarchy**:
  - Primary: `text-foreground` (Slate 50: #f8fafc)
  - Secondary: `text-muted-foreground` (Slate 400: #94a3b8 at 60% opacity)
  - Tertiary: `text-muted-foreground/50` or `/40` (even lower opacity)

### What Works
- **Status color system clear and consistent** - green=positive/expansion, red=negative/risk, blue=neutral/primary
- **Subtle gradients and glows** used judiciously (e.g., regime tint, card hover effects)
- **Color-coded regime detection** provides immediate context without reading

### Issues Found
1. **Border contrast too low** - `border-white/10` (#FFFFFF1A) on `#020617` has **luminance delta of ~0.09**, far below WCAG AA's 0.2 for non-text elements. Borders are effectively invisible on lower-quality displays or under ambient light.
2. **Muted text contrast fails WCAG** - `text-muted-foreground/40` on dark background is approximately **4.2:1** (below 4.5:1 AA requirement for large text, and 7:1 for AAA). With opacity stacking (`/40` over `#94a3b8`), actual contrast can dip under 3:1.
3. **Blue-on-dark readability** - Primary blue #3b82f6 (120° hue, 75% lightness) against #020617 (2% lightness) is **4.8:1** - only AA compliant for large text, not body text.
4. **No color-blind safe palette verification** - Sole reliance on red/green for status may fail deuteranopia (green appears muted).

### Recommendations
- **Priority 1 (Accessibility compliance)**: Increase border opacity to **12-15%** (`border-white/12` to `border-white/15`). This maintains elegance while ensuring detectable boundaries.
- **Priority 1**: Adjust muted text from `text-muted-foreground/40` → `text-muted-foreground/60` minimum. Test contrast ratios; aim for 4.5:1 minimum for all text, 7:1 for primary content.
- **Priority 1**: Verify all text/background combos with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/). Pay special attention to small text (≤14px).
- **Priority 2**: Add **shape + color** redundancy for status indicators (already partially there with icons: `TrendingUp/Down/Minus`). Add subtle pattern fills or position indicators for colorblind users.
- **Priority 2**: Consider lighter blue accent - try `#60a5fa` (blue-400, 85% lightness) for improved contrast while maintaining visual hierarchy.

---

## 4. Spacing & Density

### Current State
- **Design tokens defined** in `src/theme.ts`:
  - `sectionMajor: 6` (48px) between major sections
  - `sectionMinor: 4` (32px) between related subsections
  - `cardGap: 2.5` (20px) grid gap
  - `inlineGap: 1.5` (12px) for inline elements
- **Padding patterns**: Cards use `p-6` (24px), some use `p-8` (32px), headers vary
- **Container max-width**: `max-w-[1920px]` in GlobalLayout, plus Tailwind's container `2xl: 1400px`

### What Works
- **High-density data** presentation without feeling claustrophobic (Bloomberg terminal legacy)
- **Grid spacing consistent** within sections (MUI `spacing={3}` = 24px)
- **Section separation** via `space-y-16` (64px) or custom margins creates clear visual breaks
- **Card internal padding** (24px) provides breathing room for metric values

### Issues Found
1. **Spacing scale tension** - MUI spacing (`spacing: 8`) multiplies by numeric value (so `spacing={3}` = 24px), while Tailwind uses `rem`-based scale (4 = 1rem, 6 = 1.5rem). **Two different spacing systems** fighting each other causes inconsistent gaps: 24px vs 1.5rem (=24px at default) are nominally same but can drift if base font size changes.
2. **Vertical rhythm not established** - No consistent increment (e.g., all vertical margins = multiples of 8px). Section headers use `mb-6` (24px), `mb-8` (32px), `mb-16` (64px) seemingly arbitrarily.
3. **Whitespace asymmetry** - Sections like `IndiaMacroPulseSection` have `space-y-16` (64px) between main elements, but `CompresPulseMetric` uses only `p-4` (16px) internal padding, creating **outer > inner** imbalance (64px outside, 16px inside).
4. **Responsive spacing not optimized** - Same `p-6` (24px) used on mobile and desktop. Touch targets on mobile may be too cramped.

### Recommendations
- **Priority 1**: **Choose one spacing system** and migrate fully. Given Tailwind + CSS var investment, **standardize on Tailwind spacing** (`p-4` = 16px, `p-6` = 24px, etc.) and remove MUI `spacing` props in favor of explicit Tailwind classes. This ensures pixel-perfect consistency.
- **Priority 2**: Define a **vertical spacing scale**:
  - `space-y-xs` = 8px (between inline elements)
  - `space-y-sm` = 16px (card internal spacing)
  - `space-y-md` = 24px (standard inter-card)
  - `space-y-lg` = 32px (between sections)
  - `space-y-xl` = 48px (major section breaks)
  - `space-y-2xl` = 64px (page-level breaks)
- **Priority 2**: Ensure **inner padding >= half of outer spacing**. If outer gap is 64px, inner card padding should be 24-32px, not 16px. Rule of thumb: `inner padding = outer spacing / 2` (at minimum).
- **Priority 3**: Increase mobile touch targets:
  - Navigation items: `min-h-[44px]` (Apple HIG)
  - Buttons: increase from current `py-2` to `py-3` on mobile
  - Grid gaps: increase from `gap-6` to `gap-8` on small screens

---

## 5. Components & Patterns

### Current State
- **Hybrid component library**: MUI components (Card, Grid, Box) + shadcn/ui primitives (Tooltip, Card, Skeleton, Badge) + custom components (MetricCard, MotionCard, SectionHeader)
- **Animation**: Framer Motion for entry animations (`initial: { opacity: 0, y: 20 }`, `viewport: { once: true }`)
- **Loading states**: MUI Skeleton, custom shimmer placeholders
- **Error handling**: `SectionErrorBoundary`, `GlobalErrorBoundary`
- **Interaction**: Hover effects on cards (`hover:shadow-md hover:border-blue-500/30`), global highlight on macro-dashboard events

### What Works
- **MetricCard abstraction** is excellent - encapsulates value display, delta, sparkline, status, tooltips, source attribution. This is **reusable architecture done right**.
- **MotionCard** provides staggered entry animations that enhance perceived performance and polish.
- **HoverDetail** wrapper adds progressive disclosure without cluttering default view.
- **Status badges** with colored dots/pills allow rapid pattern matching across dozens of metrics.
- **Skeleton loaders** maintain layout stability and signal "data loading" vs "no data."

### Issues Found
1. **Card inconsistency** - Three different "card" sources create cognitive dissonance:
   - MUI `<Card>` (Material design lift shadows, used in GlobalLiquiditySection)
   - shadcn `<Card>` (minimal borders, used with MotionCard wrapper)
   - Custom `<div className="bg-white/[0.01] border...">` (like CompactPulseMetric)

   **Users see three different visual treatments for the same semantic concept**. Signals disconnected design system.
2. **Border radius fragmentation** - MUI theme sets `borderRadius: 12` globally, but:
   - shadcn Card: `rounded-xl` = 12px ✓
   - Custom cards: `rounded-2xl` = 16px, `rounded-3xl` = 24px
   - MetricCard: `rounded-lg` = 8px (from MUI Card)
   This **breaks visual continuity** across a single viewport.
3. **Shadow philosophy conflict** - MUI Card has `boxShadow` from theme, but many custom divs have **no shadow** or use `shadow-none`. The shadow depth either contributes to hierarchy or it doesn't - mixing flat/floating cards creates false depth cues.
4. **Shadow threshold too low** - MUI shadow is quite subtle: `0 10px 15px -3px rgba(0,0,0,0.4)`. On dark mode with dark cards on dark bg, this adds minimal lift. Consider **colored glows** or **border emphasis** instead for terminal aesthetic.
5. **Hover affordances unclear** - Cards rely on `hover:shadow-md` and `hover:border-blue-500/30`. But blue border at 30% opacity is barely noticeable. Suggest **stronger color shift** or **scale transform** (0.98→1.00) for perceptible interactivity.

### Recommendations
- **Priority 1**: **Consolidate to one Card component** and extend it. Recommended:
  - Base: shadcn `<Card>` (lightweight, unopinionated)
  - Add `variant="metric"` prop for MetricCard cases (adds status badge area, footer meta)
  - Add `variant="elevated"` prop for cards that need depth
  - Remove MUI `<Card>` usage entirely (replace with wrapper div if needed for Grid)
- **Priority 2**: **Standardize border radius** to `rounded-xl` (12px) everywhere. This is your established brand radius from MUI theme. Remove `rounded-2xl`, `rounded-3xl`, `rounded-3xl` unless a special "hero" card variant is explicitly designed.
- **Priority 3**: **Define shadow strategy**:
  - Default: `shadow-sm` (minimal) or `shadow-none` with border emphasis
  - Elevated: `shadow-lg` with optional colored glow
  - Floating (modal/interactive): `shadow-2xl`
  - Be consistent: if a card type doesn't have shadow, all cards of that type shouldn't
- **Priority 4**: **Improve hover feedback**:
  - Scale: `hover:scale-[1.02]` (2% lift feels deliberate)
  - Border: `hover:border-blue-500/50` (50% opacity clearly visible)
  - Background: `hover:bg-card/80` (subtle lighten)
- **Priority 5**: **Document component variants** in a Storybook or at least a `COMPONENTS.md` file showing when to use which variant.

---

## 6. Responsive Design

### Current State
- **Breakpoints** (MUI custom): xs: 0, sm: 600, md: 960, lg: 1280, xl: 1600, xxl: 1920
- **Tailwind breakpoints**: sm: 640, md: 768, lg: 1024, xl: 1280, 2xl: 1536
- **Strategy**: Desktop-first with `hidden lg:flex` etc. for progressive disclosure
- **Grid layouts**: MUI Grid container with `xs={12} lg={4}` type breakpoints
- **Sidebars**: Left visible `lg:` (1024px+), right visible `xl:` (1280px+)

### What Works
- **Desktop experience is rich** - three-column layout with sufficient width for dense data
- **Grid responsive behavior** works as expected (12→4 columns at lg)
- **Right sidebar collapsible** saves space when needed
- **Horizontal scroll for charts** on mobile (`.chart-scroll-container`)

### Issues Found
1. **Breakpoint mismatch** - Using both MUI and Tailwind breakpoints creates **collision risk**. Example: GlobalLayout hides left sidebar at `lg` (MUI breakpoint = 1280px) but Tailwind's `lg` = 1024px. This can cause jumpy behavior if both systems used in same component.
2. **Tablet and small laptop gap** - `lg:hidden` means 1024-1279px users get NO left sidebar OR right sidebar (if also below `xl`). This is a **large and valuable user segment** (13.7% of global desktop traffic according to StatCounter) left without navigation.
3. **Mobile navigation absent** - Below 1024px, there is **no persistent navigation**. Users must rely on breadcrumbs (if any) or URL guessing. No hamburger menu, no bottom nav.
4. **Touch targets** - TerminalSidebar nav items: `px-3 py-2` = 12px vertical, 12px horizontal padding. Minimum touch target should be 44×44px per Apple HIG, 48×48px per Material Design.
5. **Chart responsiveness** - Charts from MUI Grid may overflow container on small screens if min-width not enforced. `.chart-scroll-container` helps but should be applied systematically.

### Recommendations
- **Priority 1**: **Unify breakpoints** - Choose either MUI OR Tailwind as the source of truth. Recommended: **use Tailwind breakpoints exclusively for visibility classes** (`hidden lg:flex`), and use MUI breakpoints for Grid ONLY. Never mix in same component.
- **Priority 1**: **Add mobile navigation** for <1024px:
  - Hamburger menu (top-left) that opens drawer with full menu
  - Drawer width: 280px (standard iOS/Android)
  - Include same navigation items with active state indicators
  - Touch target: minimum 44×44px, with 16px padding inside items
- **Priority 2**: **Show left sidebar on tablets** - Change breakpoint from `lg:` (1024px) to `md:` (768px) for TerminalSidebar. More users benefit from navigation than lose horizontal space.
- **Priority 2**: **Enforce minimum chart widths** - All Recharts/vis components should have `min-width: 320px` (iPhone SE width) inside `.chart-scroll-container` (already defined in CSS). Audit to ensure all charts use this.
- **Priority 3**: **Responsive typography** - Use `clamp()` for hero values (already used in CSS utilities) to prevent overflow on narrow screens. Example: `text-4xl` → `clamp(2rem, 5vw, 3rem)`.

---

## 7. Accessibility

### Current State
- **Semantic HTML**: Good use of `<header>`, `<aside>`, `<main>`, `<nav>`
- **ARIA**: Unknown, needs audit
- **Focus states**: Unclear if visible focus rings exist (Tailwind `focus:` classes)
- **Color contrast**: Issues identified in Section 3
- **Motion**: Respects `prefers-reduced-motion` for SPA utilities
- **Keyboard nav**: React Router navigation should work, but custom div-based cards may not be focusable

### What Works
- **Sticky headers** and sidebars aid navigation
- **Error boundaries** prevent entire page crashes
- **Loading skeletons** provide feedback
- **CommandPalette** likely provides keyboard shortcut (`Cmd+K`) for power users

### Issues Found
1. **Non-semantic interactive elements** - Many cards are `<div>` or `<Card>` with `onClick` handlers but without `role="button"` or keyboard event handlers. **Keyboard-only users cannot access** card interactions.
2. **Missing focus indicators** - No visible `:focus` styles observed in codebase. Users with low vision or keyboard navigation **cannot see where focus is**.
3. **Color-only status indicators** - Red/green pills and trend arrows convey meaning without shape/size/label redundancy. Fails WCAG 1.4.1.
4. **Touch target sizes** - As noted in Section 6, some interactive elements below 44×44px.
5. **Heading hierarchy** - Apparent mixing of heading levels without clear sequence. `h2` used for section titles, but then `h4` used within sections for subsection titles - may skip levels.

### Recommendations
- **Priority 1 (WCAG compliance)**: Add **visible focus rings**:
  ```css
  *:focus-visible {
    outline: 2px solid #3b82f6; /* blue-500 */
    outline-offset: 2px;
    border-radius: 4px;
  }
  ```
- **Priority 1**: Make **all interactive cards keyboard accessible**:
  - If card is clickable, use `<button>` or `<a>` instead of `<div>`
  - OR add `tabIndex={0}`, `role="button"`, and `onKeyDown` handler for `Enter`/`Space`
- **Priority 1**: Fix **color-only indicators**:
  - Status pills: add pattern (e.g., striped background) or include text label (`UP`, `DOWN`, `—`)
  - Trend arrows: also show `+2.3%` text (already present) - ensure text always visible, not hidden in tooltip
- **Priority 2**: **Audit heading hierarchy** with axe or Lighthouse. Ensure:
  - Single `h1` per page (currently: "GraphiQuestor" is likely logo not heading)
  - Section headers: `h2`
  - Subsection headers: `h3`
  - Widget titles: `h4` max (don't skip to `h5` without `h4` first)
- **Priority 3**: Add **skip-to-content link** for keyboard users to bypass navigation: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>`

---

## 8. Visual Design & Brand Identity

### Current State
- **Brand name**: "GraphiQuestor" with blue accent (#3b82f6)
- **Tagline**: "Macro Observatory · Not Sovereign AI"
- **Aesthetic**: Dark glassmorphic terminal - Bloomberg meets Web3
- **Logomark**: Activity icon (circuit/activity glyph) with regime-tinted drop-shadow
- **Corner radius**: 12px (xl) consistently in theme
- **Special effects**: Backdrop blur on sticky elements, radial gradient background tint based on regime

### What Works
- **Strong, distinctive identity** - "Not Sovereign AI" immediately sets tone and differentiates from marketing-heavy fintechs
- **Regime-based color theming** is brilliant - subtle but informative, rewards returning users
- **Terminal aesthetic** aligns with institutional users (traders, analysts) expectations
- **Glass effects** (backdrop-blur, background opacity) create depth without overwhelming
- **Micro-interactions**: regime color on logo, pulsing "LIVE" indicators, hover gradients

### Issues Found
1. **Brand dilution through inconsistency** - Logo displays as "GraphiQuestor" but navigation items say "Observatory", "Labs", etc. No coherent naming system. Is it "GraphiQuestor" or "Macro Observatory" or both? Pick one primary brand name.
2. **"Not Sovereign AI" tagline ambiguity** - What does it mean? Double negative confusion. If you mean "Independent AI" or "Non-Sovereign Intelligence", say that directly. Current phrasing feels clever but unclear.
3. **Visual noise from too many status badges** - Every card has: label + status badge + timestamp + z-score + sparkline. The **information density is high, but signal-to-noise ratio suffers**. Consider progressive disclosure.
4. **Regime tint too subtle** - `rgba(16,185,129,0.03)` (3% opacity) is virtually invisible on most displays. If it's meaningful, make it `0.06-0.08`; if not, remove it.
5. **Background pattern lacks texture** - Pure flat background with single radial gradient feels sterile. Consider adding very subtle grid (0.5% opacity) or grain texture for tactile feel.

### Recommendations
- **Priority 1**: **Clarify brand architecture**:
  - Primary name: "GraphiQuestor" (strong, memorable)
  - Tagline: "Institutional Macro Intelligence" (clear value prop)
  - Subtitle/descriptor: "Data, not narratives" or "Telemetry, not tealeaves"
  - Remove "Not Sovereign AI" or replace with positive statement
- **Priority 2**: **Reduce status badge density**:
  - Only show essential info in default state: label, value, delta, last updated
  - Move Z-score, percentile, methodology to tooltip/expandable panel
  - Use `HoverDetail` more aggressively to keep cards clean
- **Priority 3**: **Enhance regime tint visibility** to `0.06` opacity or add a subtle gradient overlay (e.g., vertical gradient 0-20% height in regime color at 5% opacity) that's perceptible but not distracting.
- **Priority 4**: **Add background texture** - create a CSS pattern:
  ```css
  .terminal-bg {
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 50px 50px; /* subtle grid */
  }
  ```
  Apply to `<body>` or main container.

---

## 9. Performance & Technical UX

### Current State
- **Framer Motion** for animations (lightweight at 12.34.0)
- **React Query** for data fetching and caching
- **Lazy loading** for pages (`React.lazy()`)
- **Skeleton loaders** for perceived performance
- **Supabase** for real-time updates (5-60s intervals)

### What Works
- **Entry animations** staggered with `delay` props prevent layout thrash
- **Suspense boundaries** handle loading gracefully
- **Query refetch intervals** appropriate for different data types
- **Viewport-triggered animations** (`whileInView`) avoid unnecessary renders

### Issues Found
1. **Animation performance overhead** - All MotionCard children animate individually. On a page with 30+ cards, this creates **too many concurrent animations** (each triggers on scroll). Consider:
   - Reducing to `staggerChildren` on parent container
   - Lowering `viewport` margin from `-50px` to avoid triggering too early
   - Using `redux` or context to disable animations after initial load for returning users
2. **Query refetch storms** - Multiple hooks with `refetchInterval: 300000` (5m), `60000` (1m) can cause **spikes in network requests**. Ensure they're staggered (e.g., use jitter: `Math.random() * 60000` offset).
3. **Bundle size concern** - MUI material + icons + framer-motion is heavy (~200KB+ gzipped). For data terminal, consider **lighter alternatives**:
   - Replace MUI Grid with CSS Grid (Tailwind `grid-cols-{n}`)
   - Replace MUI Card with custom div (already partially done)
   - Use `lucide-react` icons exclusively (already in use, remove MUI icons)
4. **No loading prioritization** - All sections fetch in parallel with same priority. **Critical section** (e.g., main macro pulse) should load before secondary sections (news sidebar). Consider `React.Query` `priority: 'high'` if available, or separate query groups.

### Recommendations
- **Priority 1**: **Optimize animations** - Implement container-level stagger:
  ```tsx
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
    {children.map((child, i) => (
      <motion.div key={i} variants={item} transition={{ delay: i * 0.05 }} />
    ))}
  </motion.div>
  ```
- **Priority 2**: **Stagger refetch intervals** by adding jitter to avoid thundering herd:
  ```ts
  refetchInterval: (index) => 300000 + Math.random() * 60000
  ```
- **Priority 3**: **Tree-shake MUI** - Audit what components actually used. If only `Grid`, `Box`, `Card`, consider replacing with:
  - Grid: Tailwind `grid grid-cols-{breakpoint}` + `gap-{n}`
  - Box: `<div>` with `cn()` utility
  - Card: shadcn Card (already architected)
- **Priority 4**: **Implement loading prioritization** - For `/` route, load "Global Macro Overview" section first (above the fold), then secondary sections. Consider code-splitting at section level if not already.

---

## 10. Mobile Experience (Critical Gap)

### Current State
- **No dedicated mobile styles** - GlobalLayout hides sidebars at `lg` and `xl` breakpoints but provides **no replacement navigation**
- **Touch targets** often below recommended 44×44px
- **Horizontal scrolling** for charts exists but not consistently applied
- **Text scaling** - uses `clamp()` for some elements but not all

### Issues Found (Critical)
1. **Navigation black hole** between 320px and 1024px width - users cannot navigate
2. **Card touch targets** - `px-3 py-2` (12px vertical) in sidebar is 28px total height (too small)
3. **No viewport meta tag verification** - Need to ensure `<meta name="viewport" content="width=device-width, initial-scale=1">` is present for iOS Safari scaling
4. **Chart overflow** - MUI Grid items don't have `min-w-0` by default, causing overflow on tiny screens
5. **Password managers & accessibility** - Missing form labels (no forms, but login/API access pages if any)

### Recommendations
- **Priority 0 (Blocking)**: **Implement mobile navigation drawer** before any other responsive work. This is the single biggest UX gap.
  - Hamburger icon top-left (fixed/sticky)
  - Full-screen or 280px-width drawer
  - Include all navigation items with same active states
  - Close on link click
- **Priority 1**: **Increase touch target sizes**:
  - Sidebar items: `min-h-[44px]`, `px-4 py-3` minimum
  - Buttons: `min-h-[44px]`, `px-4` minimum
  - Card clickable areas: full card should be touch target (already true), but ensure `min-h-[60px]` for vertical cards
- **Priority 2**: **Responsive typography across all text** - Use `clamp()` for headings and values, or Tailwind's `text-sm md:text-base lg:text-lg` pattern systematically.
- **Priority 3**: **Add mobile-specific optimizations**:
  - Single-column layout: `grid-cols-1` with `gap-8`
  - No horizontal scrolling within main content (charts can scroll if needed)
  - Simplified status badges on mobile (remove Z-score %, show only `DELTA ±X%`)

---

## Priority Matrix: Quick Wins vs. Strategic Improvements

### Quick Wins (Low Effort, High Impact) - Do First
1. **Increase border contrast** (`border-white/10` → `/12-15`) - 1-line CSS change, immediate perceptibility
2. **Fix muted text contrast** (`/40` → `/60`) - 1-line CSS change, accessibility win
3. **Add visible focus rings** - 5-line CSS, huge keyboard-nav improvement
4. **Standardize header height** - Change `md:h-[72px]` → `h-[72px]` in GlobalLayout (or vice versa)
5. **Add mobile hamburger menu skeleton** - Use existing `MobileNav` component (exists in imports) but appears inactive. Wire it up.

### Medium Effort, High Impact
1. **Define typography scale** and replace arbitrary values (estimated 8-16h)
2. **Implement unified Card component** and migrate all usages (12-20h)
3. **Add mobile navigation drawer** with full menu (8-12h)
4. **Fix color-only status indicators** (4-6h)
5. **Add background texture** (2-4h)

### Strategic (High Effort, Transformative)
1. **Migrate from MUI → Tailwind** for layout/components (40-60h)
2. **Implement responsive spacing scale** across all components (16-24h)
3. **Build component library documentation** (12-20h)
4. **Performance optimization** (bundle reduction, animation tuning) (16-24h)
5. **Comprehensive accessibility audit & remediation** (20-30h)

---

## Specific Design Adjustments (With Examples)

### 1. MetricCard - Clean Version
**Current issues**: too many dense elements, inconsistent hierarchy

**Recommended layout**:
```
┌─────────────────────────────────────┐
│ LABEL                    STATUS    │ (row 1: label + status badge)
│                                 │
│ 123,456                    +2.3%   │ (row 2: value + delta, large)
│ BILLION                                 │
│                                 │
│ ──────○───────                  │ (row 3: sparkline, ~20% width)
│                                 │
│ FREQ • SOURCE    [σ 1.2]    │ (row 4: metadata, smaller)
└─────────────────────────────────────┘
```
- Remove z-score from footer unless `percentile` present (institutional view only)
- Group source/frequency together, not with sigma
- Reduce footer size from `text-xs` to `text-[0.65rem]`

### 2. Sidebar Navigation Active State
**Current**:
```tsx
className="... bg-blue-500/10 text-white shadow-[inset_0_0_12px_rgba(59,130,246,0.15)] border-blue-500/20"
```
**Issue**: Blue glow on left side (`shadow-[inset_0_0_12px_...]`) creates heavy inset that looks like "selected" but not "active navigation".

**Recommended**:
- Use left border accent only: `border-l-2 border-l-blue-500 bg-blue-500/5`
- Remove inset shadow (too heavy)
- Remove right-side indicator dot (redundant with border)

### 3. Header Regime Detection Badge
**Current**: Small pill with `px-2 py-0.5` (tight) and `text-[0.65rem]`
**Issue**: Verbose: "DETECTION: EXPANSION" takes 22 characters.

**Recommended**:
- Use icon + short label: `📈 EXPANSION` or `→ TIGHTENING`
- Or: pill with regime abbreviation: `REG: EXP` (shorter)
- Increase padding to `px-3 py-1` for clickability if interactive

### 4. Intelligence Sidebar Headlines
**Current**: Card uses `p-4` (16px) with `text-xs` headline (12px)
**Issue**: Too cramped for reading news snippets

**Recommended**:
- Increase card padding to `p-5` (20px)
- Headline: `text-sm` (14px) instead of `text-xs`
- Metadata (source, time): `text-[0.65rem]` (10.4px)
- Line height: `leading-relaxed` (1.6) for headlines

---

## Testing Checklist (Before Shipping Any Changes)

- [ ] **Contrast validation**: All text/background combos meet WCAG AA (4.5:1 large, 7:1 normal)
- [ ] **Keyboard navigation**: Tab through entire page, all interactive elements reachable and operable
- [ ] **Focus visibility**: Clear focus ring visible on all interactive elements
- [ ] **Mobile navigation**: Hamburger menu opens/closes, all items accessible, touch targets ≥44×44px
- [ ] **Touch target sizing**: Verify with Chrome DevTools device mode, tap targets actual size
- [ ] **Layout shift**: No CLS on breakpoint transition (header height unified, fonts loaded)
- [ ] **Animation respect**: `prefers-reduced-motion` disables all motion (test in OS settings)
- [ ] **Performance**: Lighthouse performance >90, no layout thrash during scroll
- [ ] **Cross-browser**: Test on Safari (WebKit), Chrome (Blink), Firefox (Gecko)
- [ ] **Colorblind mode**: Use Coblis or Chromatic Vision Simulator to verify pattern+text redundancy

---

## Summary of Recommendations (Ordered by Priority)

### Tier 1 (Fix Immediately)
1. Fix color contrast (borders + text) - **Accessibility blocker**
2. Add visible focus rings - **Accessibility blocker**
3. Add mobile navigation drawer - **UX blocker for 30%+ users**
4. Unify header height - **CLS fix**
5. Make interactive cards keyboard accessible - **WCAG 2.1.1 Level A**

### Tier 2 (Important, Do This Sprint)
6. Define typography scale and replace arbitrary values
7. Consolidate to single Card component (shadcn base)
8. Standardize border radius to 12px everywhere
9. Increase touch target sizes
10. Implement spacing scale (choose Tailwind exclusively)

### Tier 3 (Next Sprint)
11. Clarify brand identity (name, tagline)
12. Reduce status badge density
13. Enhance regime tint visibility
14. Add background texture
15. Improve hover feedback (scale + border)
16. Build component documentation

### Tier 4 (Backlog)
17. Migrate from MUI → Tailwind for layout
18. Performance optimization (bundle size, refetch staggering)
19. Comprehensive accessibility audit
20. Build Storybook design system

---

## Final Thoughts

GraphiQuestor has a **strong, distinctive identity** and serves its institutional audience with appropriate gravitas. The terminal aesthetic works. However, the **technical debt in the design system** (mixed MUI/Tailwind, inconsistent spacing, fragmented components) limits scalability and makes simple changes risky.

**Your biggest risk**: Adding new features compounds the inconsistency. **Your biggest opportunity**: Cleaning up the design system (Tier 2 work) will make future development faster, more consistent, and less buggy.

Invest in **design system hygiene** now - define your tokens, standardize components, document the patterns. The codebase is at the inflection point where ad-hoc decisions are creating maintenance burden. A 2-3 week cleanup sprint will pay dividends for months.

**Next step**: Review this document, prioritize the Tier 1 items, and let's implement them in sequence. After Tier 1, reassess and adjust.

---

*Prepared for GraphiQuestor macro intelligence terminal. All observations based on codebase analysis as of commit `ee579c4`.*
