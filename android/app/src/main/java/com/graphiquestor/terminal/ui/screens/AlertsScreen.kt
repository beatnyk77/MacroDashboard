package com.graphiquestor.terminal.ui.screens

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.review.PlayReviewManager
import com.graphiquestor.terminal.ui.theme.AmberWarning
import com.graphiquestor.terminal.ui.theme.CyanVector
import com.graphiquestor.terminal.ui.theme.EmeraldNormalcy
import com.graphiquestor.terminal.ui.theme.GlassSurface
import com.graphiquestor.terminal.ui.theme.GlassSurfaceElevated
import com.graphiquestor.terminal.ui.theme.HairlineBorder
import com.graphiquestor.terminal.ui.theme.ObsidianVoid
import com.graphiquestor.terminal.ui.theme.RoseStress
import com.graphiquestor.terminal.ui.theme.TextMuted
import com.graphiquestor.terminal.ui.theme.TextPrimary
import com.graphiquestor.terminal.ui.theme.TextWhite
import com.graphiquestor.terminal.ui.viewmodel.AlertsViewModel

@Composable
fun AlertsScreen(
    viewModel: AlertsViewModel,
    modifier: Modifier = Modifier
) {
    val alerts by viewModel.activeAlerts.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    val context = LocalContext.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianVoid)
            .padding(horizontal = 16.dp)
    ) {
        // Header row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "REGIME BREAK ALERTS",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextWhite,
                    letterSpacing = 0.5.sp
                )
                Text(
                    text = "Server-side FCM push on systemic inflection breaks",
                    fontSize = 10.sp,
                    color = TextMuted
                )
            }

            Button(
                onClick = { showAddDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = CyanVector),
                shape = RoundedCornerShape(4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "New Alert",
                    tint = ObsidianVoid
                )
                Text(
                    text = "RULE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianVoid,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Active alerts list
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(alerts, key = { it.id }) { rule ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(GlassSurface)
                        .border(1.dp, HairlineBorder, RoundedCornerShape(6.dp))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = rule.metricName,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextWhite
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Switch(
                                checked = rule.isActive,
                                onCheckedChange = { viewModel.toggleAlert(rule.id, it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = ObsidianVoid,
                                    checkedTrackColor = EmeraldNormalcy,
                                    uncheckedThumbColor = TextMuted,
                                    uncheckedTrackColor = GlassSurfaceElevated
                                )
                            )
                            IconButton(onClick = { viewModel.deleteAlert(rule.id) }) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete Alert",
                                    tint = RoseStress.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(2.dp))
                            .background(AmberWarning.copy(alpha = 0.12f))
                            .padding(horizontal = 6.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "TRIGGER: ${rule.thresholdFormatted}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = AmberWarning
                        )
                    }

                    Text(
                        text = "Notification: High-Priority FCM Push + Haptic Alert",
                        fontSize = 10.sp,
                        color = TextMuted
                    )
                }
            }
        }
    }

    if (showAddDialog) {
        var metricName by remember { mutableStateOf("Reverse Repo (RRP)") }
        var thresholdInput by remember { mutableStateOf("200") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            containerColor = GlassSurfaceElevated,
            titleColor = TextWhite,
            textContentColor = TextPrimary,
            title = { Text("Configure Institutional Alert") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Select threshold for instant regime shift push alert:", fontSize = 12.sp, color = TextMuted)
                    OutlinedTextField(
                        value = metricName,
                        onValueChange = { metricName = it },
                        label = { Text("Metric Name") }
                    )
                    OutlinedTextField(
                        value = thresholdInput,
                        onValueChange = { thresholdInput = it },
                        label = { Text("Threshold Value") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val num = thresholdInput.toDoubleOrNull() ?: 200.0
                        viewModel.addAlert("reverse_repo", metricName, "LESS_THAN", num)
                        showAddDialog = false

                        // Trigger Google Play In-App Review organically to build 5-star rating velocity
                        if (context is Activity) {
                            PlayReviewManager.requestReviewIfAppropriate(context)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CyanVector)
                ) {
                    Text("CREATE RULE", color = ObsidianVoid, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("CANCEL", color = TextMuted)
                }
            }
        )
    }
}
