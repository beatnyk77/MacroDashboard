package com.graphiquestor.terminal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.ui.components.MobileMetricCard
import com.graphiquestor.terminal.ui.theme.CyanVector
import com.graphiquestor.terminal.ui.theme.ObsidianVoid
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.theme.TextWhite
import com.graphiquestor.terminal.ui.viewmodel.TelemetryViewModel

@Composable
fun WatchlistScreen(
    viewModel: TelemetryViewModel,
    modifier: Modifier = Modifier
) {
    val pinnedMetrics by viewModel.pinnedMetrics.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianVoid)
            .padding(horizontal = 16.dp)
    ) {
        Column(modifier = Modifier.padding(vertical = 12.dp)) {
            Text(
                text = "PINNED WATCHLIST",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = TextWhite,
                letterSpacing = 0.5.sp
            )
            Text(
                text = "Your custom high-priority macro vectors & tickers",
                fontSize = 11.sp,
                color = TextMuted
            )
        }

        if (pinnedMetrics.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No metrics pinned yet.\n\nTap the star icon (★) on any telemetry card in the Stream or Desks to pin it here.",
                    textAlign = TextAlign.Center,
                    fontSize = 13.sp,
                    color = TextMuted,
                    lineHeight = 18.sp
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(pinnedMetrics, key = { it.id }) { metric ->
                    MobileMetricCard(
                        metric = metric,
                        onTogglePin = { id, pinned -> viewModel.togglePin(id, pinned) }
                    )
                }
            }
        }
    }
}
