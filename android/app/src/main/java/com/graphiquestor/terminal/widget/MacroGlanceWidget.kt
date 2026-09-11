package com.graphiquestor.terminal.widget

import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

class MacroGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            Column(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(ColorProvider(Color(0xFF0B0F19)))
                    .padding(14.dp),
                verticalAlignment = Alignment.Top,
                horizontalAlignment = Alignment.Start
            ) {
                // Top Tag & Status
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "GRAPHIQUESTOR TELEMETRY",
                        style = TextStyle(
                            color = ColorProvider(Color(0xFF38BDF8)),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.height(6.dp))

                // Regime Value
                Text(
                    text = "GLOBAL LIQUIDITY: $6.14T",
                    style = TextStyle(
                        color = ColorProvider(Color.White),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                )

                Text(
                    text = "+$42.8B (+0.71%) WoW • NEUTRAL-ACCOMMODATIVE (74/100)",
                    style = TextStyle(
                        color = ColorProvider(Color(0xFF10B981)),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                )

                Spacer(modifier = GlanceModifier.height(8.dp))

                // Key Central Bank Coordinates
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ON RRP: $284B",
                        style = TextStyle(
                            color = ColorProvider(Color(0xFFD4E4FA)),
                            fontSize = 10.sp
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "TGA: $812B",
                        style = TextStyle(
                            color = ColorProvider(Color(0xFFD4E4FA)),
                            fontSize = 10.sp
                        )
                    )
                    Spacer(modifier = GlanceModifier.defaultWeight())
                    Text(
                        text = "10Y: 4.28%",
                        style = TextStyle(
                            color = ColorProvider(Color(0xFFD4E4FA)),
                            fontSize = 10.sp
                        )
                    )
                }
            }
        }
    }
}
