# GraphiQuestor iOS Native Terminal — Architecture & App Store #1 Ranking Design Spec

**Date**: 2026-09-12  
**Status**: Approved  
**Target Platform**: iOS 17+ / iOS 18+ (iPhone, iPad, StandBy Mode)  
**Technology Stack**: Swift 6, SwiftUI, SwiftData, Swift Charts (Metal), WidgetKit, ActivityKit, AppIntents, AVFoundation, Supabase Edge BFF, Apple Push Notification service (APNs)

---

## 1. Executive Summary & Objectives

GraphiQuestor is an institutional-grade macro intelligence terminal engineered for professional capital allocators, hedge fund managers, and sovereign risk analysts.

This specification establishes the architecture, UI/UX systems (validated via Stitch MCP), and go-to-market mechanics for the **GraphiQuestor Native iOS Terminal**, engineered to:
1. Deliver a fluid, 120Hz ProMotion native mobile experience faithful to the institutional dark obsidian aesthetic defined in `DESIGN.md`.
2. Provide **sub-200ms cold startup** and complete offline capability via a local SwiftData store housed in a shared App Group container.
3. Maximize user retention and daily habit formation through **Interactive WidgetKit (Home/Lock Screen + StandBy Mode)**, **ActivityKit (Dynamic Island & Live Activities)** for FOMC/regime shifts, and a background **Audio Briefing Player**.
4. Capture and defend the **#1 ranking** in the Apple App Store (Finance / Institutional category) by achieving 99th percentile Core Technology scores and deploying high-converting screenshot storyboards created via Stitch MCP.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   GraphiQuestor iOS Terminal (Swift 6)                   │
├──────────────────────────────────────────────────────────────────────────┤
│  Presentation Layer (SwiftUI + Metal Acceleration)                       │
│  • MainTerminalView (Obsidian Canvas, Ticker Ribbon, Hero Arc, HUD)       │
│  • DesksMatrixView (Rates, Sovereign, FX, Central Banks, Energy)         │
│  • EdgarStressView (Zombie Scanner, 8-K Alerts, Maturity Wall Matrix)    │
│  • FloatingCommandHUD (Spotlight Search, Audio Digest, Quick Toggles)    │
├──────────────────────────────────────────────────────────────────────────┤
│  State & ViewModel Layer (@Observable Modern Concurrency)                │
│  • TerminalViewModel (AsyncStreams, Net Liquidity deltas, refresh loops) │
│  • EdgarScannerViewModel (Filing filters, distress ratios, ticker search)│
│  • AudioDigestPlayer (AVFoundation background audio + lock screen scrub) │
├──────────────────────────────────────────────────────────────────────────┤
│  Apple Platform Extensions Layer (Shared App Group: group.graphiquestor) │
│  • WidgetKit Extension (Home/Lock Screen + StandBy Mode Desk Display)    │
│  • ActivityKit Extension (Dynamic Island & Lock Screen Live Activities)  │
│  • AppIntents Extension (Siri Shortcuts & iOS 18 Control Center Toggles) │
├──────────────────────────────────────────────────────────────────────────┤
│  Persistence & Offline Cache (SwiftData / App Group Container)           │
│  • Schema: MetricObservationEntity, MacroRegimeEntity, EdgarCompanyEntity│
│  • Zero-overhead local read: Instant launch with cached snapshot         │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                    (HTTP/2 GET /mobile-bootstrap)
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Cloudflare / Supabase Edge CDN Cache                      │
│             (Cache-Control: public, s-maxage=300, max-age=60)            │
├──────────────────────────────────────────────────────────────────────────┤
│ • 18KB gzip snapshot consolidating:                                      │
│   - Global Liquidity Regime Score (0–100) & Fed Net Liquidity Delta      │
│   - Real-time ticker rates (SOFR, TGA, ON RRP, DXY, US10Y, FRA-OIS)      │
│   - Active EDGAR distress alerts & top zombie refinancing cliffs         │
│   - Weekly audio digest metadata & CDN stream URL                        │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│            Supabase Postgres (vw_latest_metrics + pg_cron)               │
│               + Apple Push Notification service (APNs)                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Key Architectural Decisions
* **Dual-Platform Unified BFF**: The iOS client shares the existing `/mobile-bootstrap` Supabase Edge Function created for the Android app. A single compressed GET request hydrates the entire terminal state in ~18KB.
* **Shared App Group Container (`group.com.graphiquestor.terminal`)**: The main application, WidgetKit extension, and ActivityKit extension read from a unified SwiftData store, avoiding redundant background network fetches and eliminating battery drain.
* **Zero-Lag Startup**: On app launch, SwiftUI immediately queries the local SwiftData container. The screen paints in `<200ms`, while a background task syncs against the edge CDN snapshot.

---

## 3. UI/UX Design System (Validated via Stitch MCP)

The user interface follows the dark obsidian terminal tokens established in `DESIGN.md` and Stitch MCP project `17492408711497844352` (`Obsidian Telemetry`):

### 3.1 Color Palette & Visual Tokens
* **Foundational Obsidian Void**: `Color(hex: 0x050810)` — Base canvas layer preventing OLED battery drain and monitor glare.
* **Glass Panel Surface**: `Color(hex: 0x0B0F19)` with `1pt` hairline structural border `Color(hex: 0x1E293B)` and `4pt` corner radii (`.clipShape(RoundedRectangle(cornerRadius: 4))`).
* **Telemetry Spectral Accents**:
  * **Electric Cyan Vector**: `Color(hex: 0x38BDF8)` / `Color(hex: 0x06B6D4)` — Systemic liquidity vectors and active interactive states.
  * **Emerald Normalcy**: `Color(hex: 0x10B981)` — Net reserve expansion, dovish shifts, and fresh data health tags.
  * **Rose Distress**: `Color(hex: 0xF43F5E)` — Hawkish surprises, covenant breaches, Altman Z-Score distress, and TGA drains.
  * **Amber Warning**: `Color(hex: 0xF59E0B)` — Policy divergences, pending central bank operations, and threshold alerts.

### 3.2 Typography Tokens
* **Space Grotesk**: Section headings, desk titles, and module headers (`font(.custom("SpaceGrotesk-SemiBold", size: 16))`).
* **Inter**: Narrative briefs, 8-K filing commentary, and educational tooltips (`font(.custom("Inter-Regular", size: 12))`).
* **JetBrains Mono**: Numerical coordinates, SOFR spreads, deltas, and tables. All numerals strictly enforce **tabular lining figures** (`.monospacedDigit()`) to eliminate row jitter during live streaming updates.

### 3.3 Core SwiftUI Components

#### `MacroTickerRibbon` (Top Ribbon)
* Horizontally scrolling ticker pinned below the iOS status bar.
* Displays: `SOFR: 5.31% [FLAT]`, `TGA: $812B [+$38B]`, `ON RRP: $284B [-$14B]`, `DXY: 103.8 [-0.42%]`, `US10Y: 4.28%`, `FRA-OIS: 14.2 bps`.
* Enforces `JetBrains Mono` with directional delta badges.

#### `HeroRegimeGaugeCard` (Central Engine)
* Glassmorphic container with custom Metal-accelerated Canvas circular arc gauge.
* Primary readout: Composite Regime Score (e.g. `74/100 ACCOMMODATIVE`) with pulsing emerald beacon.
* Net Liquidity delta readout (`+$42.8B WoW`).
* 3-column micro-metrics grid: `TGA DRAIN: +$38.4B` | `RRP BUFFER: $284.1B` | `FX SWAP BASIS: -12.4 bps`.

#### `EdgarZombieDistressCard` (Credit & Equity Desk)
* High-density distress card displaying:
  * Company Name & Ticker (e.g. `TCLG - Tri-Continental Logistics`).
  * Stress Flags: Form 8-K Item 2.04 Triggered · Interest Coverage Ratio `< 1.0` · Altman Z-Score `1.12`.
  * Debt Maturity Wall: `$650M due Q1 2025 at SOFR+480bps`.
  * 1-tap deep link to raw SEC EDGAR 10-K/10-Q filing text.

#### `FloatingCommandHUD` (Option C: Pro Command Matrix HUD)
* Pinned floating dock with high-blur frosted glass (`ultraThinMaterial`), `1px` translucent border, and subtle drop shadow.
* **Spotlight Query / ⌘K Trigger**: Instant modal search across all 100+ macro metrics, central banks, and SEC tickers.
* **Mini Audio Briefing Player**: Embedded play/pause trigger with interactive audio waveform visualization.
* **Zombie Distress Filter Toggle**: Skull icon badge showing active high-yield issuers in distress.
* **Desk Switcher**: Quick popover drawer to jump directly between Rates, FX, Energy, China, and Sovereign desks.

---

## 4. Apple Ecosystem Integrations (The Power-Suite)

### 4.1 Interactive WidgetKit (Home Screen, Lock Screen, & StandBy)
* **System Small (`RegimeSmallWidget`)**: High-contrast circular gauge with the Global Regime Score (`74/100`), status (`ACCOMMODATIVE`), and weekly net delta (`+$42.8B`).
* **System Medium (`MacroTapeMediumWidget`)**: Regime score on the left + 4 real-time coordinates on the right (`SOFR: 5.31%`, `TGA: $812B`, `RRP: $284B`, `DXY: 103.8`) with interactive toggle buttons to flip between Rates and FX tapes.
* **System Large (`DeskMatrixLargeWidget`)**: Complete macro telemetry matrix with 30-day mini sparklines, regime status, and the most recent SEC EDGAR 8-K covenant breach alert.
* **Lock Screen Complications**: Circular widget with regime gauge score; rectangular widget displaying 24h Net Liquidity delta.
* **StandBy Mode Support**: When the iPhone is charging horizontally on a MagSafe stand, GraphiQuestor automatically renders a full-screen ambient Macro Terminal with soft red/amber low-luminance night mode.

### 4.2 ActivityKit & Dynamic Island (Live Activities)
* **Target Scenarios**: FOMC interest rate decisions, Fed Chair press conferences, emergency central bank liquidity facility auctions, and systemic regime flip events.
* **Dynamic Island Compact**:
  * Leading: Neon cyan liquidity pulse beacon (`⚡`).
  * Trailing: Net Liquidity WoW delta (`+$42.8B`).
* **Dynamic Island Expanded**: Complete Live Activity HUD with live rate cut probability, SOFR spread to EFFR, and instant audio briefing toggle.
* **Lock Screen Live Activity**: High-density progress card tracking central bank liquidity injections with real-time push updates via APNs background activity tokens.

### 4.3 App Intents & Siri Shortcuts (iOS 18)
* **`GetMacroRegimeIntent`**: Voice command *"Hey Siri, what is today's liquidity regime?"* returns spoken and visual response with score, net liquidity, and primary stress vectors.
* **`ScanZombieDistressIntent`**: *"Hey Siri, check corporate debt stress"* returns the latest count of Russell 2000 issuers with interest coverage `< 1.0`.
* **iOS 18 Control Center Module**: Custom Control Center button enabling capital allocators to start the morning audio briefing or trigger the quick-search palette from anywhere in the OS.

### 4.4 Rich Actionable APNs Push Notifications
* Uses a custom **Notification Content Extension** (`UNNotificationContentExtension`).
* When an alert fires (e.g., *"SOFR-EFFR Spread Exceeds Warning Threshold"* or *"TGA Runoff Drains $40B"*), expanding the notification reveals an interactive **Swift Chart** and an immediate *"View Desk"* deep-link button directly on the Lock Screen.

---

## 5. App Store #1 Ranking & Conversion Strategy (ASO & Editorial)

### 5.1 App Store Metadata & Keyword Optimization
* **App Name (30 chars)**: `GraphiQuestor: Macro Terminal`
* **Subtitle (30 chars)**: `Global Liquidity & Fed Tracker`
* **Primary Category**: Finance | **Secondary Category**: Business
* **Keyword Field (100 chars, comma-delimited, zero spaces wasted)**:
  `macro,terminal,liquidity,fed,rates,sofr,treasury,edgar,zombie firms,sovereign debt,fomc,yield curve,central bank`
* **Localization**: Localize keywords in UK, Switzerland, Singapore, Japan, Germany, and India to capture global institutional search volume.

### 5.2 High-Converting App Store Storyboard (Stitch MCP Generated)
Designed for 6.7" (iPhone 16 Pro Max) and 6.5" displays:
1. **Screen 1 (Hero Hook)**: **GLOBAL LIQUIDITY REGIME** — *Real-time telemetry before market open.* (Hero Arc Gauge, Net Liquidity delta).
2. **Screen 2 (Macro Desks)**: **INSTITUTIONAL MACRO DESKS** — *Rates, FX, Central Banks, & Energy.* (Desks Matrix, SOFR/TGA/RRP tape).
3. **Screen 3 (Unique Alpha)**: **SEC EDGAR ZOMBIE SCANNER** — *Uncover debt maturity walls & distress.* (Russell 2000 distress ratio, Form 8-K alerts).
4. **Screen 4 (Platform Power)**: **INTERACTIVE WIDGETS & STANDBY** — *Live macro pulse on your home screen & desk.* (MagSafe StandBy mode demo).
5. **Screen 5 (Urgency)**: **DYNAMIC ISLAND & LIVE ACTIVITIES** — *Real-time regime breaks & FOMC alerts.* (Dynamic Island expanded HUD).

* **App Icon**: Dark obsidian titanium emblem with a razor-thin cyan vector chevron (`#38BDF8`) and an emerald status pip (`#10B981`), supporting iOS 18 Dark Mode & Tinted App Icons.

### 5.3 Apple Editorial Feature Submission ("App of the Day" Playbook)
* Submit the build via the **App Store Feature Request Portal** 4 weeks prior to public launch.
* Highlight pure SwiftUI & SwiftData architecture, StandBy Mode, ActivityKit Dynamic Island, and iOS 18 Control Center integration.
* Zero paywall friction on cold start: generous free institutional telemetry tier ensuring top user retention and App Store review goodwill.

### 5.4 Organic Rating Velocity & Retention
* **Smart Review Triggers (`SKStoreReviewController`)**: Prompt for ratings only after high-delight moments (exporting an institutional PDF memo, completing 3rd audio digest, or after a custom threshold alert triggers).
* **Universal Links (`graphiquestor.com/stream`)**: Direct deep linking from web reports and research digests directly into the native app.

---

## 6. Error Handling, Performance Budgets, & Offline Resilience

* **Cold Startup Budget**: `<200ms` from tap to interactive render.
* **Scroll Frame Rate**: Steady `120fps` on ProMotion displays with zero dropped frames.
* **Offline Fallback**: Seamless degradation to the last cached SwiftData snapshot with clear `DataHealthBanner` indicating observation age (`fresh` / `lagged` / `very_lagged`).
* **Network Retry & Exponential Backoff**: Exponential jittered retry on CDN connection failure (max 3 retries, capped at 30s).

---

## 7. Testing Strategy

* **Unit Testing (`XCTest`)**: Validation of `RegimeAnalysisEngine`, Net Liquidity calculation logic, and EDGAR distress parsing.
* **UI & Snapshot Testing**: `ViewInspector` / Snapshot testing across iPhone 16 Pro Max, iPhone SE (3rd Gen), and iPad Pro 13".
* **Performance Profiling (`Instruments`)**: Time Profiler ensuring 0ms main-thread stalls, Core Animation profiling ensuring 120Hz ProMotion compliance, and Leaks instrument ensuring 0 memory leaks.
