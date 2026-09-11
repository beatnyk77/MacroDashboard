# GraphiQuestor Native Android Application — Architecture & Play Store #1 Ranking Design Spec

**Date**: 2026-09-12  
**Status**: Approved  
**Target Platform**: Android 12+ (API 31+)  
**Technology Stack**: Kotlin 2.0+, Jetpack Compose, Material 3, Room SQLite, Ktor, Jetpack Glance, Supabase, Firebase Cloud Messaging (FCM)  

---

## 1. Executive Summary & Objectives

GraphiQuestor is an institutional-grade macro intelligence terminal engineered for professional capital allocators, hedge fund managers, and sovereign risk analysts. 

This design specifies the creation of the **GraphiQuestor Native Android App**, engineered to:
1. Deliver a fluid, 120Hz native mobile experience faithful to the institutional dark obsidian aesthetic defined in `DESIGN.md`.
2. Provide **sub-400ms instant startup** and true offline capability via a local Room SQLite cache coupled with an edge-cached BFF (Backend-For-Frontend).
3. Maximize user retention and daily habit formation through native **Android Glance Home Screen Widgets** and **FCM Regime Break Alerts**.
4. Capture and defend the **#1 ranking** in the Google Play Store (Finance / Macro Intelligence category) by scoring in the 99th percentile of Android Vitals and deploying optimized ASO conversion assets generated via Stitch MCP.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   GraphiQuestor Native Android App                       │
├────────────────────────────────┬─────────────────────────────────────────┤
│  Presentation Layer (Compose)  │ • StreamScreen (Hero Regime + Live Feed) │
│                                │ • DesksScreen (Macro Matrix Grid)       │
│                                │ • AlertsScreen (Custom Threshold Rules) │
│                                │ • WatchlistScreen (Pinned Telemetry)    │
│                                │ • GlanceWidgetReceiver (Home Screen)    │
├────────────────────────────────┼─────────────────────────────────────────┤
│  State & ViewModel (MVI)       │ • TelemetryViewModel (StateFlow)        │
│                                │ • AlertsViewModel                       │
│                                │ • WatchlistViewModel                    │
├────────────────────────────────┼─────────────────────────────────────────┤
│  Domain Layer                  │ • TelemetryRepository                   │
│                                │ • AlertsRepository                      │
│                                │ • RegimeAnalysisEngine                  │
├────────────────────────────────┼─────────────────────────────────────────┤
│  Data Layer (Offline-First)    │ • Room Database (Local SQLite Cache)    │
│                                │ • Ktor Client (Edge CDN Snapshot Sync)  │
│                                │ • Android WorkManager (30m sync daemon) │
│                                │ • Firebase Messaging (FCM Push Service) │
└────────────────────────────────┴─────────────────────────────────────────┘
                                       │
                        (Single GET /mobile-bootstrap)
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Cloudflare / Supabase Edge CDN Cache                      │
│             (HTTP Cache-Control: max-age=60, s-maxage=300)               │
└──────────────────────────────────────────────────────────────────────────┘
                                       │ (Cache miss: 1 req / 5 mins)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│          Supabase Edge Function: /functions/v1/mobile-bootstrap          │
├──────────────────────────────────────────────────────────────────────────┤
│ • Consolidates Global Liquidity Regime Score (0–100)                     │
│ • Aggregates Top Macro Vectors (Fed Net Liq, ON RRP, China Impulse, 10Y) │
│ • Packages User Watchlists & Active Alert Thresholds                     │
│ • Compresses payload (~18KB gzip)                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│            Supabase Postgres (vw_latest_metrics + pg_cron)               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI/UX Design System (Mapped from `DESIGN.md` via Stitch MCP)

All Android UI components are implemented in **Jetpack Compose** strictly adhering to the design tokens established in `DESIGN.md`.

### 3.1 Color Palette & Tokens
* **Foundational Obsidian Void**: `Color(0xFF050810)` — Base canvas layer preventing OLED battery drain and monitor glare.
* **Glass Panel Surface**: `Color(0xFF0B0F19)` with 1px border `Color(0xFF1E293B)` and `4.dp` rounded corners (`rounded-md`).
* **Telemetry Spectral Accents**:
  * **Electric Cyan Vector**: `Color(0xFF38BDF8)` — Systemic liquidity expansion.
  * **Emerald Normalcy**: `Color(0xFF10B981)` — Expansionary momentum & data fresh badges.
  * **Rose Stress**: `Color(0xFFF43F5E)` — Contraction, lagging momentum, and systemic credit drag.
  * **Amber Warning**: `Color(0xFFF59E0B)` — Approaching alert thresholds and facility drawdowns.

### 3.2 Typography Tokens
* **Headers & Desk Titles**: `Space Grotesk` (`FontWeight.SemiBold`, `letterSpacing = -0.01.em`).
* **Tabular Numbers & Real-Time Coordinates**: `JetBrains Mono` (`FontWeight.Bold`, monospaced tabular numerals eliminating text wobble during live updates).
* **Explanatory Commentary & Educational Tooltips**: `Inter` (`FontWeight.Normal`, line-height 1.4).

### 3.3 Core Mobile Components

#### `MobileRegimeCard` (Hero Dashboard Module)
* Displays systemic regime status (e.g. `NEUTRAL-ACCOMMODATIVE (74/100)`).
* Custom hardware-accelerated Canvas circular gauge arc (`strokeWidth = 6.dp`) with smooth spring animation on value updates.
* Net liquidity delta readout (`+$42.8B (+0.71%) WoW`).
* 3-column micro-metrics grid: `TGA DRAIN: $812B` | `RRP BUFFER: $284B` | `FX SWAP BASIS: 0.12 (NORM)`.

#### `MobileMetricCard`
* Top row: Metric name (`Space Grotesk 12sp`) + Data Provenance Freshness Chip (`FRESH • H.4.1`, green pill).
* Value row: Monospaced tabular numeral (`JetBrains Mono 22sp`) + 24h delta indicator.
* Embedded native Compose sparkline (`Vico` or hardware Canvas path) with semi-transparent vertical gradient fill.
* Bottom progressive disclosure bar: `[ 💡 Concept & Impact | 🛠 Telemetry & Diagnostics ▾ ]`. Tapping expands an inline collapsible drawer with plain-English hedge fund analogies.

#### `GlanceHomeWidget` (Android Launcher Real Estate)
* Native Android Glance 4x2 and 2x2 widget.
* Surfaces live Global Liquidity composite gauge, net weekly delta, and top 3 central bank coordinates.
* Updates periodically via `WorkManager` (battery-constrained) or push triggers, driving constant user re-engagement.

#### Bottom Navigation Bar
* Docked 4-destination bar:
  1. `Stream` (Live feed & hero regime gauge)
  2. `Desks` (Category drilldown: Liquidity, Sovereign Debt, Energy, China/India, FX Invoicing)
  3. `Alerts` (Threshold rules & regime break triggers with unread badge count)
  4. `Watchlist` (Custom user-pinned telemetry cards)

---

## 4. Data Layer & Efficiency Architecture

To ensure zero unnecessary server costs and optimal device battery health:

### 4.1 Local Room SQLite Database
```kotlin
@Entity(tableName = "metrics")
data class MetricEntity(
    @PrimaryKey val id: String,
    val name: String,
    val currentValue: Double,
    val formattedValue: String,
    val unit: String,
    val delta24h: Double?,
    val deltaFormatted: String?,
    val stalenessFlag: String, // 'fresh', 'lagged', 'very_lagged'
    val lastUpdated: Long,
    val deskCategory: String
)

@Entity(tableName = "observations")
data class ObservationEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0,
    val metricId: String,
    val observationDate: Long,
    val value: Double
)

@Entity(tableName = "alert_rules")
data class AlertRuleEntity(
    @PrimaryKey val id: String,
    val metricId: String,
    val condition: String, // "LESS_THAN", "GREATER_THAN", "REGIME_SHIFT"
    val thresholdValue: Double,
    val isActive: Boolean
)
```

### 4.2 Network & Edge CDN Caching Strategy
* When the app starts, ViewModel queries Room DB immediately: **Cold startup Time-To-Initial-Display (TTID) < 150ms**.
* Concurrently, `Ktor` executes `GET /functions/v1/mobile-bootstrap`:
  * If cached at Cloudflare/Supabase Edge (`s-maxage=300`), response returns in `<40ms`.
  * If cache expired, the Edge Function executes a single consolidated SQL query against `vw_latest_metrics` and returns the compressed payload.
  * Room DB executes an atomic `@Upsert`, and Compose state observers update smoothly without UI flicker.

### 4.3 Background Sync & Push Engine
* **Android WorkManager**: Configured with `ExistingPeriodicWorkPolicy.KEEP` running every 30 minutes.
  * Constraints: `NetworkType.CONNECTED`, `RequiresBatteryNotLow(true)`.
  * Refreshes the `GlanceHomeWidget` data cache.
* **FCM Push Notification Engine**:
  * No device polling.
  * Existing Supabase ingestion pipelines (`ingest-fred`, `ingest-rbi`, `ingest-eia`) evaluate alert rules server-side.
  * Upon threshold breach (e.g. Reverse Repo draining below $200B), backend issues an FCM high-priority message.
  * Phone receives payload and presents an institutional regime-shift notification with haptic feedback.

---

## 5. Google Play #1 Ranking Strategy (ASO & Android Vitals)

To capture and retain the top spot in Google Play's Finance category:

### 5.1 Android Vitals Mastery (Google Ranking Factor #1)
Google algorithmically promotes apps with stellar vitals and de-ranks apps with jank or crashes.
* **Crash Rate Target**: `< 0.02%` (far below Google's 0.47% bad behavior threshold).
* **ANR Rate Target**: `0.00%` (all disk I/O and network operations quarantined to Dispatchers.IO).
* **Cold Start Time**: `< 400ms` using **Baseline Profiles** compiled ahead of time (AOT) via R8/ProGuard.
* **Excessive Wakeups**: `0` (zero wake-lock usage; relies entirely on FCM push and battery-aware WorkManager).
* **Frame Rate**: Continuous 120Hz/60Hz hardware-accelerated Compose rendering without recomposition loops.

### 5.2 App Store Optimization (ASO)
* **Title (30 chars)**: `GraphiQuestor: Macro Terminal`
* **Short Description (80 chars)**: `Institutional macro intelligence, global liquidity telemetry & sovereign risk.`
* **Target High-Intent Keywords**:
  * *Macro Terminal*
  * *Global Liquidity Index*
  * *Central Bank Intelligence*
  * *De-Dollarization Tracker*
  * *Sovereign Debt Risk*
  * *Fed Net Liquidity*
* **Listing Visuals (Generated via Stitch MCP)**:
  1. *Global Liquidity Regime* — High-contrast dark glassmorphic gauge showing $6.14T net expansion.
  2. *Central Bank Balance Sheets* — High-density Fed, PBoC, and RBI telemetry cards with monospaced tabular readouts.
  3. *De-Dollarization & FX Invoicing* — Multi-currency trade telemetry and cross-border reserve trends.
  4. *Home Screen Glance Widget* — Showing desktop-grade macro telemetry directly on the Android launcher.
  5. *Instant Regime Alerts* — Showcasing real-time structural break notifications.

### 5.3 Review Velocity & Rating Defense
* Integration of **Google Play In-App Review API** (`com.google.android.play:review`).
* **Trigger condition**: Prompts the user organically immediately after high-satisfaction milestones (e.g., after the user creates their 2nd custom threshold alert or pins a metric to their home-screen widget).
* Never prompts on app launch or error states.
* Target rating: **4.85+ stars** to secure the top ranking badge in Google Play search results.

---

## 6. Implementation Roadmap

1. **Phase 1: Foundation & Design System**
   * Scaffold native Android module with Kotlin 2.0 and Jetpack Compose.
   * Port `DESIGN.md` tokens into `Theme.kt`, `Color.kt`, and `Type.kt`.
   * Implement core atomic components: `MetricCard`, `DeskConceptPill`, `SparklineCanvas`.
2. **Phase 2: Data Pipeline & Edge BFF**
   * Deploy `/functions/v1/mobile-bootstrap` with edge CDN cache headers.
   * Implement Room SQLite entities, DAOs, and repository layer.
   * Integrate Ktor client and offline-first cache syncing.
3. **Phase 3: Screens & Home Screen Widget**
   * Build `StreamScreen`, `DesksScreen`, `AlertsScreen`, and `WatchlistScreen`.
   * Implement Android Glance 4x2 Home Screen Widget.
4. **Phase 4: FCM Push Engine & Google Play Optimization**
   * Connect Firebase Cloud Messaging for server-triggered regime breaks.
   * Integrate Google In-App Review API.
   * Generate Play Store listing screenshots via Stitch MCP and compile AOT Baseline Profiles.
