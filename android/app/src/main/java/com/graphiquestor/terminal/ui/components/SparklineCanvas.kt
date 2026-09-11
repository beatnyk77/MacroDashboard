package com.graphiquestor.terminal.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.graphiquestor.terminal.ui.theme.CyanVector

@Composable
fun SparklineCanvas(
    points: List<Double>,
    color: Color = CyanVector,
    width: Dp = 90.dp,
    height: Dp = 32.dp,
    modifier: Modifier = Modifier
) {
    if (points.size < 2) return

    val min = points.minOrNull() ?: 0.0
    val max = points.maxOrNull() ?: 1.0
    val range = if (max == min) 1.0 else max - min

    Canvas(
        modifier = modifier
            .width(width)
            .height(height)
    ) {
        val w = size.width
        val h = size.height
        val stepX = w / (points.size - 1)

        val strokePath = Path()
        val fillPath = Path()

        points.forEachIndexed { i, pt ->
            val normY = (1.0 - (pt - min) / range).toFloat()
            val x = i * stepX
            val y = (normY * (h - 8.dp.toPx())) + 4.dp.toPx()

            if (i == 0) {
                strokePath.moveTo(x, y)
                fillPath.moveTo(x, h)
                fillPath.lineTo(x, y)
            } else {
                strokePath.lineTo(x, y)
                fillPath.lineTo(x, y)
            }
        }
        fillPath.lineTo(w, h)
        fillPath.close()

        // Draw translucent gradient fill
        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.25f), Color.Transparent),
                startY = 0f,
                endY = h
            )
        )

        // Draw line
        drawPath(
            path = strokePath,
            color = color,
            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
        )

        // Highlight latest point
        val lastPt = points.last()
        val lastNormY = (1.0 - (lastPt - min) / range).toFloat()
        val lastX = w
        val lastY = (lastNormY * (h - 8.dp.toPx())) + 4.dp.toPx()
        drawCircle(
            color = color,
            radius = 3.dp.toPx(),
            center = androidx.compose.ui.geometry.Offset(lastX, lastY)
        )
    }
}
