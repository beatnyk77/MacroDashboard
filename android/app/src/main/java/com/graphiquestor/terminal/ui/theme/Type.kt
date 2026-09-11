package com.graphiquestor.terminal.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.graphiquestor.terminal.R

// Institutional Brand Typography identical to graphiquestor.com
val InterFontFamily = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
    Font(R.font.inter_black, FontWeight.Black),
)

val FiraCodeFontFamily = FontFamily(
    Font(R.font.firacode_regular, FontWeight.Normal),
    Font(R.font.firacode_semibold, FontWeight.SemiBold),
    Font(R.font.firacode_bold, FontWeight.Bold),
)

val FiraSansFontFamily = FontFamily(
    Font(R.font.firasans_regular, FontWeight.Normal),
    Font(R.font.firasans_bold, FontWeight.Bold),
    Font(R.font.firasans_black, FontWeight.Black),
)

// Aliases for compatibility
val SpaceGrotesk = InterFontFamily
val JetBrainsMono = FiraCodeFontFamily
val Inter = InterFontFamily

val Typography = Typography(
    headlineLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Black, // Matches website font-black branding
        fontSize = 26.sp,
        lineHeight = 32.sp,
        letterSpacing = (-0.02).sp, // Matches website tracking-heading (-0.02em)
        color = TextWhite
    ),
    headlineMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 22.sp,
        letterSpacing = (-0.02).sp,
        color = TextWhite
    ),
    headlineSmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 18.sp,
        letterSpacing = (-0.01).sp,
        color = TextPrimary
    ),
    bodyLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp,
        letterSpacing = (-0.01).sp,
        color = TextPrimary
    ),
    bodyMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.sp,
        color = TextPrimary
    ),
    bodySmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.sp,
        color = TextMuted
    ),
    labelLarge = TextStyle(
        fontFamily = FiraCodeFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.02).sp,
        color = TextWhite
    ),
    labelMedium = TextStyle(
        fontFamily = FiraCodeFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.02.sp,
        color = TextPrimary
    ),
    labelSmall = TextStyle(
        fontFamily = FiraCodeFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 10.sp,
        lineHeight = 12.sp,
        letterSpacing = 0.04.sp,
        color = TextMuted
    )
)
