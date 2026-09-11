package com.graphiquestor.terminal.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "metrics")
data class MetricEntity(
    @PrimaryKey val id: String,
    val name: String,
    val category: String,
    val currentValue: Double,
    val formattedValue: String,
    val unit: String,
    val delta24h: Double?,
    val deltaFormatted: String?,
    val stalenessFlag: String,
    val sparklineJson: String, // comma-separated doubles
    val asOfDate: String,
    val conceptBrief: String,
    val telemetryDiagnostic: String,
    val isPinned: Boolean = false,
    val lastUpdated: Long = System.currentTimeMillis()
)

@Entity(tableName = "regime_cache")
data class RegimeEntity(
    @PrimaryKey val id: Int = 1,
    val compositeScore: Int,
    val stateLabel: String,
    val netLiquidityTotalTrillions: Double,
    val netLiquidityDeltaWoWBillions: Double,
    val netLiquidityDeltaWoWPercent: Double,
    val tgaDrainBillions: Double,
    val rrpAbsorptionBillions: Double,
    val fxSwapBasisStress: String,
    val cachedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "alert_rules")
data class AlertRuleEntity(
    @PrimaryKey val id: String,
    val metricId: String,
    val metricName: String,
    val condition: String,
    val thresholdValue: Double,
    val thresholdFormatted: String,
    val isActive: Boolean = true
)
