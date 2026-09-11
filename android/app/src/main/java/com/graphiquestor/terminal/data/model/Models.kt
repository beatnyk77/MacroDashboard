package com.graphiquestor.terminal.data.model

import kotlinx.serialization.Serializable

@Serializable
data class MobileBootstrapResponse(
    val timestamp: String,
    val regime: RegimeDto,
    val metrics: List<MetricDto>,
    val freshness: FreshnessDto
)

@Serializable
data class RegimeDto(
    val compositeScore: Int,
    val stateLabel: String,
    val netLiquidityTotalTrillions: Double,
    val netLiquidityDeltaWoWBillions: Double,
    val netLiquidityDeltaWoWPercent: Double,
    val subVectors: SubVectorsDto
)

@Serializable
data class SubVectorsDto(
    val tgaDrainBillions: Double,
    val rrpAbsorptionBillions: Double,
    val fxSwapBasisStress: String
)

@Serializable
data class MetricDto(
    val id: String,
    val name: String,
    val category: String,
    val value: Double,
    val formattedValue: String,
    val unit: String,
    val delta24h: Double? = null,
    val deltaFormatted: String? = null,
    val stalenessFlag: String, // "fresh", "lagged", "very_lagged"
    val sparkline: List<Double> = emptyList(),
    val asOfDate: String,
    val conceptBrief: String,
    val telemetryDiagnostic: String
)

@Serializable
data class FreshnessDto(
    val lastRefreshedAt: String,
    val ttlSeconds: Int
)

data class AlertRule(
    val id: String,
    val metricId: String,
    val metricName: String,
    val condition: String, // "LESS_THAN", "GREATER_THAN", "REGIME_SHIFT"
    val thresholdValue: Double,
    val thresholdFormatted: String,
    val isActive: Boolean
)
