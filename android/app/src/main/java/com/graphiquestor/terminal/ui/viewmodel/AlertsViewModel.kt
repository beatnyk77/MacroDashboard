package com.graphiquestor.terminal.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.graphiquestor.terminal.data.local.AlertRuleEntity
import com.graphiquestor.terminal.data.repository.TelemetryRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

class AlertsViewModel(
    private val repository: TelemetryRepository
) : ViewModel() {

    val activeAlerts: StateFlow<List<AlertRuleEntity>> = repository.activeAlerts
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun toggleAlert(id: String, active: Boolean) {
        viewModelScope.launch {
            repository.toggleAlert(id, active)
        }
    }

    fun deleteAlert(id: String) {
        viewModelScope.launch {
            repository.deleteAlert(id)
        }
    }

    fun addAlert(metricId: String, metricName: String, condition: String, threshold: Double) {
        viewModelScope.launch {
            val rule = AlertRuleEntity(
                id = UUID.randomUUID().toString(),
                metricId = metricId,
                metricName = metricName,
                condition = condition,
                thresholdValue = threshold,
                thresholdFormatted = if (condition == "LESS_THAN") "< $threshold" else "> $threshold",
                isActive = true
            )
            repository.createAlert(rule)
        }
    }
}
