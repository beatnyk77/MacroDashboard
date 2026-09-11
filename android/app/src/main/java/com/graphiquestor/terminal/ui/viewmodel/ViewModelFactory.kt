package com.graphiquestor.terminal.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.graphiquestor.terminal.data.repository.TelemetryRepository

class ViewModelFactory(
    private val repository: TelemetryRepository
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(TelemetryViewModel::class.java) -> {
                TelemetryViewModel(repository) as T
            }
            modelClass.isAssignableFrom(AlertsViewModel::class.java) -> {
                AlertsViewModel(repository) as T
            }
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
