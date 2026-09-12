import SwiftUI

public struct HeroRegimeGaugeView: View {
    public let regime: MacroRegimeEntity?

    public init(regime: MacroRegimeEntity?) {
        self.regime = regime
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("SYSTEMIC LIQUIDITY REGIME")
                        .font(.jetBrainsMono(size: 9, weight: .semibold))
                        .tracking(0.5)
                        .foregroundColor(.mutedSlate)

                    Text(regime?.statusName ?? "NEUTRAL-ACCOMMODATIVE")
                        .font(.spaceGrotesk(size: 16, weight: .bold))
                        .foregroundColor(.emeraldNormalcy)
                }

                Spacer()

                // Circular Score Badge
                ZStack {
                    Circle()
                        .stroke(Color.hairlineBorder, lineWidth: 3)
                        .frame(width: 44, height: 44)

                    Circle()
                        .trim(from: 0, to: CGFloat(regime?.score ?? 74) / 100.0)
                        .stroke(
                            LinearGradient(
                                colors: [.cyanVector, .emeraldNormalcy],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .frame(width: 44, height: 44)

                    Text("\(regime?.score ?? 74)")
                        .font(.spaceGrotesk(size: 15, weight: .bold))
                        .foregroundColor(.dataWhite)
                }
            }

            // Net Liquidity Delta
            HStack(spacing: 6) {
                Text("Net Liquidity Delta:")
                    .font(.inter(size: 11, weight: .regular))
                    .foregroundColor(.mutedSlate)

                let delta = regime?.netLiquidityDeltaUSD ?? 42.8
                let prefix = delta >= 0 ? "+" : ""
                let percent = regime?.netLiquidityDeltaWoWPercent ?? 0.71
                Text("\(prefix)$\(String(format: "%.1f", delta))B WoW (+\(String(format: "%.2f", percent))%)")
                    .font(.jetBrainsMono(size: 11, weight: .bold))
                    .monospacedDigit()
                    .foregroundColor(.emeraldNormalcy)
            }
            .padding(.vertical, 2)

            Divider()
                .background(Color.hairlineBorder)

            // 3-Column Micro-Metrics Grid
            HStack(spacing: 8) {
                microMetricColumn(
                    title: "TGA DRAIN",
                    value: "+$\(String(format: "%.1f", regime?.tgaDrainUSD ?? 38.4))B",
                    status: "Stimulative",
                    color: .emeraldNormalcy
                )

                Divider()
                    .frame(height: 32)
                    .background(Color.hairlineBorder)

                microMetricColumn(
                    title: "RRP BUFFER",
                    value: "$\(String(format: "%.1f", regime?.rrpBufferUSD ?? 284.1))B",
                    status: "18d to floor",
                    color: .cyanVector
                )

                Divider()
                    .frame(height: 32)
                    .background(Color.hairlineBorder)

                microMetricColumn(
                    title: "FX SWAP BASIS",
                    value: "\(String(format: "%.1f", regime?.fxSwapBasisBps ?? -12.4)) bps",
                    status: "Mild stress",
                    color: .amberWarning
                )
            }
        }
        .padding(14)
        .glassCard(cornerRadius: 6, borderColor: .activeBorder.opacity(0.8), backgroundColor: .glassSurface)
    }

    private func microMetricColumn(
        title: String,
        value: String,
        status: String,
        color: Color
    ) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.jetBrainsMono(size: 8, weight: .semibold))
                .foregroundColor(.mutedSlate)

            Text(value)
                .font(.jetBrainsMono(size: 11, weight: .bold))
                .monospacedDigit()
                .foregroundColor(.dataWhite)

            Text(status)
                .font(.inter(size: 9, weight: .regular))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
