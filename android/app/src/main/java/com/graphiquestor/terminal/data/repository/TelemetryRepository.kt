package com.graphiquestor.terminal.data.repository

import com.graphiquestor.terminal.data.local.AlertRuleEntity
import com.graphiquestor.terminal.data.local.MetricDao
import com.graphiquestor.terminal.data.local.MetricEntity
import com.graphiquestor.terminal.data.local.RegimeEntity
import com.graphiquestor.terminal.data.remote.TelemetryApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

class TelemetryRepository(
    private val dao: MetricDao,
    private val api: TelemetryApi = TelemetryApi()
) {
    val allMetrics: Flow<List<MetricEntity>> = dao.getAllMetrics()
    val pinnedMetrics: Flow<List<MetricEntity>> = dao.getPinnedMetrics()
    val currentRegime: Flow<RegimeEntity?> = dao.getRegime()
    val activeAlerts: Flow<List<AlertRuleEntity>> = dao.getAllAlerts()

    fun observeMetric(id: String): Flow<MetricEntity?> = dao.observeMetricById(id)

    suspend fun refreshTelemetry(): Result<Unit> {
        return try {
            val res = api.fetchBootstrap()

            // Save Regime to Room
            val regimeEntity = RegimeEntity(
                compositeScore = res.regime.compositeScore,
                stateLabel = res.regime.stateLabel,
                netLiquidityTotalTrillions = res.regime.netLiquidityTotalTrillions,
                netLiquidityDeltaWoWBillions = res.regime.netLiquidityDeltaWoWBillions,
                netLiquidityDeltaWoWPercent = res.regime.netLiquidityDeltaWoWPercent,
                tgaDrainBillions = res.regime.subVectors.tgaDrainBillions,
                rrpAbsorptionBillions = res.regime.subVectors.rrpAbsorptionBillions,
                fxSwapBasisStress = res.regime.subVectors.fxSwapBasisStress
            )
            dao.upsertRegime(regimeEntity)

            // Save Metrics to Room
            val entities = res.metrics.map { m ->
                MetricEntity(
                    id = m.id,
                    name = m.name,
                    category = m.category,
                    currentValue = m.value,
                    formattedValue = m.formattedValue,
                    unit = m.unit,
                    delta24h = m.delta24h,
                    deltaFormatted = m.deltaFormatted,
                    stalenessFlag = m.stalenessFlag,
                    sparklineJson = m.sparkline.joinToString(","),
                    asOfDate = m.asOfDate,
                    conceptBrief = m.conceptBrief,
                    telemetryDiagnostic = m.telemetryDiagnostic
                )
            }
            dao.upsertMetrics(entities)
            Result.success(Unit)
        } catch (e: Exception) {
            seedDefaultDataIfEmpty()
            Result.failure(e)
        }
    }

    suspend fun togglePinMetric(id: String, currentPinned: Boolean) {
        dao.setPinned(id, !currentPinned)
    }

    suspend fun createAlert(rule: AlertRuleEntity) {
        dao.insertAlert(rule)
    }

    suspend fun toggleAlert(id: String, active: Boolean) {
        dao.setAlertActive(id, active)
    }

    suspend fun deleteAlert(id: String) {
        dao.deleteAlert(id)
    }

    suspend fun seedDefaultDataIfEmpty() {
        val existing = dao.getAllMetrics().firstOrNull()
        if (existing.isNullOrEmpty() || existing.size < 10) {
            dao.upsertRegime(
                RegimeEntity(
                    compositeScore = 74,
                    stateLabel = "NEUTRAL-ACCOMMODATIVE",
                    netLiquidityTotalTrillions = 6.14,
                    netLiquidityDeltaWoWBillions = 42.8,
                    netLiquidityDeltaWoWPercent = 0.71,
                    tgaDrainBillions = 812.0,
                    rrpAbsorptionBillions = 284.1,
                    fxSwapBasisStress = "LOW (0.12)"
                )
            )

            val fullCatalog = listOf(
                // 1. LIQUIDITY
                MetricEntity(
                    id = "fed_net_liquidity",
                    name = "US Fed Net Liquidity",
                    category = "liquidity",
                    currentValue = 6142.0,
                    formattedValue = "$6,142B",
                    unit = "USD Billions",
                    delta24h = 18.4,
                    deltaFormatted = "+$18.4B (+0.30%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "6080,6095,6110,6105,6125,6138,6142",
                    asOfDate = "2026-09-11",
                    conceptBrief = "WALCL minus WTREGEN minus RRPONTSYD. Primary systemic expansion vector.",
                    telemetryDiagnostic = "H.4.1 Fed Statistical Release via NY Fed."
                ),
                MetricEntity(
                    id = "reverse_repo",
                    name = "Overnight Reverse Repo (ON RRP)",
                    category = "liquidity",
                    currentValue = 284.1,
                    formattedValue = "$284.1B",
                    unit = "USD Billions",
                    delta24h = -12.3,
                    deltaFormatted = "-$12.3B (-4.15%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "340,325,312,305,298,292,284.1",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Cash park facility draining excess liquidity from US money markets.",
                    telemetryDiagnostic = "NY Fed Markets Desk Daily Operations."
                ),
                MetricEntity(
                    id = "treasury_general_account",
                    name = "Treasury General Account (TGA)",
                    category = "liquidity",
                    currentValue = 812.0,
                    formattedValue = "$812.0B",
                    unit = "USD Billions",
                    delta24h = 4.2,
                    deltaFormatted = "+$4.2B (+0.52%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "760,775,790,785,802,808,812",
                    asOfDate = "2026-09-11",
                    conceptBrief = "US Treasury operating cash balance at NY Fed. Drain injects private liquidity.",
                    telemetryDiagnostic = "Daily Treasury Statement (DTS) Table II."
                ),
                MetricEntity(
                    id = "ecb_total_assets",
                    name = "ECB Total Balance Sheet",
                    category = "liquidity",
                    currentValue = 6480.0,
                    formattedValue = "€6,480B",
                    unit = "EUR Billions",
                    delta24h = -15.2,
                    deltaFormatted = "-€15.2B (-0.23%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "6620,6580,6550,6520,6505,6495,6480",
                    asOfDate = "2026-09-11",
                    conceptBrief = "European Central Bank consolidated balance sheet during quantitative tightening.",
                    telemetryDiagnostic = "ECB Statistical Data Warehouse."
                ),
                MetricEntity(
                    id = "boj_total_assets",
                    name = "Bank of Japan Total Assets",
                    category = "liquidity",
                    currentValue = 758.2,
                    formattedValue = "¥758.2T",
                    unit = "JPY Trillions",
                    delta24h = 1.4,
                    deltaFormatted = "+¥1.4T (+0.18%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "752,753.5,755,754.2,756.8,757,758.2",
                    asOfDate = "2026-09-11",
                    conceptBrief = "BOJ balance sheet tracking JGB purchases and quantitative normalization.",
                    telemetryDiagnostic = "Bank of Japan Accounts / Statistics."
                ),

                // 2. SOVEREIGN RISK
                MetricEntity(
                    id = "us_10y_2y_spread",
                    name = "US 10Y/2Y Yield Spread",
                    category = "sovereign",
                    currentValue = 0.182,
                    formattedValue = "+18.2 bps",
                    unit = "% Spread",
                    delta24h = 0.042,
                    deltaFormatted = "+4.2 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "-0.15,-0.08,-0.02,0.05,0.10,0.14,0.182",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Key recession and curve-steepening indicator. Positive indicates disinversion.",
                    telemetryDiagnostic = "FRED (T10Y2Y) / US Treasury Constant Maturity."
                ),
                MetricEntity(
                    id = "us_10y_3m_spread",
                    name = "US 10Y/3M Yield Spread",
                    category = "sovereign",
                    currentValue = -0.72,
                    formattedValue = "-72.0 bps",
                    unit = "% Spread",
                    delta24h = 0.061,
                    deltaFormatted = "+6.1 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "-1.15,-1.02,-0.94,-0.88,-0.82,-0.78,-0.72",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Fed research preferred recession warning signal across historical credit cycles.",
                    telemetryDiagnostic = "FRED (T10Y3M) / NY Fed Capital Markets."
                ),
                MetricEntity(
                    id = "move_index",
                    name = "ICE BofA MOVE Index",
                    category = "sovereign",
                    currentValue = 98.4,
                    formattedValue = "98.4",
                    unit = "Index Points",
                    delta24h = -3.2,
                    deltaFormatted = "-3.2 (-3.15%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "115,110,108,104,101.5,100.2,98.4",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Treasury bond market implied volatility index, the fixed income VIX.",
                    telemetryDiagnostic = "ICE Data Indices / BofAML Fixed Income."
                ),
                MetricEntity(
                    id = "us_debt_to_gdp",
                    name = "US Public Debt to GDP",
                    category = "sovereign",
                    currentValue = 123.4,
                    formattedValue = "123.4%",
                    unit = "% of GDP",
                    delta24h = 0.2,
                    deltaFormatted = "+0.8% YoY",
                    stalenessFlag = "lagged",
                    sparklineJson = "118.5,119.8,121,122.2,122.9,123.2,123.4",
                    asOfDate = "2026-09-01",
                    conceptBrief = "Total US federal debt obligations measured against nominal annualized GDP.",
                    telemetryDiagnostic = "US Treasury Fiscal Service & Bureau of Economic Analysis."
                ),

                // 3. RATES & FUNDING
                MetricEntity(
                    id = "us_10y_yield",
                    name = "US 10Y Benchmark Yield",
                    category = "rates",
                    currentValue = 4.284,
                    formattedValue = "4.284%",
                    unit = "% Yield",
                    delta24h = 0.038,
                    deltaFormatted = "+3.8 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "4.15,4.18,4.22,4.20,4.24,4.27,4.284",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Global risk-free discount rate anchor for equities, credit, and sovereign assets.",
                    telemetryDiagnostic = "US Treasury Constant Maturity Yield (DGS10)."
                ),
                MetricEntity(
                    id = "us_2y_yield",
                    name = "US 2Y Treasury Yield",
                    category = "rates",
                    currentValue = 4.102,
                    formattedValue = "4.102%",
                    unit = "% Yield",
                    delta24h = -0.004,
                    deltaFormatted = "-0.4 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "4.25,4.22,4.18,4.15,4.14,4.11,4.102",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Most sensitive sovereign benchmark for upcoming 12-month FOMC rate path.",
                    telemetryDiagnostic = "US Treasury Constant Maturity Yield (DGS2)."
                ),
                MetricEntity(
                    id = "sofr_rate",
                    name = "Secured Overnight Financing Rate (SOFR)",
                    category = "rates",
                    currentValue = 5.31,
                    formattedValue = "5.31%",
                    unit = "%",
                    delta24h = 0.0,
                    deltaFormatted = "0.0 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "5.33,5.32,5.31,5.31,5.31,5.31,5.31",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Volume-weighted median of repo transactions backed by Treasury collateral.",
                    telemetryDiagnostic = "Federal Reserve Bank of New York Reference Rates."
                ),
                MetricEntity(
                    id = "commercial_paper_spread",
                    name = "3M AA Fin CP - SOFR Spread",
                    category = "rates",
                    currentValue = 14.2,
                    formattedValue = "14.2 bps",
                    unit = "Basis Points",
                    delta24h = -1.1,
                    deltaFormatted = "-1.1 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "18,17.2,16.5,15.8,15,14.8,14.2",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Institutional short-term commercial corporate funding stress barometer.",
                    telemetryDiagnostic = "Federal Reserve Board H.15 Commercial Paper."
                ),

                // 4. ENERGY SECURITY
                MetricEntity(
                    id = "brent_crude",
                    name = "Brent Crude Spot",
                    category = "energy",
                    currentValue = 78.42,
                    formattedValue = "$78.42",
                    unit = "USD / Barrel",
                    delta24h = 1.24,
                    deltaFormatted = "+$1.24 (+1.61%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "74.5,75.2,76,75.8,77.1,77.8,78.42",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Global seaborne benchmark for sweet light physical crude oil.",
                    telemetryDiagnostic = "Intercontinental Exchange (ICE) Futures."
                ),
                MetricEntity(
                    id = "wti_crude",
                    name = "WTI Crude Spot",
                    category = "energy",
                    currentValue = 74.15,
                    formattedValue = "$74.15",
                    unit = "USD / Barrel",
                    delta24h = 1.10,
                    deltaFormatted = "+$1.10 (+1.51%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "70.2,71,72.1,71.8,73,73.5,74.15",
                    asOfDate = "2026-09-11",
                    conceptBrief = "North American pipeline crude benchmark delivered at Cushing, OK.",
                    telemetryDiagnostic = "NYMEX / US Energy Information Administration."
                ),
                MetricEntity(
                    id = "spr_inventory",
                    name = "US Strategic Petroleum Reserve",
                    category = "energy",
                    currentValue = 374.8,
                    formattedValue = "374.8M bbl",
                    unit = "Million Barrels",
                    delta24h = 0.6,
                    deltaFormatted = "+0.6M bbl",
                    stalenessFlag = "fresh",
                    sparklineJson = "368,369.5,371,372.2,373.4,374.2,374.8",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Emergency crude stockpile buffer stored in salt caverns along Gulf Coast.",
                    telemetryDiagnostic = "US Department of Energy Weekly Petroleum Status."
                ),
                MetricEntity(
                    id = "crack_spread_321",
                    name = "US Gulf Coast 3:2:1 Crack Spread",
                    category = "energy",
                    currentValue = 19.45,
                    formattedValue = "$19.45/bbl",
                    unit = "USD / Barrel",
                    delta24h = 0.85,
                    deltaFormatted = "+$0.85 (+4.57%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "16.8,17.4,18,17.8,18.5,19,19.45",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Refinery margin refining 3 bbl crude into 2 bbl gasoline and 1 bbl diesel.",
                    telemetryDiagnostic = "EIA Petroleum Marketing / Gulf Coast Spot."
                ),

                // 5. CHINA MACRO & CREDIT
                MetricEntity(
                    id = "china_credit_impulse",
                    name = "China Credit Impulse (% GDP)",
                    category = "china",
                    currentValue = -2.14,
                    formattedValue = "-2.14%",
                    unit = "% of GDP",
                    delta24h = -0.40,
                    deltaFormatted = "-0.40% MoM",
                    stalenessFlag = "lagged",
                    sparklineJson = "1.2,0.4,-0.5,-1.1,-1.6,-1.9,-2.14",
                    asOfDate = "2026-09-08",
                    conceptBrief = "Change in new Total Social Financing (TSF) as % of nominal GDP.",
                    telemetryDiagnostic = "PBOC & National Bureau of Statistics China."
                ),
                MetricEntity(
                    id = "china_property_investment",
                    name = "China Property Investment YoY",
                    category = "china",
                    currentValue = -10.2,
                    formattedValue = "-10.2%",
                    unit = "% YoY",
                    delta24h = -0.6,
                    deltaFormatted = "-0.6% MoM",
                    stalenessFlag = "lagged",
                    sparklineJson = "-8.2,-8.6,-9,-9.3,-9.8,-10,-10.2",
                    asOfDate = "2026-09-01",
                    conceptBrief = "Fixed asset property development diagnosing real estate construction drag.",
                    telemetryDiagnostic = "National Bureau of Statistics China."
                ),
                MetricEntity(
                    id = "pboc_mlf_rate",
                    name = "PBOC 1Y Medium-Term Lending Facility",
                    category = "china",
                    currentValue = 2.30,
                    formattedValue = "2.30%",
                    unit = "% Rate",
                    delta24h = 0.0,
                    deltaFormatted = "0.0 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "2.5,2.5,2.45,2.4,2.35,2.3,2.3",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Policy lending liquidity rate supplied to commercial banking system by PBOC.",
                    telemetryDiagnostic = "People's Bank of China Open Market Operations."
                ),
                MetricEntity(
                    id = "usd_cnh",
                    name = "USD/CNH Offshore Spot",
                    category = "china",
                    currentValue = 7.1245,
                    formattedValue = "7.1245",
                    unit = "CNH / USD",
                    delta24h = -0.0142,
                    deltaFormatted = "-0.0142 (-0.20%)",
                    stalenessFlag = "fresh",
                    sparklineJson = "7.24,7.22,7.19,7.16,7.15,7.13,7.1245",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Offshore Chinese Yuan exchange rate pricing capital flow pressures.",
                    telemetryDiagnostic = "Hong Kong Exchanges & Global FX ECNs."
                ),

                // 6. INDIA MACRO TELEMETRY
                MetricEntity(
                    id = "rbi_fx_reserves",
                    name = "RBI Foreign Exchange Reserves",
                    category = "india",
                    currentValue = 684.2,
                    formattedValue = "$684.2B",
                    unit = "USD Billions",
                    delta24h = 2.4,
                    deltaFormatted = "+$2.4B (+$2,400M)",
                    stalenessFlag = "fresh",
                    sparklineJson = "652,660,668,674,679,682.5,684.2",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Reserve Bank of India total liquid foreign reserves defending currency volatility.",
                    telemetryDiagnostic = "RBI Weekly Statistical Supplement."
                ),
                MetricEntity(
                    id = "upi_monthly_volume",
                    name = "UPI Monthly Volume Run-rate",
                    category = "india",
                    currentValue = 242.0,
                    formattedValue = "$242.0B",
                    unit = "USD Billions",
                    delta24h = 6.8,
                    deltaFormatted = "+14.2% YoY",
                    stalenessFlag = "fresh",
                    sparklineJson = "210,218,224,230,235,239,242",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Unified Payments Interface processed transactions run-rate diagnosing consumption velocity.",
                    telemetryDiagnostic = "National Payments Corporation of India (NPCI)."
                ),
                MetricEntity(
                    id = "india_core_cpi",
                    name = "India Core CPI Inflation YoY",
                    category = "india",
                    currentValue = 3.12,
                    formattedValue = "3.12%",
                    unit = "% YoY",
                    delta24h = -0.18,
                    deltaFormatted = "-0.18% MoM",
                    stalenessFlag = "fresh",
                    sparklineJson = "3.85,3.7,3.52,3.4,3.28,3.2,3.12",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Headline CPI excluding volatile food and fuel components monitored by MPC.",
                    telemetryDiagnostic = "Ministry of Statistics and Programme Implementation (MoSPI)."
                ),
                MetricEntity(
                    id = "india_trade_deficit",
                    name = "India Merchandise Trade Deficit",
                    category = "india",
                    currentValue = -23.5,
                    formattedValue = "-$23.5B",
                    unit = "USD Billions",
                    delta24h = -1.2,
                    deltaFormatted = "-$1.2B MoM",
                    stalenessFlag = "lagged",
                    sparklineJson = "-20.4,-21.2,-22,-21.8,-22.5,-23.1,-23.5",
                    asOfDate = "2026-09-01",
                    conceptBrief = "Monthly trade gap between physical imports and exports driving Current Account Deficit.",
                    telemetryDiagnostic = "Ministry of Commerce & Industry, India."
                ),

                // 7. DE-DOLLARIZATION & TRADE
                MetricEntity(
                    id = "central_bank_gold_reserves",
                    name = "Global Central Bank Gold Purchases",
                    category = "dedollar",
                    currentValue = 290.0,
                    formattedValue = "290 Tonnes",
                    unit = "Metric Tonnes",
                    delta24h = 28.0,
                    deltaFormatted = "+28T QoQ",
                    stalenessFlag = "lagged",
                    sparklineJson = "210,230,245,260,275,282,290",
                    asOfDate = "2026-09-01",
                    conceptBrief = "Sovereign reserves shifting from foreign fiat assets into physical gold bullion.",
                    telemetryDiagnostic = "World Gold Council & IMF International Financial Statistics."
                ),
                MetricEntity(
                    id = "bilateral_non_usd_share",
                    name = "BRICS+ Non-USD Trade Share",
                    category = "dedollar",
                    currentValue = 28.4,
                    formattedValue = "28.4%",
                    unit = "% of Bilateral Trade",
                    delta24h = 0.5,
                    deltaFormatted = "+3.1% YoY",
                    stalenessFlag = "lagged",
                    sparklineJson = "22,23.4,24.8,25.9,27,27.8,28.4",
                    asOfDate = "2026-09-01",
                    conceptBrief = "Share of intra-bloc trade settled in local or bilateral clearing currencies.",
                    telemetryDiagnostic = "UN Comtrade & Customs Disclosures."
                ),
                MetricEntity(
                    id = "swift_usd_share",
                    name = "SWIFT USD Global Payment Share",
                    category = "dedollar",
                    currentValue = 46.8,
                    formattedValue = "46.8%",
                    unit = "% Market Share",
                    delta24h = -0.6,
                    deltaFormatted = "-0.6% MoM",
                    stalenessFlag = "fresh",
                    sparklineJson = "48.5,48.2,47.9,47.5,47.1,47,46.8",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Dominance ratio of USD across international cross-border bank messaging networks.",
                    telemetryDiagnostic = "SWIFT RMB & Global Currency Tracker."
                ),

                // 8. CORPORATE CREDIT & TRANSMISSION
                MetricEntity(
                    id = "us_high_yield_oas",
                    name = "US High Yield OAS Spread",
                    category = "credit",
                    currentValue = 324.0,
                    formattedValue = "324 bps",
                    unit = "Basis Points",
                    delta24h = -8.0,
                    deltaFormatted = "-8.0 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "365,355,348,340,335,329,324",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Option-adjusted spread premium required by investors to hold speculative US debt.",
                    telemetryDiagnostic = "ICE BofA US High Yield Index (BAMLH0A0HYM2)."
                ),
                MetricEntity(
                    id = "us_ig_oas",
                    name = "US Investment Grade OAS",
                    category = "credit",
                    currentValue = 94.0,
                    formattedValue = "94 bps",
                    unit = "Basis Points",
                    delta24h = -2.0,
                    deltaFormatted = "-2.0 bps",
                    stalenessFlag = "fresh",
                    sparklineJson = "110,106,102,99,97,95.5,94",
                    asOfDate = "2026-09-11",
                    conceptBrief = "Credit risk compensation for BBB/A rated corporate debt over equivalent Treasuries.",
                    telemetryDiagnostic = "ICE BofA US Corporate Index (BAMLC0A0CM)."
                ),
                MetricEntity(
                    id = "distressed_debt_ratio",
                    name = "US Distressed Corporate Debt Ratio",
                    category = "credit",
                    currentValue = 5.8,
                    formattedValue = "5.8%",
                    unit = "% of Issues",
                    delta24h = -0.4,
                    deltaFormatted = "-0.4% MoM",
                    stalenessFlag = "lagged",
                    sparklineJson = "7.2,6.9,6.5,6.3,6.1,5.9,5.8",
                    asOfDate = "2026-09-01",
                    conceptBrief = "Percentage of speculative-grade issues trading with OAS spreads >1,000 bps.",
                    telemetryDiagnostic = "S&P Global Ratings Corporate Distress Telemetry."
                )
            )

            dao.upsertMetrics(fullCatalog)

            // Seed initial institutional alerts if empty
            val alerts = dao.getAllAlerts().firstOrNull()
            if (alerts.isNullOrEmpty()) {
                dao.insertAlert(
                    AlertRuleEntity(
                        id = "rule-1",
                        metricId = "reverse_repo",
                        metricName = "Overnight Reverse Repo",
                        condition = "LESS_THAN",
                        thresholdValue = 200.0,
                        thresholdFormatted = "Drain < $200.0B",
                        isActive = true
                    )
                )
                dao.insertAlert(
                    AlertRuleEntity(
                        id = "rule-2",
                        metricId = "us_10y_yield",
                        metricName = "US 10Y Yield",
                        condition = "GREATER_THAN",
                        thresholdValue = 4.50,
                        thresholdFormatted = "Yield > 4.50%",
                        isActive = true
                    )
                )
            }
        }
    }
}
