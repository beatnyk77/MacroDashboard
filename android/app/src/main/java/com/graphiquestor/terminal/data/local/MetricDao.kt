package com.graphiquestor.terminal.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface MetricDao {
    @Query("SELECT * FROM metrics ORDER BY lastUpdated DESC")
    fun getAllMetrics(): Flow<List<MetricEntity>>

    @Query("SELECT * FROM metrics WHERE isPinned = 1")
    fun getPinnedMetrics(): Flow<List<MetricEntity>>

    @Query("SELECT * FROM metrics WHERE id = :id LIMIT 1")
    suspend fun getMetricById(id: String): MetricEntity?

    @Upsert
    suspend fun upsertMetrics(metrics: List<MetricEntity>)

    @Query("UPDATE metrics SET isPinned = :pinned WHERE id = :id")
    suspend fun setPinned(id: String, pinned: Boolean)

    // Regime Cache
    @Query("SELECT * FROM regime_cache WHERE id = 1 LIMIT 1")
    fun getRegime(): Flow<RegimeEntity?>

    @Upsert
    suspend fun upsertRegime(regime: RegimeEntity)

    // Alert Rules
    @Query("SELECT * FROM alert_rules")
    fun getAllAlerts(): Flow<List<AlertRuleEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlert(alert: AlertRuleEntity)

    @Query("UPDATE alert_rules SET isActive = :active WHERE id = :id")
    suspend fun setAlertActive(id: String, active: Boolean)

    @Query("DELETE FROM alert_rules WHERE id = :id")
    suspend fun deleteAlert(id: String)
}
