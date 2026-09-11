package com.graphiquestor.terminal.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.data.local.RegimeEntity
import com.graphiquestor.terminal.ui.theme.CyanVector
import com.graphiquestor.terminal.ui.theme.EmeraldNormalcy
import com.graphiquestor.terminal.ui.theme.GlassSurface
import com.graphiquestor.terminal.ui.theme.HairlineBorder
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.theme.TextPrimary
import com.graphiquestor.terminal.ui.theme.TextWhite

@Composable
fun MobileRegimeCard(
    regime: RegimeEntity?,
    modifier: Modifier = Modifier
) {
    val score = regime?.compositeScore ?: 74
    val state = regime?.stateLabel ?: "NEUTRAL-ACCOMMODATIVE"
    val netLiq = regime?.netLiquidityTotalTrillions ?: 6.14
    val deltaWoW = regime?.netLiquidityDeltaWoWBillions ?: 42.8
    val deltaPercent = regime?.netLiquidityDeltaWoWPercent ?: 0.71

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .background(GlassSurface)
            .border(1.dp, HairlineBorder, RoundedCornerShape(6.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Top row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "GLOBAL LIQUIDITY REGIME",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextMuted,
                letterSpacing = 0.5.sp
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color(0x1F4EDEA3))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "$state ($score/100)",
                    color = EmeraldNormalcy,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Middle row: Large number and gauge
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "$${netLiq}T",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = TextWhite,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = "+$${deltaWoW}B (+${deltaPercent}%) WoW",
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.SemiBold,
                    color = EmeraldNormalcy
                )
            }

            // Circular Gauge Arc
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(56.dp)
            ) {
                Canvas(modifier = Modifier.size(56.dp)) {
                    val stroke = 5.dp.toPx()
                    drawCircle(
                        color = Color(0xFF122131),
                        style = Stroke(stroke)
                    )
                    drawArc(
                        color = CyanVector,
                        startAngle = -90f,
                        sweepAngle = (score / 100f) * 360f,
                        useCenter = false,
                        style = Stroke(stroke, cap = StrokeCap.Round)
                    )
                }
                Text(
                    text = "$score",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = CyanVector
                )
            }
        }

        // Sub-gauges grid
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = Color(0xFF122131), shape = RoundedCornerShape(2.dp))
                .padding(top = 8.dp, start = 4.dp, end = 4.dp, bottom = 4.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            SubGaugeItem(label = "TGA DRAIN", value = "$${regime?.tgaDrainBillions ?: 812}B")
            SubGaugeItem(label = "RRP BUFFER", value = "$${regime?.rrpAbsorptionBillions ?: 284.1}B")
            SubGaugeItem(label = "FX BASIS", value = regime?.fxSwapBasisStress ?: "0.12 (NORM)")
        }
    }
}

@Composable
private fun SubGaugeItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, fontSize = 9.sp, color = TextMuted)
        Text(
            text = value,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = TextPrimary
        )
    }
}
