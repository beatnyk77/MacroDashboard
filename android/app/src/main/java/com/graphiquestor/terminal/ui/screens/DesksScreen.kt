package com.graphiquestor.terminal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.ui.components.MobileMetricCard
import com.graphiquestor.terminal.ui.theme.CyanVector
import com.graphiquestor.terminal.ui.theme.GlassSurface
import com.graphiquestor.terminal.ui.theme.HairlineBorder
import com.graphiquestor.terminal.ui.theme.ObsidianVoid
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.theme.TextPrimary
import com.graphiquestor.terminal.ui.theme.TextWhite
import com.graphiquestor.terminal.ui.viewmodel.TelemetryViewModel

@Composable
fun DesksScreen(
    viewModel: TelemetryViewModel,
    onNavigateToDetail: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val allMetrics by viewModel.allMetrics.collectAsState()
    var selectedCategory by remember { mutableStateOf("ALL") }

    val categories = listOf(
        "ALL",
        "LIQUIDITY",
        "SOVEREIGN",
        "RATES",
        "ENERGY",
        "CHINA",
        "INDIA",
        "DE-DOLLAR",
        "CREDIT"
    )

    val filteredMetrics = remember(allMetrics, selectedCategory) {
        if (selectedCategory == "ALL") allMetrics
        else allMetrics.filter {
            when (selectedCategory) {
                "LIQUIDITY" -> it.category == "liquidity" || it.category == "global_liquidity"
                "SOVEREIGN" -> it.category == "sovereign" || it.category == "sovereign_risk"
                "RATES" -> it.category == "rates"
                "ENERGY" -> it.category == "energy"
                "CHINA" -> it.category == "china"
                "INDIA" -> it.category == "india"
                "DE-DOLLAR" -> it.category == "dedollar"
                "CREDIT" -> it.category == "credit"
                else -> true
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianVoid)
            .padding(horizontal = 16.dp)
    ) {
        // Desk Title
        Column(modifier = Modifier.padding(vertical = 12.dp)) {
            Text(
                text = "INSTITUTIONAL DESKS",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = TextWhite,
                letterSpacing = 0.5.sp
            )
            Text(
                text = "8 domain deep-dives across liquidity, sovereign credit, rates, energy & trade",
                fontSize = 11.sp,
                color = TextMuted
            )
        }

        // Horizontal Category Filter Pills
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        ) {
            items(categories) { cat ->
                val isSelected = cat == selectedCategory
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (isSelected) CyanVector.copy(alpha = 0.15f) else GlassSurface)
                        .border(
                            1.dp,
                            if (isSelected) CyanVector else HairlineBorder,
                            RoundedCornerShape(4.dp)
                        )
                        .clickable { selectedCategory = cat }
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = cat,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) CyanVector else TextMuted
                    )
                }
            }
        }

        // Metrics List
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filteredMetrics, key = { it.id }) { metric ->
                MobileMetricCard(
                    metric = metric,
                    onTogglePin = { id, pinned -> viewModel.togglePin(id, pinned) },
                    onCardClick = onNavigateToDetail
                )
            }
        }
    }
}
