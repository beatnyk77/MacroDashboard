package com.graphiquestor.terminal.ui.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Timeline
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.ui.screens.AlertsScreen
import com.graphiquestor.terminal.ui.screens.DesksScreen
import com.graphiquestor.terminal.ui.screens.MetricDetailScreen
import com.graphiquestor.terminal.ui.screens.StreamScreen
import com.graphiquestor.terminal.ui.screens.WatchlistScreen
import com.graphiquestor.terminal.ui.theme.CyanVector
import com.graphiquestor.terminal.ui.theme.GlassSurface
import com.graphiquestor.terminal.ui.theme.HairlineBorder
import com.graphiquestor.terminal.ui.theme.ObsidianVoid
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.viewmodel.AlertsViewModel
import com.graphiquestor.terminal.ui.viewmodel.TelemetryViewModel

sealed class Screen(val title: String, val icon: ImageVector) {
    object Stream : Screen("Stream", Icons.Filled.Timeline)
    object Desks : Screen("Desks", Icons.Filled.GridView)
    object Alerts : Screen("Alerts", Icons.Filled.Notifications)
    object Watchlist : Screen("Watch", Icons.Filled.Star)
}

@Composable
fun AppNavHost(
    telemetryViewModel: TelemetryViewModel,
    alertsViewModel: AlertsViewModel
) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var selectedMetricId by rememberSaveable { mutableStateOf<String?>(null) }
    val items = listOf(Screen.Stream, Screen.Desks, Screen.Alerts, Screen.Watchlist)

    BackHandler(enabled = selectedMetricId != null) {
        selectedMetricId = null
    }

    if (selectedMetricId != null) {
        MetricDetailScreen(
            metricId = selectedMetricId!!,
            viewModel = telemetryViewModel,
            onBack = { selectedMetricId = null },
            onNavigateToAlerts = {
                selectedMetricId = null
                selectedTab = 2
            }
        )
    } else {
        Scaffold(
            containerColor = ObsidianVoid,
            bottomBar = {
                NavigationBar(
                    containerColor = GlassSurface,
                    modifier = Modifier.border(1.dp, HairlineBorder)
                ) {
                    items.forEachIndexed { index, screen ->
                        NavigationBarItem(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title, fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = CyanVector,
                                selectedTextColor = CyanVector,
                                indicatorColor = GlassSurface,
                                unselectedIconColor = TextMuted,
                                unselectedTextColor = TextMuted
                            )
                        )
                    }
                }
            }
        ) { innerPadding ->
            val modifier = Modifier.padding(innerPadding)
            when (selectedTab) {
                0 -> StreamScreen(
                    viewModel = telemetryViewModel,
                    onNavigateToDetail = { selectedMetricId = it },
                    modifier = modifier
                )
                1 -> DesksScreen(
                    viewModel = telemetryViewModel,
                    onNavigateToDetail = { selectedMetricId = it },
                    modifier = modifier
                )
                2 -> AlertsScreen(
                    viewModel = alertsViewModel,
                    modifier = modifier
                )
                3 -> WatchlistScreen(
                    viewModel = telemetryViewModel,
                    onNavigateToDetail = { selectedMetricId = it },
                    modifier = modifier
                )
            }
        }
    }
}
