package com.graphiquestor.terminal.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarOutline
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.graphiquestor.terminal.data.local.MetricEntity
import com.graphiquestor.terminal.ui.theme.AmberWarning
import com.graphiquestor.terminal.ui.theme.CyanVector
import com.graphiquestor.terminal.ui.theme.EmeraldNormalcy
import com.graphiquestor.terminal.ui.theme.GlassSurface
import com.graphiquestor.terminal.ui.theme.GlassSurfaceElevated
import com.graphiquestor.terminal.ui.theme.HairlineBorder
import com.graphiquestor.terminal.ui.theme.RoseStress
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.theme.TextPrimary
import com.graphiquestor.terminal.ui.theme.TextWhite

@Composable
fun MobileMetricCard(
    metric: MetricEntity,
    onTogglePin: (String, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    val sparklinePoints = remember(metric.sparklineJson) {
        metric.sparklineJson.split(",")
            .mapNotNull { it.trim().toDoubleOrNull() }
            .ifEmpty { listOf(10.0, 12.0, 11.0, 14.0) }
    }

    val deltaColor = when {
        metric.deltaFormatted?.startsWith("+") == true -> EmeraldNormalcy
        metric.deltaFormatted?.startsWith("-") == true -> RoseStress
        else -> CyanVector
    }

    val freshnessColor = when (metric.stalenessFlag) {
        "fresh" -> EmeraldNormalcy
        "lagged" -> AmberWarning
        else -> RoseStress
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .background(GlassSurface)
            .border(1.dp, HairlineBorder, RoundedCornerShape(6.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Top row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = metric.name,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = metric.unit,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextMuted
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(2.dp))
                        .background(freshnessColor.copy(alpha = 0.12f))
                        .padding(horizontal = 4.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = metric.stalenessFlag.uppercase(),
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = freshnessColor
                    )
                }

                IconButton(
                    onClick = { onTogglePin(metric.id, metric.isPinned) },
                    modifier = Modifier.padding(start = 4.dp)
                ) {
                    Icon(
                        imageVector = if (metric.isPinned) Icons.Filled.Star else Icons.Outlined.StarOutline,
                        contentDescription = "Pin Metric",
                        tint = if (metric.isPinned) AmberWarning else TextMuted
                    )
                }
            }
        }

        // Value & Sparkline row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            Column {
                Text(
                    text = metric.formattedValue,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = TextWhite
                )
                if (metric.deltaFormatted != null) {
                    Text(
                        text = metric.deltaFormatted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.Monospace,
                        color = deltaColor
                    )
                }
            }

            SparklineCanvas(
                points = sparklinePoints,
                color = deltaColor
            )
        }

        // Progressive Disclosure Trigger Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = Color(0xFF122131), shape = RoundedCornerShape(2.dp))
                .clickable { expanded = !expanded }
                .padding(vertical = 4.dp, horizontal = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "💡 Concept & Impact",
                fontSize = 10.sp,
                color = CyanVector
            )
            Text(
                text = if (expanded) "🛠 Telemetry ▴" else "🛠 Telemetry ▾",
                fontSize = 10.sp,
                color = TextMuted
            )
        }

        // Collapsible Drawer
        AnimatedVisibility(
            visible = expanded,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(4.dp))
                    .background(GlassSurfaceElevated)
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "PLAIN-ENGLISH CONCEPT",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted
                )
                Text(
                    text = metric.conceptBrief,
                    fontSize = 11.sp,
                    color = TextPrimary,
                    lineHeight = 14.sp
                )

                Text(
                    text = "PROVENANCE & DIAGNOSTIC",
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 4.dp)
                )
                Text(
                    text = metric.telemetryDiagnostic,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = TextMuted
                )
            }
        }
    }
}
