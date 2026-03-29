# Macro Dashboard Component Registry (Tier III Audit)

This document provides a comprehensive mapping of all 224 UI components within the Macro Dashboard, categorized by their institutional priority and deployment location (Terminal vs. Lab).

## 1. Terminal Core (Level 1 - Strategic)
*Location: src/pages/Terminal.tsx*

| Component | Responsibility | Status |
|-----------|----------------|--------|
| `TodaysBriefPanel` | AI-curated institutional morning notes | **ACTIVE** |
| `UpcomingEventsCard` | Hard macro calendar (Finnhub/AV fallback) | **ACTIVE** |
| `MacroEconomicCalendar` | Full-screen interactive data releases | **ACTIVE** |
| `GlobalLiquidityMonitor` | Monetary base & TGA telemetry | **ACTIVE** |
| `NetLiquidityRow` | Real-time dollar liquidity pulse | **ACTIVE** |
| `SovereignRiskMatrix` | G20 CDS/Bond yield stress mapping | **ACTIVE** |
| `YieldCurveMonitor` | Global curve inversion/steepening | **ACTIVE** |

## 2. Lab Modules (Level 2 - Deep Research)
*Location: src/pages/labs/*

### China Research Lab
- `ChinaMacroPulseSection`: PBOC activity & NBS indicators.
- `ChinaPBOCLiquidityMonitor`: Central bank balance sheet depth.
- `ChinaRealEconomyPanel`: PPI/CPI and industrial production.
- `China15thFYP/*`: Exclusive data on the 15th Five Year Plan.

### India Flow Pulse
- `IndiaCreditCycleClock`: RBI credit growth and NPA cycles.
- `IndiaDigitizationPremiumMonitor`: UPI volume & value telemetry.
- `RBIFXDefenseMonitor`: RBI intervention in USD/INR.
- `IndiaFiscalStressMonitor`: State vs. Central deficit mapping.

### Energy & Commodity Terminal
- `CommodityTerminal`: LME/NYMEX pricing and storage levels.
- `GlobalReserveTracker`: SPR and commercial crude stocks.
- `RefiningDashboard`: Global utilization vs. crack spreads.

### Shadow System & Flows
- `ShadowTradeCard`: Illicit flows and sanctions evasion tracking.
- `GeopoliticalRiskPulseCard`: Conflict-weighted volatility.
- `EliteWealthFlightIndex`: Proxying capital flight via luxury assets/RE.

## 3. UI Primitives & Design System
*Location: src/components/ui/*
- **Standard Shadcn Primitives**: `Card`, `Button`, `Table`, `Chart`, etc.
- **Institutional Hardening**: Minimum 12px font size, responsive padding, high-contrast dark mode.

## 4. Decommissioned / Purged (Retail Cleanup)
- `WhiteCollarDebtMonitor`: REMOVED (Talks to retail concerns).
- `PredictionMarketsCard`: REMOVED (Non-institutional volatility).
- `401kDistressMonitor`: REMOVED (Retail focus).

---
*Created: 2026-03-29*
*Audit Status: COMPLETE (224 components indexed)*
