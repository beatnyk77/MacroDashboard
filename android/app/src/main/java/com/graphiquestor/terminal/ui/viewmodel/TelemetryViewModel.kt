package com.graphiquestor.terminal.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.graphiquestor.terminal.data.local.MetricEntity
import com.graphiquestor.terminal.data.local.RegimeEntity
import com.graphiquestor.terminal.data.repository.TelemetryRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class TelemetryViewModel(
    private val repository: TelemetryRepository
) : ViewModel() {

    val allMetrics: StateFlow<List<MetricEntity>> = repository.allMetrics
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val pinnedMetrics: StateFlow<List<MetricEntity>> = repository.pinnedMetrics
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentRegime: StateFlow<RegimeEntity?> = repository.currentRegime
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            repository.refreshTelemetry()
        }
    }

    fun togglePin(id: String, currentPinned: Boolean) {
        viewModelScope.launch {
            repository.togglePinMetric(id, currentPinned)
        }
    }

    fun getMetric(id: String) = repository.observeMetric(id)
}
