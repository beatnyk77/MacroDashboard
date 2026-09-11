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
            // If offline, ensure we have initial institutional fallback data populated
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

    private suspend fun seedDefaultDataIfEmpty() {
        val existing = dao.getAllMetrics().firstOrNull()
        if (existing.isNullOrEmpty()) {
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
            dao.upsertMetrics(
                listOf(
                    MetricEntity(
                        id = "fed_net_liquidity",
                        name = "US Fed Net Liquidity",
                        category = "global_liquidity",
                        currentValue = 6142.0,
                        formattedValue = "$6,142B",
                        unit = "USD Billions",
                        delta24h = 18.4,
                        deltaFormatted = "+$18.4B (+0.30%)",
                        stalenessFlag = "fresh",
                        sparklineJson = "6100,6110,6125,6142",
                        asOfDate = "2026-09-11",
                        conceptBrief = "WALCL minus WTREGEN minus RRPONTSYD. Primary systemic expansion vector.",
                        telemetryDiagnostic = "H.4.1 Fed Statistical Release via NY Fed."
                    ),
                    MetricEntity(
                        id = "reverse_repo",
                        name = "Overnight Reverse Repo (ON RRP)",
                        category = "global_liquidity",
                        currentValue = 284.1,
                        formattedValue = "$284.1B",
                        unit = "USD Billions",
                        delta24h = -12.3,
                        deltaFormatted = "-$12.3B (-4.15%)",
                        stalenessFlag = "fresh",
                        sparklineJson = "320,310,295,284.1",
                        asOfDate = "2026-09-11",
                        conceptBrief = "Cash parking facility at NY Fed. Drain indicates systemic cash absorption.",
                        telemetryDiagnostic = "Daily 13:15 ET NY Fed Markets Desk operational result."
                    ),
                    MetricEntity(
                        id = "china_credit_impulse",
                        name = "China Credit Impulse (% GDP)",
                        category = "sovereign_risk",
                        currentValue = -2.14,
                        formattedValue = "-2.14%",
                        unit = "% of GDP",
                        delta24h = -0.40,
                        deltaFormatted = "-0.40% MoM",
                        stalenessFlag = "lagged",
                        sparklineJson = "-1.5,-1.8,-1.95,-2.14",
                        asOfDate = "2026-09-08",
                        conceptBrief = "12M rolling change in Total Social Financing acceleration relative to GDP.",
                        telemetryDiagnostic = "PBoC synthetic aggregate data via Bloomberg/Wind."
                    ),
                    MetricEntity(
                        id = "us_10y_yield",
                        name = "US 10Y Benchmark Yield",
                        category = "rates",
                        currentValue = 4.284,
                        formattedValue = "4.284%",
                        unit = "%",
                        delta24h = 0.038,
                        deltaFormatted = "+3.8 bps",
                        stalenessFlag = "fresh",
                        sparklineJson = "4.20,4.22,4.25,4.284",
                        asOfDate = "2026-09-11",
                        conceptBrief = "Global benchmark risk-free hurdle rate for institutional capital allocation.",
                        telemetryDiagnostic = "Real-time Treasury CME basis."
                    )
                )
            )
            // Seed initial institutional alerts
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
