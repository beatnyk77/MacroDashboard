import SwiftUI

public struct InstitutionalMetricCardView: View {
    public let metric: MacroMetricEntity
    @State private var isExpanded: Bool = false

    public init(metric: MacroMetricEntity) {
        self.metric = metric
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Top Row: Metric Name, Freshness Chip, and Source
            HStack {
                Text(metric.name)
                    .font(.spaceGrotesk(size: 13, weight: .bold))
                    .foregroundColor(.dataWhite)
                    .lineLimit(1)

                Spacer()

                // Staleness Chip
                HStack(spacing: 3) {
                    Circle()
                        .fill(freshnessColor(for: metric.stalenessFlag))
                        .frame(width: 5, height: 5)

                    Text(metric.stalenessFlag.uppercased())
                        .font(.jetBrainsMono(size: 8, weight: .bold))
                        .foregroundColor(freshnessColor(for: metric.stalenessFlag))
                }
                .padding(.horizontal, 5)
                .padding(.vertical, 2)
                .background(freshnessColor(for: metric.stalenessFlag).opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 2))
            }

            // Middle Row: Big Tabular Value & Sparkline
            HStack(alignment: .bottom, spacing: 8) {
                VStack(alignment: .leading, spacing: 1) {
                    HStack(alignment: .firstTextBaseline, spacing: 3) {
                        Text(metric.displayFormattedValue)
                            .font(.jetBrainsMono(size: 18, weight: .bold))
                            .monospacedDigit()
                            .foregroundColor(.dataWhite)

                        Text(metric.unit)
                            .font(.jetBrainsMono(size: 9, weight: .medium))
                            .foregroundColor(.mutedSlate)
                    }

                    // Delta Value
                    HStack(spacing: 4) {
                        Image(systemName: metric.deltaDirection == "UP" ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(significanceColor(for: metric.deltaSignificance))

                        Text(metric.deltaValue)
                            .font(.jetBrainsMono(size: 10, weight: .semibold))
                            .monospacedDigit()
                            .foregroundColor(significanceColor(for: metric.deltaSignificance))

                        Text("(\(metric.deltaSignificance.capitalized))")
                            .font(.inter(size: 9, weight: .regular))
                            .foregroundColor(.mutedSlate)
                    }
                }

                Spacer()

                // Mini Sparkline preview
                miniSparklineView(points: metric.sparklinePoints)
                    .frame(width: 80, height: 28)
            }

            // Bottom Disclosure Trigger: Concept & Institutional Impact
            Button(action: { withAnimation(.easeInOut(duration: 0.2)) { isExpanded.toggle() } }) {
                HStack {
                    HStack(spacing: 4) {
                        Text("💡")
                            .font(.system(size: 9))
                        Text(isExpanded ? "Hide Methodology & Impact" : "Concept & Institutional Impact ▾")
                            .font(.inter(size: 10, weight: .medium))
                            .foregroundColor(.cyanVector)
                    }

                    Spacer()

                    Text("\(metric.sourceName) · \(metric.observationDate)")
                        .font(.jetBrainsMono(size: 8, weight: .regular))
                        .foregroundColor(.mutedSlate)
                }
                .padding(.top, 4)
                .border(Color.hairlineBorder.opacity(0.6), width: 0.5)
            }

            // Expanded Analytical Drawer (Desktop-equivalent Concept & Diagnostics)
            if isExpanded {
                VStack(alignment: .leading, spacing: 6) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("WHAT THIS TRACKS:")
                            .font(.jetBrainsMono(size: 8, weight: .bold))
                            .foregroundColor(.cyanVector)

                        Text(metric.conceptSummary)
                            .font(.inter(size: 11, weight: .regular))
                            .foregroundColor(.dataWhite)
                            .lineSpacing(1.2)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text("INSTITUTIONAL TRANSMISSION:")
                            .font(.jetBrainsMono(size: 8, weight: .bold))
                            .foregroundColor(.emeraldNormalcy)

                        Text(metric.institutionalSignificance)
                            .font(.inter(size: 11, weight: .regular))
                            .foregroundColor(.mutedSlate)
                            .lineSpacing(1.2)
                    }
                }
                .padding(8)
                .background(Color.obsidianVoid)
                .clipShape(RoundedRectangle(cornerRadius: 3))
                .overlay(
                    RoundedRectangle(cornerRadius: 3)
                        .stroke(Color.hairlineBorder, lineWidth: 0.8)
                )
            }
        }
        .padding(12)
        .glassCard(cornerRadius: 4, borderColor: .hairlineBorder, backgroundColor: .subSurface)
    }

    private func miniSparklineView(points: [Double]) -> some View {
        GeometryReader { geo in
            if points.count > 1 {
                let minVal = points.min() ?? 0
                let maxVal = points.max() ?? 1
                let range = max(maxVal - minVal, 0.0001)

                Path { path in
                    for (index, val) in points.enumerated() {
                        let x = geo.size.width * CGFloat(index) / CGFloat(points.count - 1)
                        let normalizedY = CGFloat((val - minVal) / range)
                        let y = geo.size.height * (1.0 - normalizedY)
                        if index == 0 {
                            path.move(to: CGPoint(x: x, y: y))
                        } else {
                            path.addLine(to: CGPoint(x: x, y: y))
                        }
                    }
                }
                .stroke(significanceColor(for: metric.deltaSignificance), lineWidth: 1.5)
            } else {
                Rectangle()
                    .fill(Color.hairlineBorder)
            }
        }
    }

    private func freshnessColor(for flag: String) -> Color {
        switch flag.lowercased() {
        case "fresh": return .emeraldNormalcy
        case "lagged": return .amberWarning
        default: return .roseStress
        }
    }

    private func significanceColor(for sig: String) -> Color {
        switch sig.uppercased() {
        case "STIMULATIVE": return .emeraldNormalcy
        case "RESTRICTIVE", "STRESS": return .roseStress
        case "WARNING": return .amberWarning
        default: return .cyanVector
        }
    }
}
