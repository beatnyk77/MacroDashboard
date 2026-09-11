package com.graphiquestor.terminal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.viewmodel.compose.viewModel
import com.graphiquestor.terminal.ui.navigation.AppNavHost
import com.graphiquestor.terminal.ui.theme.GraphiQuestorTheme
import com.graphiquestor.terminal.ui.viewmodel.AlertsViewModel
import com.graphiquestor.terminal.ui.viewmodel.TelemetryViewModel
import com.graphiquestor.terminal.ui.viewmodel.ViewModelFactory

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val app = application as GraphiQuestorApp
        val repository = app.repository

        setContent {
            GraphiQuestorTheme {
                val factory = ViewModelFactory(repository)
                val telemetryViewModel: TelemetryViewModel = viewModel(factory = factory)
                val alertsViewModel: AlertsViewModel = viewModel(factory = factory)

                AppNavHost(
                    telemetryViewModel = telemetryViewModel,
                    alertsViewModel = alertsViewModel
                )
            }
        }
    }
}
