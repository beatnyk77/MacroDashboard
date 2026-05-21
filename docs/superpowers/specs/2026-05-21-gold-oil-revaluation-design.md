# Sovereign Energy Pricing & Gold vs Oil Revaluation Stress Scenario Design Spec

## Goal & Background Context
To design and build a new interactive analytical module—**Sovereign Energy Pricing & Gold vs Oil Revaluation Stress Scenario**—inside the **De-Dollarization & Gold Lab** of the GraphiQuestor platform. 

This module explores the macroeconomic thesis of a radical monetary reset where physical gold is significantly revalued against energy (oil), reaching levels like 500 or 1,000 barrels per ounce. It provides macro researchers, chief investment officers, and portfolio managers with high-fidelity historical context, interactive pricing sandboxes, dynamic cross-valuation tools, and structured implications matrix analysis.

---

## Architectural & Interface Layout

```
+----------------------------------------------------------------------------------+
|               SOVEREIGN ENERGY PRICING & GOLD/OIL REVALUATION (LAB)             |
|                                                                                  |
|  [ Historical Ratio Chart ] (Toggle Log/Linear Y-Axis)                           |
|  * Displays historical gold priced in barrels of oil (1970 - Present)            |
|  * Dotted scenario lines at 500x and 1,000x                                      |
|  * Interactive marker overlays showing user's current simulated ratio state      |
|                                                                                  |
|  [ Interactive Calibration Console ]                                             |
|  * Gold Price Slider: $1,000 - $25,000/oz      * Oil Price Slider: $20 - $250/bbl|
|  * Live Calculated Ratio Display: "XX.X Barrels / Oz"                            |
|                                                                                  |
|  [ Implied Reset Cross-Valuation Matrix ]                                        |
|  * 500x Scenario: Implied Gold Price & Implied Oil Price                         |
|  * 1000x Scenario: Implied Gold Price & Implied Oil Price                        |
|                                                                                  |
|  [ Scenario & Strategic Implications Matrix ]                                    |
|  * Three tabs: Base Case | Hard Money Reset | Continued Fiat Dominance           |
|  * Winner & Losers table grid detailing macro shifts by sector                   |
+----------------------------------------------------------------------------------+
```

---

## Technical Component Details

### 1. Data Ingest & Hook (`useGoldOilPrices`)
We will create a custom query that retrieves current physical prices from the database:
*   **Source Table:** `metric_observations`
*   **Target Metrics:** `GOLD_PRICE_USD` (fallback: $2,400) and `OIL_BRENT_PRICE_USD` (fallback: $80).
*   **Historical Timeline Data:** Compiled within the component as a high-fidelity series from 1970 to 2026 reflecting:
    *   *1973 (OPEC embargo):* Ratio ~6 (OPEC energy leverage peak).
    *   *1980 (Volcker gold squeeze):* Ratio ~25.
    *   *1999 (Gold bottom / Brown's bottom):* Ratio ~10.
    *   *2008 (Financial crisis):* Ratio ~16.
    *   *2020 (Covid negative oil pricing):* Spikes temporarily to ~90.
    *   *2024–2026 (Present stabilization):* Anchors at ~28-30.

### 2. Frontend React Section Component (`GoldOilRevaluationScenario`)
*   **Path:** `src/features/dashboard/components/sections/GoldOilRevaluationScenario.tsx`
*   **Key Interfaces:**
    *   **Y-Axis Toggler:** Selects between `Logarithmic (5x to 1200x)` to view scenario ranges without squashing history, or `Linear (0x to 50x)` for historical normalization.
    *   **Dual Sliders:** Smooth HSL-styled HTML/Radix sliders for adjusting Gold and Oil prices.
    *   **Implied Reset Valuation Cards:** Grid of high-contrast cards that compute and display:
        $$\text{Implied Gold} = \text{Oil Price} \times \text{Scenario Ratio}$$
        $$\text{Implied Oil} = \frac{\text{Gold Price}}{\text{Scenario Ratio}}$$
    *   **Scenario Framework Tabs:** Segmented layout summarizing Base Case, Hard Money Reset, and Continued Fiat Dominance.
    *   **Implications Table:** Responsive, high-contrast matrix showing winners/losers and their strategic justifications under gold-for-energy pricing.

### 3. Landing Page Teaser Badge
*   **Path:** `src/pages/MacroObservatory.tsx`
*   **Location:** Underneath the description inside the **De-Dollarization & Gold** card.
*   **Element:** Renders a clean amber-pulsing badge:
    ```tsx
    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black tracking-uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Active Stress Scenario: Gold vs Oil Reset
    </div>
    ```
    Clicking the card smoothly navigates the user directly to the new section.

---

## Resiliency & Edge Cases
1.  **Extreme Values Handling:** If a user inputs extremely high/low values on the sliders, calculations are bounded to prevent division-by-zero errors.
2.  **Chart Overextension:** The Recharts area plot cleanly transitions between logarithmic scaling and linear scaling to handle the vertical difference between historical levels (10-30x) and scenario levels (500x and 1000x) without rendering issues.
3.  **Loading & Database Offline Fallbacks:** If Supabase fails to retrieve the latest live observations, the custom hook immediately uses default fallback values of `$2,400/oz` for Gold and `$80/bbl` for Brent Oil, logging a warning message to standard telemetry logs without breaking the UI.

---

## Verification Plan

### Automated Verification
*   Execute `npm run lint` and `npm run build` locally to confirm all imports, typings, and styled tags compile cleanly with zero production warnings or failures.

### Manual Verification
*   Check the interactive slider responsiveness in modern desktop and mobile viewports.
*   Verify that logarithmic scale toggle behaves correctly and adjusts the reference lines at 500x and 1000x relative to the historical line.
*   Confirm that clicking the teaser badge on the Observatory landing page successfully routes and focus-scrolls the user to the revaluation panel.
