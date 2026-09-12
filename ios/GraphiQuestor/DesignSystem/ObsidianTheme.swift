import SwiftUI

// MARK: - Institutional Color Palette
public extension Color {
    /// Deepest slate-black canvas layer preventing OLED battery drain (#050810)
    static let obsidianVoid = Color(red: 5/255, green: 8/255, blue: 16/255)

    /// Translucent frosted glass panel surface (#0B0F19)
    static let glassSurface = Color(red: 11/255, green: 15/255, blue: 25/255)

    /// Sub-surface highlight for active data cells (#111827)
    static let subSurface = Color(red: 17/255, green: 24/255, blue: 39/255)

    /// 1pt hairline structural divider (#1E293B)
    static let hairlineBorder = Color(red: 30/255, green: 41/255, blue: 59/255)

    /// Active or focused border stroke (#334155)
    static let activeBorder = Color(red: 51/255, green: 65/255, blue: 85/255)

    /// High-readout data white (#F8FAFC)
    static let dataWhite = Color(red: 248/255, green: 250/255, blue: 252/255)

    /// Tabular muted slate (#94A3B8)
    static let mutedSlate = Color(red: 148/255, green: 163/255, blue: 184/255)

    /// Primary systemic liquidity vector / electric blue (#38BDF8 / #06B6D4)
    static let cyanVector = Color(red: 56/255, green: 189/255, blue: 248/255)

    /// Emerald normalcy / dovish net expansion (#10B981)
    static let emeraldNormalcy = Color(red: 16/255, green: 185/255, blue: 129/255)

    /// Rose stress / credit covenant breach / hawkish shock (#F43F5E)
    static let roseStress = Color(red: 244/255, green: 63/255, blue: 94/255)

    /// Amber warning / policy divergence (#F59E0B)
    static let amberWarning = Color(red: 245/255, green: 158/255, blue: 11/255)
}

// MARK: - Typography Modifiers
public extension Font {
    static func spaceGrotesk(size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        return Font.custom("SpaceGrotesk-SemiBold", size: size)
    }

    static func inter(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.custom("Inter-Regular", size: size)
    }

    static func jetBrainsMono(size: CGFloat, weight: Font.Weight = .medium) -> Font {
        return Font.custom("JetBrainsMono-Bold", size: size)
    }
}

// MARK: - Glassmorphic Card ViewModifier
public struct GlassCardModifier: ViewModifier {
    public var cornerRadius: CGFloat = 4.0
    public var borderColor: Color = .hairlineBorder
    public var backgroundColor: Color = .glassSurface

    public func body(content: Content) -> some View {
        content
            .background(backgroundColor.opacity(0.85))
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(borderColor, lineWidth: 1.0)
            )
    }
}

public extension View {
    func glassCard(
        cornerRadius: CGFloat = 4.0,
        borderColor: Color = .hairlineBorder,
        backgroundColor: Color = .glassSurface
    ) -> some View {
        self.modifier(
            GlassCardModifier(
                cornerRadius: cornerRadius,
                borderColor: borderColor,
                backgroundColor: backgroundColor
            )
        )
    }
}
