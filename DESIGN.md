---
name: GraphiQuestor Institutional Terminal
version: "2.0"
status: active
productType: data-dense institutional macro terminal
themes:
  default: light
  alternate: dark
fonts:
  ui: Fira Sans
  data: Fira Code
---

# GraphiQuestor design system

GraphiQuestor is an institutional macro intelligence terminal for allocators, research desks, central-bank watchers, and quantitative strategists. The interface should feel calm under pressure, precise at a glance, and distinctive enough to be remembered after a long research session.

The product is an app UI. It is not a marketing dashboard. Data, provenance, freshness, and state carry the visual hierarchy.

## Design north star

**Observe structural reality. Do not forecast.**

Every visual decision should improve one of these user outcomes:

- Find the current regime quickly.
- Separate live telemetry from interpretation.
- Read numerical changes without visual strain.
- Understand the source and freshness of every metric.
- Move from overview to methodology without losing context.

Premium comes from restraint, rhythm, and evidence. It does not come from more glow, more gradients, more cards, or more decorative copy.

## Theme architecture

Use semantic CSS variables. Components must consume semantic tokens such as `--surface-page`, `--text-primary`, and `--signal-warning`. Raw hex values belong only in the theme token source.

Both themes use the same semantic names, spacing, typography, interaction states, and component geometry. A theme changes the optical temperature of the terminal. It does not change information hierarchy.

### Light Mode

Light Mode is the default daylight research surface. It uses warm ivory, mineral teal, and a controlled orange signal. This was previously called Lively Mode in the application.

```css
/* Light Mode */
--surface-page: #FDF6E3;
--surface-panel: #FFFCF4;
--surface-subtle: #F4F7F7;
--surface-raised: #FFFFFF;
--surface-inset: #E7EEF0;
--text-primary: #17212B;
--text-secondary: #3B4E59;
--text-muted: #52636C;
--text-on-accent: #FFFFFF;
--border-default: #C8D2D5;
--border-strong: #9EAFB5;
--focus-ring: #1D4ED8;
--accent-primary: #FF5D05;
--accent-primary-soft: #FFF0E8;
--accent-secondary: #0B5A68;
--accent-secondary-soft: #E7F3F3;
--accent-blue: #1D4ED8;
--accent-blue-soft: #E8F0FF;
--signal-positive: #065F46;
--signal-positive-soft: #E8F6EF;
--signal-warning: #9A400E;
--signal-warning-soft: #FFF2D8;
--signal-negative: #B42318;
--signal-negative-soft: #FDECEC;
--signal-neutral: #52636C;
--signal-neutral-soft: #EDF1F2;
```

Light Mode rules:

- Keep the page canvas warm and quiet. Panels may be white, but they must remain visibly related to the ivory canvas.
- Use orange for product energy, active navigation, and one primary action. Do not use it for generic decoration.
- Use teal for institutional context, provenance, methodology, and stable system states.
- Use blue for links and keyboard focus. Blue must remain distinct from status colors.
- Avoid pure black text, pure white page backgrounds, saturated rainbow status colors, and beige-on-beige text.
- Keep shadows short and cool. A 1px border plus a small elevation cue should carry most surfaces.

### Dark Mode

Dark Mode is the long-session and low-light surface. It is a layered obsidian interface with desaturated telemetry accents. It is not an inverted Light Mode palette.

```css
/* Dark Mode */
--surface-page: #070B10;
--surface-panel: #0E141A;
--surface-subtle: #111A21;
--surface-raised: #151F27;
--surface-inset: #05080B;
--text-primary: #E7EEF2;
--text-secondary: #B6C4CC;
--text-muted: #8FA1AA;
--text-on-accent: #111418;
--border-default: #2B3942;
--border-strong: #465761;
--focus-ring: #8AB4FF;
--accent-primary: #FF7A33;
--accent-primary-soft: #3A2115;
--accent-secondary: #55D6C2;
--accent-secondary-soft: #12312F;
--accent-blue: #8AB4FF;
--accent-blue-soft: #172945;
--signal-positive: #6CE7B1;
--signal-positive-soft: #12372B;
--signal-warning: #F6C56B;
--signal-warning-soft: #3A2B12;
--signal-negative: #FF9B9B;
--signal-negative-soft: #401C20;
--signal-neutral: #B6C4CC;
--signal-neutral-soft: #202B32;
```

Dark Mode rules:

- Use surface elevation to separate regions. Do not make every panel a different shade.
- Primary text is soft white. Reserve full white for rare high-priority values.
- Desaturate accents against dark surfaces. Bright accents belong to active or exceptional states.
- Keep dividers visible at rest. A dark border that disappears on a dark panel is a hierarchy failure.
- Apply `color-scheme: dark` when Dark Mode is active.
- Keep glow limited to live indicators and focus. Never use glow as a substitute for contrast.

## Contrast and status contract

Every normal text pair must meet WCAG AA at 4.5:1. Large text and meaningful UI boundaries must meet 3:1. Primary and secondary text must be tested independently in both themes.

Color is never the only signal. A positive, warning, or negative state also needs a word, icon, shape, or position cue. Status names are stable across the product:

| Meaning | Token | Required label language |
| --- | --- | --- |
| Positive / expanding | `--signal-positive` | Positive, Expanding, Improving |
| Warning / lagged | `--signal-warning` | Warning, Lagged, Review |
| Negative / stressed | `--signal-negative` | Stressed, Contracting, Critical |
| Neutral / unavailable | `--signal-neutral` | Neutral, Pending, Unavailable |

Use the same state vocabulary in cards, charts, tooltips, tables, badges, and the data-health surface. Never introduce a new green, amber, red, or gray per feature.

## Typography

Use exactly two families across the product:

- **Fira Sans** for navigation, headings, labels, helper copy, buttons, and analytical prose.
- **Fira Code** for metric values, dates, timestamps, table columns, tickers, formulas, and telemetry strings.

Do not use Inter, Space Grotesk, Roboto, system-ui, `-apple-system`, or one-off page fonts. This removes the current rendered split where headings resolve to Inter while the rest of the terminal uses Fira Sans and Fira Code.

```css
--font-ui: "Fira Sans", sans-serif;
--font-data: "Fira Code", monospace;
```

Type scale:

| Role | Family | Size / line-height | Weight | Use |
| --- | --- | --- | --- | --- |
| Display | UI | 40 / 44px | 800 | One page-level title only |
| Title | UI | 24 / 30px | 700 | Major terminal section |
| Heading | UI | 16 / 22px | 700 | Module heading |
| Subheading | UI | 14 / 20px | 600 | Nested module or control group |
| Body | UI | 16 / 24px | 400 | Explanatory text and long-form copy |
| Compact body | UI | 14 / 20px | 400 | Dense utility copy |
| Label | UI | 12 / 16px | 600 | Navigation, chips, metadata |
| Micro label | UI | 11 / 14px | 600 | Only for compact telemetry chrome |
| Data large | Data | 24 / 30px | 600 | Primary metric value |
| Data standard | Data | 14 / 20px | 500 | Tables, tickers, compact values |

Body copy should stay at 16px outside dense data modules. Use `font-variant-numeric: tabular-nums` on all numerical columns. Use uppercase sparingly, with letter spacing only for labels. Never letter-space sentence case body copy.

## Spacing and geometry

Use a 4px base scale. Preferred values are 4, 8, 12, 16, 24, 32, 40, and 48px. A value outside this set requires a layout reason.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

Geometry is technical and quiet:

- 2px for micro controls and status marks.
- 4px for panels, tables, and module containers.
- 8px only for large grouped surfaces where the extra softness helps scanning.
- Avoid universal pill shapes. Reserve full rounding for tags, status chips, and compact filters.
- Keep nested radius smaller than the parent radius.
- Use a consistent content grid with responsive breakpoints at 375, 768, 1024, and 1440px.
- Keep touch targets at least 44px, including icon buttons.

## Surfaces and elevation

The page should read as a hierarchy of workspace, modules, and controls. Cards earn their existence when they contain a distinct interaction or a self-contained data unit.

1. Page canvas: `--surface-page`.
2. Primary workspace: `--surface-panel`.
3. Raised module or active region: `--surface-raised`.
4. Inset control area or data well: `--surface-inset`.

Use one border token per theme for standard dividers. Use a stronger border only for active focus, selected navigation, or a critical state. Shadows must be short, soft, and sparse.

## Theme interaction model

Light Mode is the default theme. Dark Mode is the low-light alternative. System Mode follows the operating system preference and updates when that preference changes. The same layout remains recognizable across all three choices. Preserve navigation placement, status wording, density, component sizes, and focus behavior.

- Theme selector labels must say `LIGHT`, `DARK`, and `SYSTEM`.
- Store the preference as `light`, `dark`, or `system`. Migrate the legacy `lively` value to `light`.
- The active theme needs a visible state and an accessible label.
- Theme transitions may animate color and opacity over 150–250ms. Respect `prefers-reduced-motion`.
- Hover, focus, pressed, disabled, loading, empty, error, and unavailable states must exist in both themes.
- Never make a chart or metric unreadable while the theme transition is running.

## Data terminal components

### MetricCard

Show metric name, current value, unit, as-of date, source, freshness, trend direction, and a compact history view. The current value gets the strongest typographic emphasis. Source and freshness stay visible without opening a drawer.

### DataHealthBanner

Use the shared status contract. State what is delayed, the last known timestamp, the source, and the next action. `Unavailable` is an honest state, not a placeholder number.

### FreshnessChip and DataProvenanceBadge

Keep both compact and consistent across pages. A chip communicates state. A provenance badge communicates source. They must not compete with the metric value.

### Navigation

Use one persistent sidebar on desktop and one predictable compact navigation pattern on mobile. The current location needs a visible active treatment using accent, weight, and an indicator. Search and keyboard navigation stay discoverable.

## Motion

Motion explains state or spatial continuity. Use 150–250ms for micro-interactions and up to 400ms for route or module transitions. Animate transform and opacity. Avoid `transition: all`, layout reflow, decorative looping motion, and motion that delays access to data.

## Agent implementation contract

Before adding or changing UI:

1. Read this file and use the semantic tokens above.
2. Reuse an existing component before creating a new visual pattern.
3. Choose the correct theme token. Do not paste a raw hex value into a component.
4. Verify text and UI contrast in Light Mode, Dark Mode, and System Mode while testing both system preferences.
5. Check 375px, 768px, 1024px, and 1440px layouts.
6. Check keyboard focus, reduced motion, loading, empty, error, and unavailable states.
7. Preserve data provenance and freshness wherever a metric appears.

## Avoid

- Mixed font families across pages or headings that silently fall back to another family.
- Dark panels over a light page without a deliberate theme state.
- Low-contrast gray copy, especially on ivory or dark inset surfaces.
- Raw hex values in JSX, TSX, or component-level CSS.
- Decorative gradient backgrounds, purple SaaS styling, emoji as structural icons, or uniform card mosaics.
- Status conveyed through color alone.
- Fabricated numbers used to make a loading or unavailable state look complete.
- Marketing hero language inside the terminal workspace.
