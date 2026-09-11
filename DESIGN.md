---
name: GraphiQuestor Institutional Terminal
version: "1.0"
colors:
  surface: '#050810'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8c909f'
  outline-variant: '#424754'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  error: '#ffb4ab'
  background: '#050810'
  on-background: '#d4e4fa'
  education-accent: '#38bdf8'
  education-bg: 'rgba(56, 189, 248, 0.08)'
  education-border: 'rgba(56, 189, 248, 0.25)'
  telemetry-accent: '#10b981'
  telemetry-border: 'rgba(16, 185, 129, 0.25)'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
  data-tabular-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.02em
  data-tabular-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0em
rounded:
  sm: 2px
  md: 4px
  lg: 8px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

## Overview
GraphiQuestor is an institutional macro intelligence terminal engineered for tier-one allocators, central bank watchers, and quantitative strategists. The interface prioritizes raw telemetry density, absolute data credibility, and unobtrusive educational intelligence.

## Colors
The color palette utilizes deep obsidian voids to eliminate monitor glare during long trading sessions, accented with luminous spectral indicators that communicate systemic liquidity state.

- **Foundational Void (`#050810`)**: Deep slate-black canvas base layer.
- **Glass Panel Surface (`#0b0f19`)**: Translucent container with 80% alpha and backdrop blur.
- **Telemetry Accents**: Electric blue (`#38bdf8`) for liquidity vectors, emerald green (`#10b981`) for expansion/normalcy, amber (`#f59e0b`) for warning, and crimson (`#f43f5e`) for systemic stress.

## Typography
Three typefaces define the visual architecture:
- **Space Grotesk**: Section headings, desk titles, and module headers.
- **Inter**: Explanatory briefs, analytical commentary, and concept definitions.
- **JetBrains Mono**: Real-time numerical coordinates, data tables, and telemetry tickers with monospaced tabular numerals.

## Layout
A high-density 12-to-24 column fluid grid with 4px to 8px micro-gutters. Screen space is preserved for charts and tabular telemetry. Educational aids are progressively disclosed via inline drawers and compact micro-pills rather than bulky persistent banners.

## Elevation & Depth
Depth is created through optical glass layers:
- **Tier 0**: Canvas background void (`#050810`).
- **Tier 1**: Dark glass panel (`rgba(11, 15, 25, 0.8)`) with 1px hairline border (`#1e293b`).
- **Tier 2**: Nested drawers and disclosure views with subtle translucent tinting.

## Shapes
Industrial sharp/soft technical geometry:
- 4px (`rounded-md`) corners for panels, cards, and modal drawers.
- 2px (`rounded-sm`) corners for badges, micro-buttons, and segmented toggles.
- Zero pill-shaped buttons on desktop to avoid consumer-app aesthetic drift.

## Components

### MetricCard
Primary intelligence module. Displays the metric name, tabular readout, trend delta, sparkline, and a unified bottom disclosure bar:
`[ 💡 Concept & Impact | 🛠 Telemetry & Diagnostics ▾ ]`.

### DeskConceptPill
A compact, 1-line collapsible trigger beneath desk titles (`💡 What this desk tracks (30-sec brief) ▾`) that expands into a 3-column micro-guide on click.

### JargonTooltip
A subtle inline span with dotted hairline underline (`border-b border-dotted border-white/20`) that presents an instant 1-sentence plain-English definition on hover.

## Do's and Don'ts
- **DO** keep primary telemetry prominent, monospaced, and institutionally precise.
- **DO** provide plain-English analogies and Main Street economic impact inside disclosure drawers.
- **DON'T** place large, permanently visible educational banners at the top of trading desks.
- **DON'T** use modal takeovers, wizards, or gamification widgets.
