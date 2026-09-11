package com.graphiquestor.terminal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.ui.components.DeskConceptPill
import com.graphiquestor.terminal.ui.components.MobileMetricCard
import com.graphiquestor.terminal.ui.components.MobileRegimeCard
import com.graphiquestor.terminal.ui.theme.EmeraldNormalcy
import com.graphiquestor.terminal.ui.theme.ObsidianVoid
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.theme.TextWhite
import com.graphiquestor.terminal.ui.viewmodel.TelemetryViewModel

@Composable
fun StreamScreen(
    viewModel: TelemetryViewModel,
    modifier: Modifier = Modifier
) {
    val regime by viewModel.currentRegime.collectAsState()
    val metrics by viewModel.allMetrics.collectAsState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianVoid)
            .padding(horizontal = 16.dp)
    ) {
        // App Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "GRAPHIQUESTOR",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "MACRO INTELLIGENCE STREAM",
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextMuted
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(EmeraldNormalcy)
                )
                Text(
                    text = "LIVE NY FEDWIRE",
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                    color = EmeraldNormalcy,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            // Desk concept brief pill
            item {
                DeskConceptPill(
                    title = "What this stream tracks (30-sec brief)",
                    coreThesis = "Monitors real-time central bank liquidity extraction (ON RRP, TGA drain) vs private market credit impulse to diagnose regime inflection points."
                )
            }

            // Hero Systemic Regime Card
            item {
                MobileRegimeCard(regime = regime)
            }

            // List of live telemetry cards
            items(metrics, key = { it.id }) { metric ->
                MobileMetricCard(
                    metric = metric,
                    onTogglePin = { id, pinned -> viewModel.togglePin(id, pinned) }
                )
            }
        }
    }
}
